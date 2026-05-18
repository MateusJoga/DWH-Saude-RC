import re
import logging
from app.ia.safety import is_query_safe
from app.ia.intent_classifier import classify_intent, remover_acentos
from app.ia.conceptual_responder import CONCEPTUAL_TERMS

logger = logging.getLogger("dw_backend")

# Termos linguísticos que indicam uma busca por definição teórica (conceitual)
CONCEPTUAL_TRIGGERS = [
    "O QUE E", "O QUE SIGNIFICA", "O QUE SIGNIFICADO", "SIGNIFICADO DE", 
    "EXPLIQUE", "EXPLICA", "DEFINA", "DEFINICAO DE", "O QUE REPRESENTA",
    "QUEM E", "ENTENDER O QUE"
]

def route_question(pergunta: str) -> str:
    """
    Roteador Principal de IA.
    Executa a triagem obrigatória da pergunta em linguagem natural na ordem correta:
    
    1. Safety Check -> Se maliciosa, bloqueia e classifica como 'blocked_by_safety'.
    2. Intent Classifier -> Se encontrar intenção analítica válida, classifica como 'analytical'.
    3. Conceptual Keywords & Triggers -> Se contiver termos do dicionário ou verbos definidores,
       classifica como 'conceptual'.
    4. Caso contrário -> Classifica como 'unknown'.
    """
    # -------------------------------------------------------------------------
    # PASSO 1: Validação Física do Safety Gate
    # -------------------------------------------------------------------------
    if not is_query_safe(pergunta):
        logger.warning(f"Question Router: Pergunta suspeita bloqueada pelo Safety Gate: '{pergunta}'")
        return "blocked_by_safety"

    # -------------------------------------------------------------------------
    # PASSO 2: Verificação de Intenção Analítica (Banco Ouro)
    # -------------------------------------------------------------------------
    intent = classify_intent(pergunta)
    if intent != "desconhecido":
        logger.info(f"Question Router: Classificada como ANALÍTICA (Intenção: '{intent}')")
        return "analytical"

    # -------------------------------------------------------------------------
    # PASSO 3: Verificação de Gatilhos Conceituais (SUS / DW)
    # -------------------------------------------------------------------------
    texto_clean = pergunta.upper()
    texto_clean = remover_acentos(texto_clean)

    # A. Verifica gatilhos textuais (ex: "o que é...")
    for trigger in CONCEPTUAL_TRIGGERS:
        if trigger in texto_clean:
            logger.info(f"Question Router: Classificada como CONCEITUAL por gatilho linguístico '{trigger}'")
            return "conceptual"

    # B. Verifica menção a termos do dicionário local
    for termo in CONCEPTUAL_TERMS.keys():
        if termo in texto_clean:
            logger.info(f"Question Router: Classificada como CONCEITUAL por menção ao termo '{termo}'")
            return "conceptual"

    # C. Verifica menção a capítulos CID A-Z (ex: "CID A")
    if re.search(r"\bCID\s+([A-Z])\b", texto_clean) or re.search(r"\bGRUPO\s+([A-Z])\b", texto_clean):
        logger.info("Question Router: Classificada como CONCEITUAL por menção a grupo de letras CID")
        return "conceptual"

    # -------------------------------------------------------------------------
    # PASSO 4: Fallback para Pergunta Desconhecida
    # -------------------------------------------------------------------------
    logger.info("Question Router: Classificada como DESCONHECIDA (fora do escopo)")
    return "unknown"
