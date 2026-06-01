import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

logger = logging.getLogger("dw_backend")

router = APIRouter(prefix="/consultas", tags=["Consultas Ouro"])


class AggHospitalResponse(BaseModel):
    ano: int
    mes: int
    nome_mes: str
    id_hospital: int
    cnes: Optional[str] = None
    municipio_hospital: Optional[str] = None
    uf_hospital: Optional[str] = None
    quantidade_internacoes: int
    valor_total_internacoes: Optional[Decimal] = None
    valor_total_uti: Optional[Decimal] = None
    media_dias_permanencia: Optional[Decimal] = None
    quantidade_obitos: Optional[int] = None
    taxa_obito_percentual: Optional[Decimal] = None
    quantidade_longa_permanencia: Optional[int] = None

    class Config:
        from_attributes = True


class AggCidResponse(BaseModel):
    ano: int
    mes: int
    nome_mes: str
    codigo_cid: str
    grupo_cid: Optional[str] = None
    capitulo_cid: Optional[str] = None
    quantidade_internacoes: int
    valor_total_internacoes: Optional[Decimal] = None
    valor_total_uti: Optional[Decimal] = None
    media_dias_permanencia: Optional[Decimal] = None
    quantidade_obitos: Optional[int] = None
    taxa_obito_percentual: Optional[Decimal] = None
    quantidade_longa_permanencia: Optional[int] = None

    class Config:
        from_attributes = True


AGG_LIMIT = 5000
DIM_LIMIT = 5000
FATO_LIMIT = 1000

OURO_VIEWS: dict[str, dict[str, Any]] = {
    "agg_hospital_mensal": {
        "view": "ouro.agg_hospital_mensal",
        "filters": {"ano", "mes", "cnes", "id_hospital", "uf_hospital"},
        "order_by": "ano DESC, mes DESC, id_hospital ASC",
    },
    "agg_cid_mensal": {
        "view": "ouro.agg_cid_mensal",
        "filters": {"ano", "mes", "codigo_cid", "grupo_cid"},
        "order_by": "ano DESC, mes DESC, codigo_cid ASC",
    },
    "agg_internacoes_mensais": {
        "view": "ouro.agg_internacoes_mensais",
        "filters": {"ano", "mes", "cnes", "id_hospital"},
        "order_by": "ano DESC, mes DESC, id_hospital ASC",
    },
    "agg_procedimentos_mensais": {
        "view": "ouro.agg_procedimentos_mensais",
        "filters": {"ano", "mes", "cnes", "codigo_procedimento", "id_hospital"},
        "order_by": "ano DESC, mes DESC, id_hospital ASC, codigo_procedimento ASC",
    },
    "agg_mortalidade_hospital": {
        "view": "ouro.agg_mortalidade_hospital",
        "filters": {"ano", "mes", "cnes", "id_hospital"},
        "order_by": "ano DESC, mes DESC, id_hospital ASC",
    },
    "fato_internacoes": {
        "view": "ouro.fato_internacoes",
        "filters": {"ano", "mes", "cnes", "codigo_cid", "id_hospital"},
        "order_by": "ano DESC, mes DESC, id_internacao ASC",
    },
    "fato_procedimentos": {
        "view": "ouro.fato_procedimentos",
        "filters": {"ano", "mes", "cnes", "codigo_cid", "codigo_procedimento", "id_hospital"},
        "order_by": "ano DESC, mes DESC, id_procedimento ASC",
    },
    "dim_hospital": {
        "view": "ouro.dim_hospital",
        "filters": {"cnes", "id_hospital"},
        "order_by": "id_hospital ASC",
    },
    "dim_cid": {
        "view": "ouro.dim_cid",
        "filters": {"codigo_cid"},
        "order_by": "codigo_cid ASC",
    },
    "dim_procedimento": {
        "view": "ouro.dim_procedimento",
        "filters": {"codigo_procedimento"},
        "order_by": "codigo_procedimento ASC",
    },
    "dim_profissional": {
        "view": "ouro.dim_profissional",
        "filters": set(),
        "order_by": "codigo_cbo ASC",
    },
    "dim_tempo": {
        "view": "ouro.dim_tempo",
        "filters": {"ano", "mes"},
        "order_by": "data DESC",
    },
    "dim_internacao_tipo": {
        "view": "ouro.dim_internacao_tipo",
        "filters": set(),
        "order_by": "tipo_identificacao ASC, especialidade ASC, carater_internacao ASC",
    },
    "dim_paciente_perfil": {
        "view": "ouro.dim_paciente_perfil",
        "filters": set(),
        "order_by": "id_perfil_paciente ASC",
    },
}

LIKE_FILTERS = {"codigo_cid", "codigo_procedimento", "grupo_cid", "uf_hospital"}


def _standard_error(view: str, exc: Exception) -> HTTPException:
    logger.exception("Erro ao consultar view da camada Ouro %s: %s", view, exc)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "code": "OURO_QUERY_ERROR",
            "message": "Erro ao consultar dados da camada Ouro.",
            "view": view,
        },
    )


def _rows(result: Any) -> list[dict[str, Any]]:
    return [dict(row) for row in result.mappings()]


def _build_filters(
    config: dict[str, Any],
    ano: int | None = None,
    mes: int | None = None,
    cnes: str | None = None,
    codigo_cid: str | None = None,
    codigo_procedimento: str | None = None,
    id_hospital: int | None = None,
    uf_hospital: str | None = None,
    grupo_cid: str | None = None,
) -> tuple[str, dict[str, Any]]:
    raw_filters = {
        "ano": ano,
        "mes": mes,
        "cnes": cnes,
        "codigo_cid": codigo_cid,
        "codigo_procedimento": codigo_procedimento,
        "id_hospital": id_hospital,
        "uf_hospital": uf_hospital,
        "grupo_cid": grupo_cid,
    }

    clauses: list[str] = []
    params: dict[str, Any] = {}
    allowed_filters = config["filters"]

    for field, value in raw_filters.items():
        if value is None or field not in allowed_filters:
            continue
        if field in LIKE_FILTERS:
            clauses.append(f"{field} LIKE :{field}")
            params[field] = f"%{value}%"
        else:
            clauses.append(f"{field} = :{field}")
            params[field] = value

    if not clauses:
        return "", params

    return " AND " + " AND ".join(clauses), params


def execute_ouro_query(
    db: Session,
    view_key: str,
    limit: int,
    offset: int,
    ano: int | None = None,
    mes: int | None = None,
    cnes: str | None = None,
    codigo_cid: str | None = None,
    codigo_procedimento: str | None = None,
    id_hospital: int | None = None,
    uf_hospital: str | None = None,
    grupo_cid: str | None = None,
) -> list[dict[str, Any]]:
    config = OURO_VIEWS[view_key]
    view = config["view"]
    where_sql, params = _build_filters(
        config,
        ano=ano,
        mes=mes,
        cnes=cnes,
        codigo_cid=codigo_cid,
        codigo_procedimento=codigo_procedimento,
        id_hospital=id_hospital,
        uf_hospital=uf_hospital,
        grupo_cid=grupo_cid,
    )

    query = (
        f"SELECT * FROM {view} WHERE 1=1{where_sql} "
        f"ORDER BY {config['order_by']} "
        "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
    )
    params["offset"] = offset
    params["limit"] = limit

    try:
        return _rows(db.execute(text(query), params))
    except Exception as exc:
        raise _standard_error(view, exc)


def _dashboard_where(ano: int | None, mes: int | None) -> tuple[str, dict[str, Any]]:
    clauses: list[str] = []
    params: dict[str, Any] = {}
    if ano is not None:
        clauses.append("ano = :ano")
        params["ano"] = ano
    if mes is not None:
        clauses.append("mes = :mes")
        params["mes"] = mes
    if not clauses:
        return "", params
    return " WHERE " + " AND ".join(clauses), params


def execute_dashboard_query(db: Session, query: str, params: dict[str, Any], view: str) -> list[dict[str, Any]]:
    try:
        return _rows(db.execute(text(query), params))
    except Exception as exc:
        raise _standard_error(view, exc)


@router.get("/hospitais", response_model=List[AggHospitalResponse])
@router.get("/agg-hospital-mensal", response_model=List[AggHospitalResponse])
def get_hospitais(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (Ex: 2023)"),
    mes: Optional[int] = Query(None, description="Filtrar por mês específico (1 a 12)"),
    uf_hospital: Optional[str] = Query(None, description="Filtrar por sigla do estado (Ex: SP)"),
    cnes: Optional[str] = Query(None, description="Filtrar por código CNES do hospital"),
    id_hospital: Optional[int] = Query(None, description="Filtrar pelo ID do hospital"),
    limit: int = Query(100, ge=1, le=AGG_LIMIT, description="Número máximo de registros a retornar"),
    offset: int = Query(0, ge=0, description="Número de registros a pular (paginação)"),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db,
        "agg_hospital_mensal",
        limit,
        offset,
        ano=ano,
        mes=mes,
        cnes=cnes,
        id_hospital=id_hospital,
        uf_hospital=uf_hospital,
    )


@router.get("/cids", response_model=List[AggCidResponse])
@router.get("/agg-cid-mensal", response_model=List[AggCidResponse])
def get_cids(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (Ex: 2023)"),
    mes: Optional[int] = Query(None, description="Filtrar por mês específico (1 a 12)"),
    codigo_cid: Optional[str] = Query(None, description="Filtrar por código ou prefixo do CID (Ex: I10)"),
    grupo_cid: Optional[str] = Query(None, description="Filtrar por descrição do grupo CID"),
    limit: int = Query(100, ge=1, le=AGG_LIMIT, description="Número máximo de registros a retornar"),
    offset: int = Query(0, ge=0, description="Número de registros a pular (paginação)"),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db,
        "agg_cid_mensal",
        limit,
        offset,
        ano=ano,
        mes=mes,
        codigo_cid=codigo_cid,
        grupo_cid=grupo_cid,
    )


@router.get("/agg-internacoes-mensais", response_model=List[Dict[str, Any]])
def get_agg_internacoes_mensais(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    cnes: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=AGG_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db, "agg_internacoes_mensais", limit, offset, ano=ano, mes=mes, cnes=cnes, id_hospital=id_hospital
    )


@router.get("/agg-procedimentos-mensais", response_model=List[Dict[str, Any]])
def get_agg_procedimentos_mensais(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    cnes: Optional[str] = Query(None),
    codigo_procedimento: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=AGG_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db,
        "agg_procedimentos_mensais",
        limit,
        offset,
        ano=ano,
        mes=mes,
        cnes=cnes,
        codigo_procedimento=codigo_procedimento,
        id_hospital=id_hospital,
    )


@router.get("/agg-mortalidade-hospital", response_model=List[Dict[str, Any]])
def get_agg_mortalidade_hospital(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    cnes: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=AGG_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db, "agg_mortalidade_hospital", limit, offset, ano=ano, mes=mes, cnes=cnes, id_hospital=id_hospital
    )


@router.get("/fato-internacoes", response_model=List[Dict[str, Any]])
def get_fato_internacoes(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    cnes: Optional[str] = Query(None),
    codigo_cid: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=FATO_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db,
        "fato_internacoes",
        limit,
        offset,
        ano=ano,
        mes=mes,
        cnes=cnes,
        codigo_cid=codigo_cid,
        id_hospital=id_hospital,
    )


@router.get("/fato-procedimentos", response_model=List[Dict[str, Any]])
def get_fato_procedimentos(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    cnes: Optional[str] = Query(None),
    codigo_cid: Optional[str] = Query(None),
    codigo_procedimento: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=FATO_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(
        db,
        "fato_procedimentos",
        limit,
        offset,
        ano=ano,
        mes=mes,
        cnes=cnes,
        codigo_cid=codigo_cid,
        codigo_procedimento=codigo_procedimento,
        id_hospital=id_hospital,
    )


@router.get("/dim-hospital", response_model=List[Dict[str, Any]])
def get_dim_hospital(
    cnes: Optional[str] = Query(None),
    id_hospital: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_hospital", limit, offset, cnes=cnes, id_hospital=id_hospital)


@router.get("/dim-cid", response_model=List[Dict[str, Any]])
def get_dim_cid(
    codigo_cid: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_cid", limit, offset, codigo_cid=codigo_cid)


@router.get("/dim-procedimento", response_model=List[Dict[str, Any]])
def get_dim_procedimento(
    codigo_procedimento: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_procedimento", limit, offset, codigo_procedimento=codigo_procedimento)


@router.get("/dim-profissional", response_model=List[Dict[str, Any]])
def get_dim_profissional(
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_profissional", limit, offset)


@router.get("/dim-tempo", response_model=List[Dict[str, Any]])
def get_dim_tempo(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_tempo", limit, offset, ano=ano, mes=mes)


@router.get("/dim-internacao-tipo", response_model=List[Dict[str, Any]])
def get_dim_internacao_tipo(
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_internacao_tipo", limit, offset)


@router.get("/dim-paciente-perfil", response_model=List[Dict[str, Any]])
def get_dim_paciente_perfil(
    limit: int = Query(100, ge=1, le=DIM_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return execute_ouro_query(db, "dim_paciente_perfil", limit, offset)


@router.get("/resumo", response_model=Dict[str, Any])
def get_resumo(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    where_sql, params = _dashboard_where(ano, mes)
    query = f"""
    SELECT
        COALESCE(SUM(quantidade_internacoes), 0) AS total_internacoes,
        COALESCE(SUM(quantidade_obitos), 0) AS total_obitos,
        COALESCE(SUM(valor_total_internacoes), 0) AS valor_total_internacoes,
        COALESCE(SUM(valor_total_uti), 0) AS valor_total_uti
    FROM ouro.agg_internacoes_mensais{where_sql};
    """
    rows = execute_dashboard_query(db, query, params, "ouro.agg_internacoes_mensais")
    resumo = rows[0] if rows else {}

    proc_query = f"""
    SELECT
        COALESCE(SUM(total_procedimentos), 0) AS total_procedimentos,
        COALESCE(SUM(valor_total_procedimentos), 0) AS valor_total_procedimentos
    FROM ouro.agg_procedimentos_mensais{where_sql};
    """
    proc_rows = execute_dashboard_query(db, proc_query, params, "ouro.agg_procedimentos_mensais")
    if proc_rows:
        resumo.update(proc_rows[0])
    return resumo


@router.get("/series-internacoes", response_model=List[Dict[str, Any]])
def get_series_internacoes(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=AGG_LIMIT),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    where_sql, params = _dashboard_where(ano, mes)
    params.update({"limit": limit, "offset": offset})
    query = f"""
    SELECT
        ano,
        mes,
        MAX(nome_mes) AS nome_mes,
        SUM(quantidade_internacoes) AS quantidade_internacoes,
        SUM(quantidade_obitos) AS quantidade_obitos,
        SUM(valor_total_internacoes) AS valor_total_internacoes
    FROM ouro.agg_internacoes_mensais{where_sql}
    GROUP BY ano, mes
    ORDER BY ano ASC, mes ASC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY;
    """
    return execute_dashboard_query(db, query, params, "ouro.agg_internacoes_mensais")


@router.get("/top-hospitais", response_model=List[Dict[str, Any]])
def get_top_hospitais(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    where_sql, params = _dashboard_where(ano, mes)
    query = f"""
    SELECT TOP {limit}
        cnes,
        municipio_hospital,
        SUM(quantidade_internacoes) AS quantidade_internacoes,
        SUM(valor_total_internacoes) AS valor_total_internacoes,
        SUM(quantidade_obitos) AS quantidade_obitos
    FROM ouro.agg_hospital_mensal{where_sql}
    GROUP BY cnes, municipio_hospital
    ORDER BY quantidade_internacoes DESC;
    """
    return execute_dashboard_query(db, query, params, "ouro.agg_hospital_mensal")


@router.get("/top-cids", response_model=List[Dict[str, Any]])
def get_top_cids(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    where_sql, params = _dashboard_where(ano, mes)
    query = f"""
    SELECT TOP {limit}
        codigo_cid,
        grupo_cid,
        capitulo_cid,
        SUM(quantidade_internacoes) AS quantidade_internacoes,
        SUM(quantidade_obitos) AS quantidade_obitos
    FROM ouro.agg_cid_mensal{where_sql}
    GROUP BY codigo_cid, grupo_cid, capitulo_cid
    ORDER BY quantidade_internacoes DESC;
    """
    return execute_dashboard_query(db, query, params, "ouro.agg_cid_mensal")


@router.get("/top-procedimentos", response_model=List[Dict[str, Any]])
def get_top_procedimentos(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    where_sql, params = _dashboard_where(ano, mes)
    query = f"""
    SELECT TOP {limit}
        codigo_procedimento,
        SUM(total_procedimentos) AS total_procedimentos,
        SUM(valor_total_procedimentos) AS valor_total_procedimentos
    FROM ouro.agg_procedimentos_mensais{where_sql}
    GROUP BY codigo_procedimento
    ORDER BY valor_total_procedimentos DESC;
    """
    return execute_dashboard_query(db, query, params, "ouro.agg_procedimentos_mensais")
