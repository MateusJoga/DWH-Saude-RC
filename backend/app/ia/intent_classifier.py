import re
from typing import Dict, List

# Dicionários de palavras-chave com pesos para pontuação semântica de intenções
INTENT_KEYWORDS: Dict[str, Dict[str, int]] = {
    "top_hospitais_internacoes": {
        "HOSPITAL": 1,
        "HOSPITAIS": 1,
        "CNES": 2,
        "INTERNACAO": 1,
        "INTERNACOES": 1,
        "INTERNAR": 1,
        "VOLUME": 1,
        "QUANTIDADE": 1,
        "MUNICIPIO": 1,
        "ESTABELECIMENTO": 1
    },
    "top_cids_internacoes": {
        "CID": 1,
        "CIDS": 1,
        "DOENCA": 1,
        "DOENCAS": 1,
        "PATOLOGIA": 1,
        "PATOLOGIAS": 1,
        "DIAGNOSTICO": 1,
        "FREQUENTES": 1,
        "MAIS COMUNS": 1,
        "COMUNS": 1
    },
    "hospital_maior_custo": {
        "HOSPITAL": 1,
        "HOSPITAIS": 1,
        "CUSTO": 2,
        "CUSTOS": 2,
        "VALOR": 1,
        "VALORES": 1,
        "UTI": 2,
        "REEMBOLSO": 2,
        "FATURAMENTO": 1,
        "CARO": 2,
        "GASTOU": 2,
        "GASTO": 2
    },
    "cid_maior_taxa_obito": {
        "CID": 1,
        "CIDS": 1,
        "DOENCA": 1,
        "DOENCAS": 1,
        "PATOLOGIA": 1,
        "PATOLOGIAS": 1,
        "OBITO": 2,
        "OBITOS": 2,
        "MORTE": 2,
        "MORTES": 2,
        "TAXA": 2,
        "MORTALIDADE": 2,
        "GRAVE": 1,
        "LETAIS": 2,
        "LETAL": 2
    },
    "procedimentos_maior_valor": {
        "PROCEDIMENTO": 1,
        "PROCEDIMENTOS": 1,
        "VALOR": 1,
        "VALORES": 1,
        "CUSTO": 1,
        "CARO": 2,
        "CAROS": 2,
        "FINANCEIRO": 1
    },
    "procedimentos_alto_custo": {
        "PROCEDIMENTO": 1,
        "PROCEDIMENTOS": 1,
        "ALTO CUSTO": 3,
        "APAC": 2,
        "FREQUENTES": 1,
        "MAIS COMUNS": 1
    }
}

def remover_acentos(texto: str) -> str:
    """
    Substitui letras acentuadas por suas contrapartes normais para
    aumentar a assertividade das correspondências semânticas.
    """
    subs = {
        "Á": "A", "À": "A", "Â": "A", "Ã": "A", "Ä": "A",
        "É": "E", "È": "E", "Ê": "E", "Ë": "E",
        "Í": "I", "Ì": "I", "Î": "I", "Ï": "I",
        "Ó": "O", "Ò": "O", "Ô": "O", "Õ": "O", "Ö": "O",
        "Ú": "U", "Ù": "U", "Û": "U", "Ü": "U",
        "Ç": "C"
    }
    for orig, rep in subs.items():
        texto = texto.replace(orig, rep)
    return texto

def classify_intent(pergunta: str) -> str:
    """
    Analisa semanticamente a pergunta normalizada do usuário,
    calcula as pontuações contra a matriz de palavras-chave,
    e retorna o identificador da intenção.
    
    Se nenhuma intenção atingir o limite mínimo de 2 pontos,
    retorna "desconhecido".
    """
    # 1. Normalização do texto
    texto = pergunta.upper()
    texto = remover_acentos(texto)
    
    # Substitui pontuações por espaços para busca limpa por palavra inteira
    texto_limpo = re.sub(r"[^\w\s]", " ", texto)
    palavras = texto_limpo.split()

    scores: Dict[str, int] = {intent: 0 for intent in INTENT_KEYWORDS.keys()}

    # 2. Computação de pontuações por palavra-chave
    for palavra in palavras:
        for intent, kw_dict in INTENT_KEYWORDS.items():
            if palavra in kw_dict:
                scores[intent] += kw_dict[palavra]

    # 3. Tratamento especial de termos compostos de alta prioridade (como "alto custo")
    if "ALTO CUSTO" in texto or "ALTO-CUSTO" in texto:
        scores["procedimentos_alto_custo"] += 3

    # Encontra a intenção com maior pontuação
    if not scores:
        return "desconhecido"
        
    melhor_intent = max(scores, key=scores.get)
    maior_score = scores[melhor_intent]

    # Limiar mínimo de pontuação semântica para classificar (evita falsas associações)
    if maior_score >= 2:
        return melhor_intent
        
    return "desconhecido"
