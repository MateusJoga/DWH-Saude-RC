import os
import time
import shutil
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

from pysus.online_data.SIH import SIH
from pysus.online_data.CNES import CNES

# IMPORTAÇÃO DAS ETAPAS DO PIPELINE
from transformer import ajustar_mes_base, RAW_ADJUSTED_DIR
from loader import carregar_parquet_no_banco
from dw_processor import executar_processamento_dw

# Configuração Global de Logging unificada
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DATASUS_PIPELINE")

CONFIGURACAO_BASES = {
    "cnes": {
        "loader": CNES,
        "group": "ST",
        "uf": "SP",
        "base_dir": "data/raw/cnes",
        "pasta_prefixo": "dados_cnes",
        "arquivo_prefixo": "STSP"
    },
    "sih_rd": {
        "loader": SIH,
        "group": "RD",
        "uf": "SP",
        "base_dir": "data/raw/sih",
        "pasta_prefixo": "dados_sih_rd",
        "arquivo_prefixo": "RDSP"
    },
    "sih_sp": {
        "loader": SIH,
        "group": "SP",
        "uf": "SP",
        "base_dir": "data/raw/sih",
        "pasta_prefixo": "dados_sih_sp",
        "arquivo_prefixo": "SPSP"
    }
}

def verificar_mes_consolidado(base_dir: str, arquivo_prefixo: str, ano: int, mes: int) -> bool:
    if not os.path.exists(base_dir):
        return False
    ano_dois_digitos = str(ano)[2:]
    nome_marcador = f"{arquivo_prefixo}{ano_dois_digitos}{mes:02d}.success"
    for root, dirs, files in os.walk(base_dir):
        if nome_marcador in files:
            return True
    return False

def gerar_linha_do_tempo_esperada(ano_inicio: int = 2025) -> list[tuple[int, int]]:
    linha_do_tempo = []
    data_atual = datetime.now()
    ano_corrente = ano_inicio
    mes_corrente = 1
    while (ano_corrente < data_atual.year or (ano_corrente == data_atual.year and mes_corrente <= data_atual.month)):
        linha_do_tempo.append((ano_corrente, mes_corrente))
        mes_corrente += 1
        if mes_corrente > 12:
            mes_corrente = 1
            ano_corrente += 1
    return linha_do_tempo

def processar_mes_especifico(nome_base: str, configuracao: dict, ano_atual: int, mes_atual: int, suse_instancia) -> tuple[bool, Optional[object], bool]:
    tag = nome_base.upper()
    data_limite = datetime.now()

    if verificar_mes_consolidado(configuracao["base_dir"], configuracao["arquivo_prefixo"], ano_atual, mes_atual):
        logger.info(f"[{tag}] Dados brutos de {ano_atual}-{mes_atual:02d} já existem. Pulando download.")
        return True, suse_instancia, False

    TENTATIVAS_MAXIMAS = 5
    dir_destino = os.path.join(configuracao["base_dir"], f"{configuracao['pasta_prefixo']}_{ano_atual}", f"{mes_atual:02d}")

    for tentativa in range(1, TENTATIVAS_MAXIMAS + 1):
        try:
            if os.path.exists(dir_destino):
                shutil.rmtree(dir_destino)
            os.makedirs(dir_destino, exist_ok=True)

            if suse_instancia is None:
                suse_instancia = configuracao["loader"]().load()

            logger.info(f"[{tag}] Buscando {ano_atual}-{mes_atual:02d} no DATASUS...")
            arquivos = suse_instancia.get_files(group=configuracao["group"], uf=configuracao["uf"], year=ano_atual, month=mes_atual)

            if not arquivos:
                meses_diff = (data_limite.year - ano_atual) * 12 + (data_limite.month - mes_atual)
                if meses_diff <= 3:
                    logger.warning(f"[{tag}] Dados ainda não publicados: {ano_atual}-{mes_atual:02d}")
                    return False, suse_instancia, True
                else:
                    logger.warning(f"[{tag}] Mês antigo sem dados: {ano_atual}-{mes_atual:02d}")
                    return True, suse_instancia, False

            logger.info(f"[{tag}] Baixando dados...")
            suse_instancia.download(arquivos, local_dir=dir_destino)

            ano_dois_digitos = str(ano_atual)[2:]
            nome_marcador = f"{configuracao['arquivo_prefixo']}{ano_dois_digitos}{mes_atual:02d}.success"
            with open(os.path.join(dir_destino, nome_marcador), "w") as f:
                f.write(datetime.now().isoformat())

            return True, suse_instancia, False
        except Exception as e:
            logger.warning(f"[{tag}] Tentativa {tentativa} falhou: {e}")
            suse_instancia = None
            if tentativa < TENTATIVAS_MAXIMAS:
                time.sleep(tentativa * 10)
            else:
                logger.error(f"[{tag}] Falha definitiva em {ano_atual}-{mes_atual:02d}")
    return False, suse_instancia, False

def main():
    tempo_total_inicio = time.time()
    
    parser = argparse.ArgumentParser(description="Orquestrador DATASUS ETL (Sob Demanda)")
    parser.add_argument("--ano", type=int, required=True, help="Ano de processamento (obrigatório)")
    parser.add_argument("--mes", type=int, choices=range(1, 13), help="Mês de processamento (opcional)")
    parser.add_argument(
        "--fonte", 
        type=str, 
        choices=["cnes", "sih_rd", "sih_sp", "todas"], 
        default="todas", 
        help="Fonte de dados (opcional, padrão: todas)"
    )
    parser.add_argument("--force", action="store_true", help="Força a recarga e substituição dos dados na Bronze (opcional)")
    parser.add_argument(
        "--skip-dw-process",
        action="store_true",
        help="Carrega somente a Bronze e não executa o processamento das procedures do DW (opcional)"
    )
    # NOTA / DOCUMENTAÇÃO FUTURA:
    # --force-download: futura flag para forçar o re-download físico mesmo que o bruto com marcador success já exista.
    
    args = parser.parse_args()

    ano = args.ano
    force = args.force

    # 1. Determinação dos meses
    data_atual = datetime.now()
    if args.mes:
        meses = [args.mes]
    else:
        # Se passar apenas --ano
        if ano < data_atual.year:
            # Anos passados: todos os 12 meses
            meses = list(range(1, 13))
        elif ano == data_atual.year:
            # Ano atual: meses do 1 até o mês atual
            meses = list(range(1, data_atual.month + 1))
        else:
            # Anos futuros: não há dados no DATASUS
            logger.warning(f"Ano {ano} é posterior ao ano corrente. Nenhum mês disponível para processamento.")
            meses = []

    # 2. Determinação das fontes (Ordem obrigatória: cnes, sih_rd, sih_sp)
    if args.fonte == "todas":
        fontes = ["cnes", "sih_rd", "sih_sp"]
    else:
        fontes = [args.fonte]

    # Logs Iniciais Aprimorados
    logger.info("=================================================================")
    logger.info("=== INICIANDO EXTRATOR DATASUS ETL (SOB DEMANDA) ===")
    logger.info(f"-> Ano Selecionado: {ano}")
    logger.info(f"-> Mês(es) Selecionado(s): {args.mes if args.mes else 'Todos os meses disponíveis'}")
    logger.info(f"-> Fonte(s) Selecionada(s): {args.fonte} (processando: {', '.join(fontes)})")
    logger.info(f"-> Modo Force Ativo? {'SIM (Recarga completa da bronze e regeração do parquet)' if force else 'NÃO (Carga incremental controlada)'}")
    logger.info(f"-> Processar DW ao final? {'NÃO (Skip ativo)' if args.skip_dw_process else 'SIM (Automaticamente)'}")
    logger.info("=================================================================")

    if not meses:
        logger.warning("Nenhum período disponível para processamento. Finalizando.")
        return

    instancias = {"cnes": None, "sih_rd": None, "sih_sp": None}
    sucesso_total = True

    for mes in meses:
        logger.info(f"\n==================== PERÍODO: {ano}-{mes:02d} ====================")
        parar = False

        for nome_base in fontes:
            config = CONFIGURACAO_BASES[nome_base]
            
            # ETAPA 1: DOWNLOAD
            # Nota: force-download não está implementada por decisão do usuário, mantendo skip do download se existir .success
            sucesso, Black_instancia, deve_parar = processar_mes_especifico(
                nome_base, config, ano, mes, instancias[nome_base]
            )
            instancias[nome_base] = Black_instancia

            if deve_parar:
                parar = True
                continue

            if not sucesso:
                logger.error(f"Erro crítico no download de {nome_base} em {ano}-{mes:02d}. Abortando pipeline.")
                sucesso_total = False
                break

            # ETAPA 2: AJUSTE (FILTROS)
            logger.info(f"[{nome_base.upper()}] Disparando ajuste imediato para {ano}-{mes:02d}...")
            sucesso_ajuste = ajustar_mes_base(nome_base, ano, mes, force=force)
            
            if not sucesso_ajuste:
                logger.error(f"Erro crítico no ajuste imediato de {nome_base} em {ano}-{mes:02d}. Abortando pipeline.")
                sucesso_total = False
                break

            # ETAPA 3: CARGA NO BANCO DE DADOS
            caminho_parquet = RAW_ADJUSTED_DIR / f"{nome_base}_{ano}" / f"{mes:02d}" / f"{config['arquivo_prefixo']}{str(ano)[2:]}{mes:02d}.parquet"
            sucesso_carga = carregar_parquet_no_banco(nome_base, ano, mes, caminho_parquet, force=force)

            if not sucesso_carga:
                logger.error(f"Erro crítico na carga de {nome_base} em {ano}-{mes:02d}. Abortando pipeline.")
                sucesso_total = False
                break

        if not sucesso_total or parar:
            if parar:
                logger.info("Fim dos dados publicados no DATASUS. Finalizando.")
            break

    # Chamada da procedure de processamento do DW se todas as etapas Bronze selecionadas foram concluídas com sucesso
    if sucesso_total and not args.skip_dw_process:
        logger.info("\n==================== PROCESSAMENTO DO DATA WAREHOUSE ====================")
        sucesso_dw = executar_processamento_dw()
        if not sucesso_dw:
            logger.error("Erro crítico no processamento das camadas Prata/Ouro do DW. Abortando pipeline.")
            sucesso_total = False

    # Relatório de execução final
    tempo_total_fim = time.time() - tempo_total_inicio
    logger.info("=================================================================")
    logger.info("=== FIM DA EXECUÇÃO DO ETL DATASUS ===")
    if sucesso_total:
        logger.info(f"Status Final: SUCESSO")
    else:
        logger.info(f"Status Final: ERRO (Verifique as falhas acima nos logs)")
    logger.info(f"Tempo Total: {tempo_total_fim:.2f} segundos")
    logger.info("=================================================================")

if __name__ == "__main__":
    main()