from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


QuestionType = Literal["analytical", "conceptual", "dashboard", "metadata", "unknown", "blocked"]
OrderDirection = Literal["ASC", "DESC"]


class OrderBy(BaseModel):
    campo: str
    direcao: OrderDirection = "DESC"

    @field_validator("direcao", mode="before")
    @classmethod
    def normalize_direction(cls, value: Any) -> str:
        if value is None:
            return "DESC"
        return str(value).upper()


class QueryPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo: QuestionType
    assunto: str | None = None
    tabela: str | None = None
    metrica: str | None = None
    dimensoes: list[str] = Field(default_factory=list)
    filtros: dict[str, Any] = Field(default_factory=dict)
    agrupamento: list[str] = Field(default_factory=list)
    ordenacao: OrderBy | None = None
    limite: int = Field(default=10, ge=1)
    necessita_sql: bool = True
    dashboard: str | None = None
    intencao: str | None = None

    @field_validator("limite", mode="before")
    @classmethod
    def default_limit(cls, value: Any) -> int:
        if value in (None, ""):
            return 10
        return int(value)

    def public_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)


class RouterDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo: QuestionType
    assunto: str | None = None
    confianca: float = Field(default=0.0, ge=0.0, le=1.0)
    justificativa: str = ""
    intencao: str | None = None
    dashboard: str | None = None

    def public_dict(self) -> dict[str, Any]:
        return self.model_dump(exclude_none=True)
