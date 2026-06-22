import re
from dataclasses import dataclass

ALLOWED_TABLES = {
    "fato_internacoes",
    "fato_procedimentos",
    "agg_hospital_mensal",
    "agg_cid_mensal",
    "agg_procedimentos_mensais",
    "agg_internacoes_mensais",
}

BLOCKED = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|MERGE|EXEC|TRUNCATE)\b",
    re.IGNORECASE,
)

BLOCKED_SCHEMAS = re.compile(
    r"\b(bronze|prata|dbo|sys|information_schema)\b",
    re.IGNORECASE,
)

@dataclass
class SQLValidationResult:
    sql: str
    tables: list[str]

class SQLValidationError(ValueError):
    pass

def validate_sql(sql: str) -> SQLValidationResult:
    if not sql or not sql.strip():
        raise SQLValidationError("SQL vazio.")

    sql = sql.strip()

    if sql.startswith("```"):
        raise SQLValidationError("SQL não pode conter Markdown.")

    if "--" in sql or "/*" in sql or "*/" in sql:
        raise SQLValidationError("Comentários SQL não são permitidos.")

    if ";" in sql[:-1]:
        raise SQLValidationError("Múltiplas statements não são permitidas.")

    sql = sql.rstrip(";").strip()

    if not sql.lower().startswith("select"):
        raise SQLValidationError("Somente SELECT é permitido.")

    if BLOCKED.search(sql):
        raise SQLValidationError("SQL contém comando proibido.")

    if BLOCKED_SCHEMAS.search(sql):
        raise SQLValidationError("SQL menciona schema proibido.")

    if re.search(r"select\s+(top\s+\d+\s+)?\*", sql, re.IGNORECASE):
        raise SQLValidationError("SELECT * não é permitido.")

    tables = _extract_tables(sql)

    if not tables:
        raise SQLValidationError("Nenhuma tabela permitida encontrada.")

    invalid = [t for t in tables if t not in ALLOWED_TABLES]
    if invalid:
        raise SQLValidationError(f"Tabela não permitida: {invalid}")

    is_aggregate = bool(re.search(r"\b(group\s+by|count\s*\(|sum\s*\(|avg\s*\()", sql, re.IGNORECASE))
    has_top = bool(re.search(r"select\s+top\s+\d+", sql, re.IGNORECASE))

    if not is_aggregate and not has_top:
        raise SQLValidationError("Consultas detalhadas devem usar TOP.")

    return SQLValidationResult(sql=sql, tables=tables)

def _extract_tables(sql: str) -> list[str]:
    found = re.findall(
        r"\b(?:from|join)\s+(?:ouro\.)?([a-zA-Z_][a-zA-Z0-9_]*)",
        sql,
        re.IGNORECASE,
    )
    return [t.lower() for t in found]