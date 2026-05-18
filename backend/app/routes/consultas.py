from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal

router = APIRouter(prefix="/consultas", tags=["Consultas Ouro"])

# ==========================================
# SCHEMAS PYDANTIC PARA VALIDAÇÃO E DOCUMENTAÇÃO
# ==========================================

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


# ==========================================
# ENDPOINT: HOSPITAL AGGREGAÇÕES MENSAL
# ==========================================

@router.get("/hospitais", response_model=List[AggHospitalResponse])
def get_hospitais(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (Ex: 2023)"),
    mes: Optional[int] = Query(None, description="Filtrar por mês específico (1 a 12)"),
    uf_hospital: Optional[str] = Query(None, description="Filtrar por sigla do estado (Ex: SP)"),
    cnes: Optional[str] = Query(None, description="Filtrar por código CNES do hospital"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    offset: int = Query(0, ge=0, description="Número de registros a pular (paginação)"),
    db: Session = Depends(get_db)
):
    """
    Retorna dados agregados mensais por Hospital na camada Ouro.
    
    A consulta executa SQL bruto diretamente sobre a view **ouro.agg_hospital_mensal**.
    Suporta paginação via `limit` e `offset`, além de múltiplos filtros operacionais.
    """
    query_str = "SELECT * FROM ouro.agg_hospital_mensal WHERE 1=1"
    params: Dict[str, Any] = {}

    # Adiciona filtros dinâmicos de forma segura
    if ano is not None:
        query_str += " AND ano = :ano"
        params["ano"] = ano
        
    if mes is not None:
        query_str += " AND mes = :mes"
        params["mes"] = mes
        
    if uf_hospital is not None:
        # Usando LIKE case-insensitive nativo do SQL Server para maior usabilidade
        query_str += " AND uf_hospital LIKE :uf_hospital"
        params["uf_hospital"] = f"%{uf_hospital}%"
        
    if cnes is not None:
        query_str += " AND cnes = :cnes"
        params["cnes"] = cnes

    # Paginação padrão SQL Server 2012+ requer cláusula ORDER BY explicativa
    query_str += " ORDER BY ano DESC, mes DESC, id_hospital ASC"
    query_str += " OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
    
    params["limit"] = limit
    params["offset"] = offset

    try:
        result = db.execute(text(query_str), params)
        # Converte as linhas resultantes em dicionários serializáveis mapeados por coluna
        rows = [dict(row) for row in result.mappings()]
        return rows
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar a view ouro.agg_hospital_mensal: {str(e)}"
        )


# ==========================================
# ENDPOINT: CID AGGREGAÇÕES MENSAL
# ==========================================

@router.get("/cids", response_model=List[AggCidResponse])
def get_cids(
    ano: Optional[int] = Query(None, description="Filtrar por ano específico (Ex: 2023)"),
    mes: Optional[int] = Query(None, description="Filtrar por mês específico (1 a 12)"),
    codigo_cid: Optional[str] = Query(None, description="Filtrar por código ou prefixo do CID (Ex: I10)"),
    grupo_cid: Optional[str] = Query(None, description="Filtrar por descrição do grupo CID"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    offset: int = Query(0, ge=0, description="Número de registros a pular (paginação)"),
    db: Session = Depends(get_db)
):
    """
    Retorna dados agregados mensais por patologia (CID) na camada Ouro.
    
    A consulta executa SQL bruto diretamente sobre a view **ouro.agg_cid_mensal**.
    Suporta paginação via `limit` e `offset`, além de múltiplos filtros operacionais.
    """
    query_str = "SELECT * FROM ouro.agg_cid_mensal WHERE 1=1"
    params: Dict[str, Any] = {}

    # Adiciona filtros dinâmicos de forma segura
    if ano is not None:
        query_str += " AND ano = :ano"
        params["ano"] = ano
        
    if mes is not None:
        query_str += " AND mes = :mes"
        params["mes"] = mes
        
    if codigo_cid is not None:
        query_str += " AND codigo_cid LIKE :codigo_cid"
        params["codigo_cid"] = f"%{codigo_cid}%"
        
    if grupo_cid is not None:
        query_str += " AND grupo_cid LIKE :grupo_cid"
        params["grupo_cid"] = f"%{grupo_cid}%"

    # Paginação padrão SQL Server 2012+ requer cláusula ORDER BY explicativa
    query_str += " ORDER BY ano DESC, mes DESC, codigo_cid ASC"
    query_str += " OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
    
    params["limit"] = limit
    params["offset"] = offset

    try:
        result = db.execute(text(query_str), params)
        # Converte as linhas resultantes em dicionários serializáveis mapeados por coluna
        rows = [dict(row) for row in result.mappings()]
        return rows
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar a view ouro.agg_cid_mensal: {str(e)}"
        )
