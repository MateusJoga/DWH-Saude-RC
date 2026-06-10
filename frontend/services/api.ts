// =========================================================================
// SERVICES: CENTRAL DE COMUNICAÇÃO COM A API FASTAPI
// =========================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEFAULT_TABLE_LIMIT = 20;

// -------------------------------------------------------------------------
// TIPOS E INTERFACES PARA O FRONTEND
// -------------------------------------------------------------------------

export interface DatabaseHealth {
  status: string;
  latency_ms: number;
  server_version: string;
  error?: string;
}

export interface ApiHealthResponse {
  status: string;
  api_version: string;
  database: DatabaseHealth;
}

export interface HospitalAggregation {
  ano: number;
  mes: number;
  nome_mes: string;
  id_hospital: number;
  cnes: string | null;
  municipio_hospital: string | null;
  uf_hospital: string | null;
  quantidade_internacoes: number;
  valor_total_internacoes: number | null;
  valor_total_uti: number | null;
  media_dias_permanencia: number | null;
  quantidade_obitos: number | null;
  taxa_obito_percentual: number | null;
  quantidade_longa_permanencia: number | null;
}

export interface CidAggregation {
  ano: number;
  mes: number;
  nome_mes: string;
  codigo_cid: string;
  grupo_cid: string | null;
  capitulo_cid: string | null;
  quantidade_internacoes: number;
  valor_total_internacoes: number | null;
  valor_total_uti: number | null;
  media_dias_permanencia: number | null;
  quantidade_obitos: number | null;
  taxa_obito_percentual: number | null;
  quantidade_longa_permanencia: number | null;
}

export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface FatoInternacao {
  id_internacao: number;
  numero_aih: string | null;
  ano: number;
  mes: number;
  nome_mes: string;
  cnes: string | null;
  municipio_hospital: string | null;
  uf_hospital: string | null;
  sexo: string | null;
  faixa_etaria: string | null;
  especialidade: string | null;
  complexidade: string | null;
  codigo_cid: string | null;
  grupo_cid: string | null;
  valor_total_internacao: number | null;
  valor_uti: number | null;
  dias_permanencia: number | null;
  obito: boolean | number | null;
}

export interface FatoProcedimento {
  id_procedimento: number;
  numero_aih: string | null;
  ano: number;
  mes: number;
  nome_mes: string;
  cnes: string | null;
  municipio_hospital: string | null;
  uf_hospital: string | null;
  codigo_procedimento: string | null;
  procedimento_cirurgico: boolean | number | null;
  procedimento_alto_custo: boolean | number | null;
  categoria_profissional: string | null;
  codigo_cid: string | null;
  grupo_cid: string | null;
  valor_procedimento: number | null;
  pontos_sus: number | null;
  tipo_financiamento: string | null;
  quantidade_atos: number | null;
  quantidade_procedimentos: number | null;
  complexidade: string | null;
}

export type GenericTableRow = Record<string, string | number | boolean | null>;
export type SortDirection = "asc" | "desc";

export interface IaPerguntaRequest {
  pergunta: string;
}

export interface IaPerguntaResponse {
  pergunta: string;
  sql: string | null;
  dados: Record<string, unknown>[];
  resposta: string;
  status: string;
  tabelas: string[];
  engine: string;
}

export interface DashboardResumo {
  total_internacoes: number;
  total_obitos: number;
  valor_total_internacoes: number;
  valor_total_uti: number;
  total_procedimentos: number;
  valor_total_procedimentos: number;
}

export interface SerieInternacoes {
  ano: number;
  mes: number;
  nome_mes: string;
  quantidade_internacoes: number;
  quantidade_obitos: number;
  valor_total_internacoes: number;
}

export interface TopHospital {
  cnes: string | null;
  municipio_hospital: string | null;
  quantidade_internacoes: number;
  valor_total_internacoes: number;
  quantidade_obitos: number;
}

export interface TopCid {
  codigo_cid: string;
  grupo_cid: string | null;
  capitulo_cid: string | null;
  quantidade_internacoes: number;
  quantidade_obitos: number;
}

export interface TopProcedimento {
  codigo_procedimento: string;
  total_procedimentos: number;
  valor_total_procedimentos: number;
}

// -------------------------------------------------------------------------
// DYNAMIC FILTERS INTERFACES
// -------------------------------------------------------------------------

export interface HospitalFilters {
  ano?: number;
  mes?: number;
  uf_hospital?: string;
  cnes?: string;
  order_by?: string;
  order_dir?: SortDirection;
  limit?: number;
  offset?: number;
}

export interface CidFilters {
  ano?: number;
  mes?: number;
  codigo_cid?: string;
  grupo_cid?: string;
  order_by?: string;
  order_dir?: SortDirection;
  limit?: number;
  offset?: number;
}

export interface FatoInternacaoFilters {
  ano?: number;
  mes?: number;
  cnes?: string;
  codigo_cid?: string;
  id_hospital?: number;
  sexo?: string;
  faixa_etaria?: string;
  especialidade?: string;
  complexidade?: string;
  obito?: number;
  order_by?: string;
  order_dir?: SortDirection;
  limit?: number;
  offset?: number;
}

export interface FatoProcedimentoFilters extends FatoInternacaoFilters {
  codigo_procedimento?: string;
  categoria_profissional?: string;
  grupo_cid?: string;
  capitulo_cid?: string;
  uf_hospital?: string;
  tipo_financiamento?: string;
}

// -------------------------------------------------------------------------
// FUNÇÕES DE SERVIÇO HTTP (FETCH)
// -------------------------------------------------------------------------

/**
 * Verifica o status de saúde do backend e do banco SQL Server.
 */
export async function getApiHealth(): Promise<ApiHealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Falha ao se conectar com a API de Saúde do Backend.");
  }
  return res.json();
}

function appendPagination(queryParams: URLSearchParams, limit?: number, offset?: number) {
  queryParams.append("limit", String(limit ?? DEFAULT_TABLE_LIMIT));
  queryParams.append("offset", String(offset ?? 0));
}

function appendSort(queryParams: URLSearchParams, orderBy?: string, orderDir?: SortDirection) {
  if (orderBy) queryParams.append("order_by", orderBy);
  if (orderDir) queryParams.append("order_dir", orderDir);
}

function appendPeriodo(queryParams: URLSearchParams, filters: { ano?: number; mes?: number }) {
  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
}

async function parseListResponse<T>(res: Response, limit?: number, offset?: number): Promise<ApiListResponse<T>> {
  const data = await res.json();
  const totalHeader = res.headers.get("X-Total-Count");
  const headerTotal = totalHeader === null ? Number.NaN : Number(totalHeader);
  return {
    data,
    total: Number.isFinite(headerTotal) ? headerTotal : estimateTotalWhenHeaderIsMissing(data.length, limit, offset),
  };
}

function estimateTotalWhenHeaderIsMissing(dataLength: number, limit?: number, offset?: number) {
  const pageLimit = limit ?? DEFAULT_TABLE_LIMIT;
  const pageOffset = offset ?? 0;
  return pageOffset + dataLength + (dataLength === pageLimit ? 1 : 0);
}

/**
 * Consulta as agregações de internações por hospital.
 */
export async function getHospitais(filters: HospitalFilters = {}): Promise<ApiListResponse<HospitalAggregation>> {
  const queryParams = new URLSearchParams();
  
  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.uf_hospital) queryParams.append("uf_hospital", filters.uf_hospital);
  if (filters.cnes) queryParams.append("cnes", filters.cnes);
  
  // Paginação
  appendPagination(queryParams, filters.limit, filters.offset);
  appendSort(queryParams, filters.order_by, filters.order_dir);

  const url = `${API_BASE_URL}/consultas/hospitais?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error("Erro ao obter dados de internações hospitalares.");
  }
  return parseListResponse<HospitalAggregation>(res, filters.limit, filters.offset);
}

/**
 * Consulta as agregações de internações por CID.
 */
export async function getCids(filters: CidFilters = {}): Promise<ApiListResponse<CidAggregation>> {
  const queryParams = new URLSearchParams();
  
  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.codigo_cid) queryParams.append("codigo_cid", filters.codigo_cid);
  if (filters.grupo_cid) queryParams.append("grupo_cid", filters.grupo_cid);
  
  // Paginação
  appendPagination(queryParams, filters.limit, filters.offset);
  appendSort(queryParams, filters.order_by, filters.order_dir);

  const url = `${API_BASE_URL}/consultas/cids?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error("Erro ao obter dados de patologias (CIDs).");
  }
  return parseListResponse<CidAggregation>(res, filters.limit, filters.offset);
}

export async function getFatoInternacoes(filters: FatoInternacaoFilters = {}): Promise<ApiListResponse<FatoInternacao>> {
  const queryParams = new URLSearchParams();

  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.cnes) queryParams.append("cnes", filters.cnes);
  if (filters.codigo_cid) queryParams.append("codigo_cid", filters.codigo_cid);
  if (filters.id_hospital !== undefined && filters.id_hospital !== null) queryParams.append("id_hospital", String(filters.id_hospital));
  if (filters.sexo) queryParams.append("sexo", filters.sexo);
  if (filters.faixa_etaria) queryParams.append("faixa_etaria", filters.faixa_etaria);
  if (filters.especialidade) queryParams.append("especialidade", filters.especialidade);
  if (filters.complexidade) queryParams.append("complexidade", filters.complexidade);
  if (filters.obito !== undefined && filters.obito !== null) queryParams.append("obito", String(filters.obito));
  appendPagination(queryParams, filters.limit, filters.offset);
  appendSort(queryParams, filters.order_by, filters.order_dir);

  const url = `${API_BASE_URL}/consultas/fato-internacoes?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Erro ao obter dados detalhados de internações.");
  }
  return parseListResponse<FatoInternacao>(res, filters.limit, filters.offset);
}

export async function getFatoProcedimentos(filters: FatoProcedimentoFilters = {}): Promise<ApiListResponse<FatoProcedimento>> {
  const queryParams = new URLSearchParams();

  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.cnes) queryParams.append("cnes", filters.cnes);
  if (filters.codigo_cid) queryParams.append("codigo_cid", filters.codigo_cid);
  if (filters.codigo_procedimento) queryParams.append("codigo_procedimento", filters.codigo_procedimento);
  if (filters.id_hospital !== undefined && filters.id_hospital !== null) queryParams.append("id_hospital", String(filters.id_hospital));
  if (filters.categoria_profissional) queryParams.append("categoria_profissional", filters.categoria_profissional);
  if (filters.complexidade) queryParams.append("complexidade", filters.complexidade);
  appendPagination(queryParams, filters.limit, filters.offset);
  appendSort(queryParams, filters.order_by, filters.order_dir);

  const url = `${API_BASE_URL}/consultas/fato-procedimentos?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Erro ao obter dados detalhados de procedimentos.");
  }
  return parseListResponse<FatoProcedimento>(res, filters.limit, filters.offset);
}

export async function getTabelaAgregada(endpoint: string, filters: FatoProcedimentoFilters = {}): Promise<ApiListResponse<GenericTableRow>> {
  const queryParams = new URLSearchParams();

  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.cnes) queryParams.append("cnes", filters.cnes);
  if (filters.codigo_cid) queryParams.append("codigo_cid", filters.codigo_cid);
  if (filters.codigo_procedimento) queryParams.append("codigo_procedimento", filters.codigo_procedimento);
  if (filters.id_hospital !== undefined && filters.id_hospital !== null) queryParams.append("id_hospital", String(filters.id_hospital));
  if (filters.grupo_cid) queryParams.append("grupo_cid", filters.grupo_cid);
  if (filters.capitulo_cid) queryParams.append("capitulo_cid", filters.capitulo_cid);
  if (filters.uf_hospital) queryParams.append("uf_hospital", filters.uf_hospital);
  if (filters.especialidade) queryParams.append("especialidade", filters.especialidade);
  if (filters.complexidade) queryParams.append("complexidade", filters.complexidade);
  if (filters.categoria_profissional) queryParams.append("categoria_profissional", filters.categoria_profissional);
  if (filters.tipo_financiamento) queryParams.append("tipo_financiamento", filters.tipo_financiamento);
  appendPagination(queryParams, filters.limit, filters.offset);
  appendSort(queryParams, filters.order_by, filters.order_dir);

  const url = `${API_BASE_URL}/consultas/${endpoint}?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Erro ao obter dados agregados.");
  }
  return parseListResponse<GenericTableRow>(res, filters.limit, filters.offset);
}

export async function getDashboardResumo(filters: { ano?: number; mes?: number } = {}): Promise<DashboardResumo> {
  const queryParams = new URLSearchParams();
  appendPeriodo(queryParams, filters);

  const res = await fetch(`${API_BASE_URL}/consultas/resumo?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao obter resumo dos indicadores.");
  }
  return res.json();
}

export async function getSeriesInternacoes(filters: { ano?: number; mes?: number; limit?: number } = {}): Promise<SerieInternacoes[]> {
  const queryParams = new URLSearchParams();
  appendPeriodo(queryParams, filters);
  queryParams.append("limit", String(filters.limit ?? 120));

  const res = await fetch(`${API_BASE_URL}/consultas/series-internacoes?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao obter série de internações.");
  }
  return res.json();
}

export async function getTopHospitais(filters: { ano?: number; mes?: number; limit?: number } = {}): Promise<TopHospital[]> {
  const queryParams = new URLSearchParams();
  appendPeriodo(queryParams, filters);
  queryParams.append("limit", String(filters.limit ?? 10));

  const res = await fetch(`${API_BASE_URL}/consultas/top-hospitais?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao obter ranking de hospitais.");
  }
  return res.json();
}

export async function getTopCids(filters: { ano?: number; mes?: number; limit?: number } = {}): Promise<TopCid[]> {
  const queryParams = new URLSearchParams();
  appendPeriodo(queryParams, filters);
  queryParams.append("limit", String(filters.limit ?? 10));

  const res = await fetch(`${API_BASE_URL}/consultas/top-cids?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao obter ranking de CIDs.");
  }
  return res.json();
}

export async function getTopProcedimentos(filters: { ano?: number; mes?: number; limit?: number } = {}): Promise<TopProcedimento[]> {
  const queryParams = new URLSearchParams();
  appendPeriodo(queryParams, filters);
  queryParams.append("limit", String(filters.limit ?? 10));

  const res = await fetch(`${API_BASE_URL}/consultas/top-procedimentos?${queryParams.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Erro ao obter ranking de procedimentos.");
  }
  return res.json();
}

export async function getResumoDashboard() {
  const response = await fetch(`${API_BASE_URL}/consultas/resumo`);

  if (!response.ok) {
    throw new Error("Erro ao buscar resumo do dashboard.");
  }

  return response.json();
}

/**
 * Envia uma pergunta em linguagem natural para o endpoint do Assistente de IA.
 */
export async function postIaPergunta(pergunta: string): Promise<IaPerguntaResponse> {
  const url = `${API_BASE_URL}/ia/pergunta-llama`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pergunta }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Erro ao processar sua pergunta com a Inteligência Artificial.");
  }
  return res.json();
}
