from typing import List, Dict, Any

def formatar_moeda(valor: Any) -> str:
    """Auxiliar para formatar valores monetários em Real R$."""
    try:
        num = float(valor)
        return f"R$ {num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return "R$ 0,00"

def formatar_numero(valor: Any) -> str:
    """Auxiliar para formatar inteiros com separadores de milhar."""
    try:
        num = int(valor)
        return f"{num:,}".replace(",", ".")
    except (ValueError, TypeError):
        return "0"

def generate_ia_response(pergunta: str, intent: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Gera dinamicamente uma resposta em linguagem natural e uma lista de insights
    analíticos baseados na intenção identificada e nos registros retornados do banco.
    
    ESTRUTURA DE TRANSIÇÃO FUTURA PARA LLM REAL (GEMINI/OPENAI):
    Em uma etapa futura, esta função poderá chamar uma API de IA Generativa.
    Bastaria fazer:
        import google.generativeai as genai
        modelo = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Pergunta: {pergunta}. Dados: {rows}. Escreva uma resposta e traga insights."
        return modelo.generate_content(prompt).text
    """
    if not rows:
        return {
            "resposta": (
                "Consultei o Data Warehouse de Saúde Pública, mas não encontrei registros correspondentes "
                "aos parâmetros avaliados na camada Ouro neste momento."
            ),
            "insights": [
                "Verifique se o banco de dados contém registros válidos importados para as competências da camada Ouro.",
                "Tente refinar os termos ou realize uma nova carga de dados."
            ]
        }

    # 1. Intenção: TOP HOSPITAIS INTERNAÇÕES
    if intent == "top_hospitais_internacoes":
        primeiro = rows[0]
        cnes = primeiro.get("CNES", "N/D")
        municipio = primeiro.get("Municipio", "N/D")
        total = formatar_numero(primeiro.get("Total Internacoes", 0))
        custo = formatar_moeda(primeiro.get("Custo Total (R$)", 0))
        
        resposta = (
            f"Com base nas agregações da camada Ouro, o hospital sob o CNES {cnes}, localizado em {municipio}, "
            f"apresenta o maior volume de internações na rede de saúde pública municipal, acumulando um total de "
            f"{total} internações com despesas consolidadas de {custo}."
        )
        insights = [
            f"O hospital de CNES {cnes} responde pela maior carga operacional carregada, exigindo atenção logística contínua em insumos.",
            "Hospitais localizados em grandes centros ou polos municipais concentram a maior fatia de internações e faturamento.",
            f"A média de atendimento da rede é influenciada pelo fluxo intenso verificado em {municipio}."
        ]

    # 2. Intenção: TOP CIDS INTERNAÇÕES
    elif intent == "top_cids_internacoes":
        primeiro = rows[0]
        cid = primeiro.get("Código CID", "N/D")
        grupo = primeiro.get("Grupo CID", "Patologia Geral")
        total = formatar_numero(primeiro.get("Total Internacoes", 0))

        resposta = (
            f"Identifiquei que a morbidade de grupo '{grupo}' (Código CID {cid}) é a principal causa "
            f"de internações registradas na base do Data Warehouse, somando {total} internações consolidadas na camada Ouro."
        )
        insights = [
            f"A alta frequência de '{grupo}' sinaliza a necessidade de fortalecimento de ações preventivas na atenção primária da rede municipal.",
            f"A prevalência das internações sob o CID {cid} sugere oportunidades para criação de programas integrados de acompanhamento a pacientes crônicos.",
            "O acompanhamento ambulatorial precoce destas patologias pode reduzir substancialmente a taxa de ocupação de leitos de internação."
        ]

    # 3. Intenção: HOSPITAIS MAIOR CUSTO
    elif intent == "hospital_maior_custo":
        primeiro = rows[0]
        cnes = primeiro.get("CNES", "N/D")
        municipio = primeiro.get("Municipio", "N/D")
        custo_total = formatar_moeda(primeiro.get("Custo Total (R$)", 0))
        custo_uti = formatar_moeda(primeiro.get("Custo UTI (R$)", 0))

        resposta = (
            f"O estabelecimento de saúde com maior custo de faturamento acumulado no Data Warehouse é o "
            f"CNES {cnes} ({municipio}). O custo acumulado total das internações atingiu {custo_total}, dos quais "
            f"{custo_uti} foram destinados especificamente para diárias e serviços em unidades de terapia intensiva (UTI)."
        )
        insights = [
            f"O hospital CNES {cnes} é o principal polo financeiro da saúde regional, concentrando o maior volume de recursos reembolsados.",
            f"O custo de leitos de UTI nessa unidade representa um impacto orçamentário expressivo, necessitando de auditorias periódicas.",
            "A otimização de diárias de internação convencional e o estímulo ao atendimento domiciliar pós-alta podem mitigar estes custos elevados."
        ]

    # 4. Intenção: CID MAIOR TAXA ÓBITO
    elif intent == "cid_maior_taxa_obito":
        primeiro = rows[0]
        cid = primeiro.get("Código CID", "N/D")
        grupo = primeiro.get("Grupo CID", "Patologia Geral")
        taxa = primeiro.get("Taxa Média Óbito (%)", 0)
        obitos = formatar_numero(primeiro.get("Total Óbitos", 0))

        resposta = (
            f"Analisando os registros do DW (filtrando patologias com mais de 10 ocorrências para evitar ruídos), "
            f"o diagnóstico de grupo '{grupo}' (Código {cid}) possui a maior taxa média de mortalidade na rede, "
            f"com {taxa}% de óbito sobre as internações e um acumulado de {obitos} óbitos registrados."
        )
        insights = [
            f"A letalidade de {taxa}% associada ao CID {cid} aponta para a necessidade de protocolos clínicos intensivos ou triagem acelerada na emergência.",
            "Investigações epidemiológicas locais podem elucidar se a letalidade está ligada a diagnóstico tardio.",
            "Implementação de linhas de cuidado rápidas para estas patologias reduz a taxa de mortalidade intra-hospitalar."
        ]

    # 5. Intenção: PROCEDIMENTOS MAIOR VALOR
    elif intent == "procedimentos_maior_valor":
        primeiro = rows[0]
        cod_proc = primeiro.get("Código Procedimento", "N/D")
        valor = formatar_moeda(primeiro.get("Custo Total (R$)", 0))
        total_exec = formatar_numero(primeiro.get("Total Executado", 0))

        resposta = (
            f"Consultando as agregações de procedimentos clínicos e cirúrgicos da camada Ouro, o procedimento "
            f"sob código {cod_proc} acumulou o maior valor financeiro de despesas na rede, com despesas de {valor} "
            f"e {total_exec} atos registrados."
        )
        insights = [
            f"O procedimento {cod_proc} destaca-se como o elemento de maior impacto financeiro na receita geral do DW de saúde.",
            "É aconselhável confrontar a quantidade executada com o faturamento para aferir a conformidade dos repasses da tabela SUS.",
            "Altos valores focados em procedimentos isolados demandam acompanhamento orçamentário específico por parte da gerência financeira."
        ]

    # 6. Intenção: PROCEDIMENTOS ALTO CUSTO
    elif intent == "procedimentos_alto_custo":
        primeiro = rows[0]
        cod_proc = primeiro.get("Código Procedimento", "N/D")
        total_exec = formatar_numero(primeiro.get("Total Executado", 0))
        valor = formatar_moeda(primeiro.get("Custo Total (R$)", 0))

        resposta = (
            f"Dentre os procedimentos parametrizados como de Alto Custo (APAC/Especiais) na camada Ouro, o código "
            f"{cod_proc} destaca-se como o mais frequente, com um volume total de {total_exec} execuções "
            f"e um custo financeiro gerado de {valor}."
        )
        insights = [
            "Procedimentos sob regime de Alto Custo têm reembolso federal e demandam monitoramento preciso das guias de autorização (APAC).",
            f"A alta frequência do código {cod_proc} justifica a criação de comitês clínicos para auditar a regulação de acessos.",
            "Esse indicador apoia o planejamento de compras governamentais de insumos e reagentes específicos para o procedimento avaliado."
        ]

    else:
        resposta = "Pergunta processada, mas a intenção não pôde ser completamente mapeada."
        insights = ["Certifique-se de que a pergunta está voltada para indicadores de internação, hospitais ou custos."]

    return {
        "resposta": resposta,
        "insights": insights
    }
