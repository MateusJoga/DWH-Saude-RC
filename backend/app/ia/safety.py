import re
import logging

logger = logging.getLogger("dw_backend")

# Lista de palavras-chave proibidas que indicam tentativas de injeção ou DDL/DML destrutivo
BLACKLISTED_WORDS = [
    "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", 
    "EXEC", "MERGE", "CREATE", "GRANT", "REVOKE"
]

# Símbolos suspeitos que tentam quebrar ou emendar queries SQL
SUSPICIOUS_SYMBOLS = [";", "--", "/*", "*/", "xp_"]
BLOCKED_SCHEMAS = ["BRONZE", "PRATA", "SYS", "DBO", "INFORMATION_SCHEMA"]

def is_query_safe(pergunta: str) -> bool:
    """
    Analisa a pergunta em linguagem natural do usuário contra assinaturas de
    ataques conhecidos de injeção de SQL ou comandos DDL/DML não autorizados.
    
    Retorna True se for segura, False se for suspeita.
    """
    # 1. Normalização do texto
    texto_upper = pergunta.upper().strip()

    # 2. Verificação de símbolos suspeitos (caracteres de injeção e execução especial)
    for simbolo in SUSPICIOUS_SYMBOLS:
        if simbolo in texto_upper:
            logger.warning(f"Segurança Interceptou símbolo proibido '{simbolo}' na pergunta: '{pergunta}'")
            return False

    # 3. Verificação de palavras-chave proibidas usando limites de palavra (\b) para evitar falsos positivos
    for palavra in BLACKLISTED_WORDS:
        # Padrão regex busca pela palavra inteira (isolada de outras letras)
        padrao = rf"\b{palavra}\b"
        if re.search(padrao, texto_upper):
            logger.warning(f"Segurança Interceptou palavra-chave proibida '{palavra}' na pergunta: '{pergunta}'")
            return False

    for schema in BLOCKED_SCHEMAS:
        padrao_schema = rf"\b{schema}\b|\b{schema}\."
        if re.search(padrao_schema, texto_upper):
            logger.warning(f"Segurança Interceptou schema proibido '{schema}' na pergunta: '{pergunta}'")
            return False

    return True
