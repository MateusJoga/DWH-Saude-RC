import re
import logging
from typing import Optional
from app.ia.llm_client import call_llm
from app.ia.intent_classifier import remover_acentos

logger = logging.getLogger("dw_backend")

# Dicionário de Capítulos e grupos do CID-10 de A a Z
CID_LETTERS_MAP = {
    "A": "Algumas doenças infecciosas e parasitárias (Capítulo I - ex: tuberculose, cólera, infecções bacterianas)",
    "B": "Algumas doenças infecciosas e parasitárias (continuação do Capítulo I - ex: hepatites virais, HIV, micoses)",
    "C": "Neoplasias (tumores) malignas (Capítulo II - ex: cânceres em geral)",
    "D": "Neoplasias (continuação) e doenças do sangue, órgãos hematopoiéticos e transtornos imunitários",
    "E": "Doenças endócrinas, nutricionais e metabólicas (Capítulo IV - ex: diabetes mellitus, desnutrição, tireoide)",
    "F": "Transtornos mentais e comportamentais (Capítulo V - ex: depressão, esquizofrenia, transtornos de ansiedade)",
    "G": "Doenças do sistema nervoso (Capítulo VI - ex: meningite, mal de Parkinson, epilepsia, esclerose)",
    "H": "Doenças do olho/anexos e doenças do ouvido/apófise mastoide (Capítulo VII e VIII - ex: catarata, otite)",
    "I": "Doenças do sistema circulatório (Capítulo IX - ex: hipertensão arterial, infarto, AVC, insuficiência cardíaca)",
    "J": "Doenças do sistema respiratório (Capítulo X - ex: pneumonia, asma, bronquite, gripe)",
    "K": "Doenças do sistema digestivo (Capítulo XI - ex: apendicite, gastrite, hérnias, cirrose hepática)",
    "L": "Doenças da pele e do tecido subcutâneo (Capítulo XII - ex: infecções de pele, dermatites, psoríase)",
    "M": "Doenças do sistema osteomuscular e do tecido conjuntivo (Capítulo XIII - ex: artrose, artrite, osteoporose)",
    "N": "Doenças do sistema geniturinário (Capítulo XIV - ex: infecção urinária, cálculo renal, insuficiência renal)",
    "O": "Gravidez, parto e puerpério (Capítulo XV - ex: parto normal, cesárea, complicações na gestação)",
    "P": "Algumas afecções originadas no período perinatal (Capítulo XVI - ex: distúrbios do recém-nascido, prematuridade)",
    "Q": "Malformações congênitas, deformidades e anomalias cromossômicas (Capítulo XVII - ex: fenda palatina, Síndrome de Down)",
    "R": "Sintomas, sinais e achados anormais de exames clínicos e laboratório (Capítulo XVIII - ex: febre, dor, tosse)",
    "S": "Lesões, envenenamentos e algumas outras consequências de causas externas (Capítulo XIX - ex: fraturas, queimaduras)",
    "T": "Lesões, envenenamentos e causas externas (continuação - ex: intoxicações por medicamentos, picadas venenosas)",
    "Z": "Fatores que influenciam o estado de saúde e o contacto com os serviços (Capítulo XXI - ex: exames de rotina, vacinação)"
}

# Dicionário de termos conceituais gerais do DW e do SUS
CONCEPTUAL_TERMS = {
    "MEDIA COMPLEXIDADE": (
        "Média Complexidade no SUS compreende um conjunto de ações e serviços ambulatoriais e hospitalares "
        "especializados que visam atender aos problemas de saúde que demandam profissionais e tecnologia "
        "intermediários. Exemplos incluem consultas de especialidades, cirurgias de pequeno/médio porte e exames como ultrassom."
    ),
    "ALTA COMPLEXIDADE": (
        "Alta Complexidade no SUS envolve procedimentos que utilizam alta tecnologia e possuem elevado custo orçamentário. "
        "Estes atendimentos são altamente regulados por guias e autorizações (APAC/AIH). Exemplos clássicos são cirurgias cardiovasculares, "
        "tratamento oncológico (quimioterapia/radioterapia), hemodiálise, transplantes e internações em UTIs de ponta."
    ),
    "CAMADA BRONZE": (
        "A Camada Bronze (Raw/Bruta) é o primeiro estágio de ingestão de dados em nosso Data Warehouse. "
        "Ela armazena os arquivos originais importados da saúde pública (arquivos RD/SP do SUS) em tabelas raw "
        "sem nenhuma transformação, limpeza ou alteração de tipo, mantendo o histórico puro da fonte externa."
    ),
    "CAMADA PRATA": (
        "A Camada Prata (Trusted/Higienizada) é a área de refino intermediário de dados. "
        "Aqui, aplicamos a limpeza e padronização dos registros da camada bronze. Corrigimos datas nulas, unificamos chaves estrangeiras, "
        "convertemos tipos textuais incorretos e criamos as tabelas de fatos e dimensões estruturadas."
    ),
    "CAMADA OURO": (
        "A Camada Ouro (Analytical/Refinada) é o estágio final de inteligência de negócios do Data Warehouse. "
        "Ela é otimizada para performance analítica, contendo views calculadas, tabelas agregadas e dimensões prontas. "
        "É a camada exclusiva de onde o Power BI e a API de IA extraem os relatórios de dashboards e KPI cards."
    ),
    "GRUPO CID": (
        "Grupo CID é um nível de agrupamento contido no CID-10 que reúne patologias e doenças clinicamente semelhantes "
        "dentro de um mesmo capítulo diagnóstico (ex: Doenças Isquêmicas do Coração). Ele permite que analistas consolidem "
        "estatísticas epidemiológicas sem a fragmentação excessiva de códigos individuais."
    ),
    "CID": (
        "CID significa Classificação Internacional de Doenças. É a codificação global padrão criada pela Organização "
        "Mundial da Saúde (OMS) para catalogar diagnósticos, sintomas e causas de óbito. Em nosso DW de saúde, "
        "é utilizado na view 'ouro.agg_cid_mensal' para monitorar os motivos das internações regionais."
    ),
    "CNES": (
        "CNES é a sigla para Cadastro Nacional de Estabelecimentos de Saúde. Trata-se de uma chave pública oficial que identifica "
        "e mapeia todos os hospitais, postos de saúde, UPAs, clínicas e consultórios médicos ativos no Brasil. "
        "No DW, usamos o CNES para agrupar e comparar a carga operacional das diferentes unidades de saúde regionais."
    ),
    "AIH": (
        "AIH significa Autorização de Internação Hospitalar. Trata-se do documento oficial de registro do SUS que autoriza a "
        "admissão de um paciente em leitos hospitalares. A AIH centraliza dados do prontuário, dias de permanência, "
        "procedimentos efetuados e serve como guia de repasses orçamentários do governo federal ao município."
    ),
    "FAEC": (
        "FAEC é a sigla para Fundo de Ações Estratégicas e Compensação. Trata-se de um orçamento federal do SUS reservado "
        "especificamente para pagar cirurgias e exames de alta complexidade e tratamentos regulados nacionalmente (como transplantes), "
        "cujo reembolso independe do limite fixo do teto financeiro regular do município."
    ),
    "INTERNACAO": (
        "Internação no SUS representa a admissão formal de um paciente em um leito clínico ou de terapia intensiva por tempo "
        "superior a 24 horas. Exige a emissão de uma guia de AIH e é avaliada no DW por meio das dimensões de tempo, "
        "faixas etárias de pacientes, motivos clínicos (CIDs) e custos das diárias hospitalares."
    ),
    "PROCEDIMENTO HOSPITALAR": (
        "Procedimento Hospitalar é qualquer ato de diagnóstico, tratamento cirúrgico, clínico ou terapêutico realizado no paciente "
        "dentro de uma unidade de saúde. As informações de procedimentos clínicos executados nos auxiliam a auditar "
        "o faturamento dos prestadores de saúde pública nas tabelas agregadas do DW."
    ),
    "DATA WAREHOUSE": (
        "Data Warehouse (DW) é um sistema de banco de dados projetado especialmente para análises analíticas de BI e apoio à decisão. "
        "Ele reúne e organiza os dados da saúde pública em três schemas (bronze, prata e ouro), permitindo "
        "consultas de tendências históricas de custos e epidemiologia de forma ultrarrápida."
    )
}

def get_conceptual_response(pergunta: str) -> str:
    """
    Controlador do fluxo conceitual.
    1. Tenta acionar um provedor de LLM se ativo (Gemini ou OpenAI).
    2. Caso LLM_PROVIDER seja 'none' ou ocorra falha de rede/API, realiza
       o mapeamento semântico no dicionário local pré-cadastrado.
    """
    pergunta_clean = pergunta.upper()
    pergunta_clean = remover_acentos(pergunta_clean)
    
    # -------------------------------------------------------------------------
    # TENTATIVA 1: Utilizar LLM Real se habilitado (Gemini / OpenAI)
    # -------------------------------------------------------------------------
    prompt = (
        f"Você é um especialista em saúde pública e tutor conceitual de Rio Claro.\n"
        f"O usuário quer compreender o seguinte termo ou conceito relacionado ao SUS, "
        f"faturamento ou Data Warehouse analítico de saúde:\n"
        f"Pergunta: '{pergunta}'\n\n"
        f"Escreva uma resposta didática, concisa e altamente profissional em linguagem natural "
        f"(máximo de 5 linhas). Por motivos estritos de segurança, você está terminantemente proibido "
        f"de expor código SQL, queries de banco de dados ou inventar comandos de programação."
    )
    
    try:
        llm_response = call_llm(prompt)
        if llm_response:
            logger.info("Fluxo Conceitual: Resposta gerada via API de LLM com sucesso.")
            return llm_response.strip()
    except Exception as llm_err:
        logger.error(f"Erro ao tentar acionar LLM real: {llm_err}. Fazendo fallback local.")

    # -------------------------------------------------------------------------
    # TENTATIVA 2: Fallback Local (Dicionário de Conceitos pré-cadastrados)
    # -------------------------------------------------------------------------
    logger.info("Fluxo Conceitual: Executando mapeamento do dicionário local.")

    # A. Busca por grupo CID específico (A a Z)
    # Regex busca por "CID A", "CID B" ou "GRUPO CID A"
    match = re.search(r"\bCID\s+([A-Z])\b", pergunta_clean)
    if not match:
        # Regex alternativa para "GRUPO A", "CAPITULO J"
        match = re.search(r"\bGRUPO\s+([A-Z])\b", pergunta_clean)
        
    if match:
        letra = match.group(1)
        if letra in CID_LETTERS_MAP:
            logger.info(f"Conceito mapeado: Grupo CID {letra}")
            return f"O grupo CID {letra} representa: {CID_LETTERS_MAP[letra]}."

    # B. Busca por termos conceituais estruturados
    for termo, explicacao in CONCEPTUAL_TERMS.items():
        # Verifica se o termo está na pergunta do usuário
        if termo in pergunta_clean:
            logger.info(f"Conceito mapeado localmente: '{termo}'")
            return explicacao

    # Tratamento caso o termo não exista no dicionário padrão
    return (
        "Este conceito específico não está mapeado em meu dicionário analítico local. "
        "O assistente conceitual de fallback suporta termos como: CID (e os grupos de A a Z), "
        "CNES, AIH, FAEC, Níveis de Complexidade (Média/Alta), conceitos de Internação, "
        "Procedimentos e o funcionamento das três camadas do Data Warehouse (Bronze, Prata e Ouro)."
    )
