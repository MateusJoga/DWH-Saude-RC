import os
import re
from pathlib import Path
import pandas as pd
import logging

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging = logging.getLogger("DATASUS_PIPELINE") # Vincula ao logger principal

RAW_DIR = Path("data/raw")
RAW_ADJUSTED_DIR = Path("data/raw_ajusted")
COD_MUNICIPIO = "354390"

BASES_CONFIG = {
    "cnes": {
        "pasta_raw": RAW_DIR / "cnes",
        "arquivo_prefixo": "STSP",
        "colunas": [
            'CNES', 'CODUFMUN', 'COD_CEP', 'TPGESTAO', 'ESFERA_A', 'NATUREZA', 'NAT_JUR',
            'TP_UNID', 'TP_PREST', 'NIV_HIER', 'NIV_DEP', 'QTLEITP1', 'QTLEITP2',
            'LEITHOSP', 'URGEMERG', 'ATENDAMB', 'CENTRCIR', 'CENTROBS', 'CENTRNEO',
            'ATENDHOS', 'DT_ATUAL', 'COMPETEN'
        ],
        "filtro": lambda df: df['CODUFMUN'].astype(str).str.strip() == COD_MUNICIPIO
    },
    "sih_rd": {
        "pasta_raw": RAW_DIR / "sih",
        "arquivo_prefixo": "RDSP",
        "colunas": [
            'UF_ZI', 'MUNIC_RES', 'MUNIC_MOV', 'CEP', 'ANO_CMPT', 'MES_CMPT', 'DT_INTER',
            'DT_SAIDA', 'N_AIH', 'IDENT', 'ESPEC', 'CAR_INT', 'COMPLEX', 'CNES',
            'SEXO', 'COD_IDADE', 'IDADE', 'RACA_COR', 'ETNIA', 'INSTRU', 'NUM_FILHOS',
            'DIAG_PRINC', 'DIAG_SECUN', 'CID_ASSO', 'CID_MORTE',
            'VAL_SH', 'VAL_SP', 'VAL_TOT', 'VAL_UTI',
            'DIAS_PERM', 'QT_DIARIAS', 'MORTE', 'GESTAO', 'GESTOR_COD'
        ],
        "filtro": lambda df: df['MUNIC_MOV'].astype(str).str.strip() == COD_MUNICIPIO
    },
    "sih_sp": {
        "pasta_raw": RAW_DIR / "sih",
        "arquivo_prefixo": "SPSP",
        "colunas": [
            'SP_GESTOR', 'SP_UF', 'SP_CNES', 'SP_AA', 'SP_MM', 'SP_NAIH', 'SP_U_AIH',
            'SP_DTINTER', 'SP_DTSAIDA', 'SP_PROCREA', 'SP_ATOPROF', 'SP_TP_ATO',
            'SP_QTD_ATO', 'SP_QT_PROC', 'SP_VALATO', 'SP_PTSP', 'SP_FINANC', 'SP_CO_FAEC',
            'SP_PF_CBO', 'SP_CIDPRI', 'SP_CIDSEC', 'SP_COMPLEX'
        ],
        "filtro": None
    }
}

def ajustar_mes_base(base: str, ano: int, mes: int) -> bool:
    """Ajusta uma base específica para um ano e mês determinados."""
    config = BASES_CONFIG[base]
    prefixo_pasta = "dados_cnes" if base == "cnes" else f"dados_{base}"
    
    dir_origem = config["pasta_raw"] / f"{prefixo_pasta}_{ano}" / f"{mes:02d}"
    arquivo_saida = RAW_ADJUSTED_DIR / f"{base}_{ano}" / f"{mes:02d}" / f"{config['arquivo_prefixo']}{str(ano)[2:]}{mes:02d}.parquet"

    if arquivo_saida.exists():
        logging.info(f"[{base.upper()}] Resultado filtrado para {ano}-{mes:02d} já existe. Pulando ajuste.")
        return True

    # Validação do marcador gerado pelo orquestrador
    marcador_sucesso = dir_origem / f"{config['arquivo_prefixo']}{str(ano)[2:]}{mes:02d}.success"
    if not marcador_sucesso.exists():
        logging.warning(f"[{base.upper()}] Erro: Marcador .success não localizado em {dir_origem}. Abortando ajuste.")
        return False

    arquivos_parquet = list(dir_origem.glob("*.parquet"))
    if not arquivos_parquet:
        return True # Sem dados brutos originais para extrair (ex: meses vazios antigos)

    try:
        df = pd.read_parquet(arquivos_parquet[0])
        colunas_presentes = [c for c in config["colunas"] if c in df.columns]
        df = df[colunas_presentes]

        if config.get("filtro"):
            df = df[config["filtro"](df)]

        # Regra de cruzamento dinâmico
        if base == "sih_sp":
            cnes_mes_dir = RAW_ADJUSTED_DIR / f"cnes_{ano}" / f"{mes:02d}"
            cnes_arquivos = list(cnes_mes_dir.glob("STSP*.parquet"))
            if cnes_arquivos:
                df_cnes = pd.read_parquet(cnes_arquivos[0])
                cnes_validos = df_cnes['CNES'].astype(str).str.strip().unique()
                df['SP_CNES'] = df['SP_CNES'].astype(str).str.strip()
                df = df[df['SP_CNES'].isin(cnes_validos)]
            else:
                logging.error(f"[SIH_SP] Erro crítico: O arquivo CNES ajustado de {ano}-{mes:02d} é obrigatório e não foi encontrado.")
                return False

        if not df.empty:
            arquivo_saida.parent.mkdir(parents=True, exist_ok=True)
            df.to_parquet(arquivo_saida, index=False)
            logging.info(f"[{base.upper()}] Ajustado com sucesso: {ano}-{mes:02d} ({len(df)} linhas)")
        else:
            logging.info(f"[{base.upper()}] {ano}-{mes:02d} gerou zero registros em Rio Claro.")
        
        return True
    except Exception as e:
        logging.error(f"[{base.upper()}] Falha catastrófica ao processar {ano}-{mes:02d}: {e}")
        return False