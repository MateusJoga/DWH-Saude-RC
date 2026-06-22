from app.ia.intent_classifier import remover_acentos


DASHBOARDS = {
    "internacoes": {
        "id": "internacoes",
        "titulo": "Dashboard de Internacoes",
        "rota": "/dashboard",
        "descricao": "Painel operacional de internacoes, hospitais, CIDs, custos e obitos.",
    },
    "powerbi": {
        "id": "powerbi",
        "titulo": "Power BI Saude Rio Claro",
        "rota": "/powerbi",
        "descricao": "Area preparada para dashboards executivos no Power BI.",
    },
}


def route_dashboard(pergunta: str) -> dict[str, str] | None:
    text = remover_acentos(pergunta.upper())
    if "DASHBOARD" not in text and "PAINEL" not in text and "RELATORIO" not in text:
        return None
    if "POWER BI" in text or "POWERBI" in text:
        return DASHBOARDS["powerbi"]
    if "INTERNACAO" in text or "INTERNACOES" in text:
        return DASHBOARDS["internacoes"]
    return DASHBOARDS["powerbi"]
