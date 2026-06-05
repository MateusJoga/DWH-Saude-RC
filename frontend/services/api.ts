// =========================================================================
// SERVICES: CENTRAL DE COMUNICAÇÃO COM A API FASTAPI
// =========================================================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// -------------------------------------------------------------------------
// DYNAMIC FILTERS INTERFACES
// -------------------------------------------------------------------------

export interface HospitalFilters {
  ano?: number;
  mes?: number;
  uf_hospital?: string;
  cnes?: string;
  limit?: number;
  offset?: number;
}

export interface CidFilters {
  ano?: number;
  mes?: number;
  codigo_cid?: string;
  grupo_cid?: string;
  limit?: number;
  offset?: number;
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

/**
 * Consulta a view de agregações de internações por Hospital na camada Ouro.
 */
export async function getHospitais(filters: HospitalFilters = {}): Promise<HospitalAggregation[]> {
  const queryParams = new URLSearchParams();
  
  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.uf_hospital) queryParams.append("uf_hospital", filters.uf_hospital);
  if (filters.cnes) queryParams.append("cnes", filters.cnes);
  
  // Paginação
  queryParams.append("limit", String(filters.limit ?? 100));
  queryParams.append("offset", String(filters.offset ?? 0));

  const url = `${API_BASE_URL}/consultas/hospitais?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error("Erro ao obter dados de internações hospitalares.");
  }
  return res.json();
}

/**
 * Consulta a view de agregações de internações por CID na camada Ouro.
 */
export async function getCids(filters: CidFilters = {}): Promise<CidAggregation[]> {
  const queryParams = new URLSearchParams();
  
  if (filters.ano !== undefined && filters.ano !== null) queryParams.append("ano", String(filters.ano));
  if (filters.mes !== undefined && filters.mes !== null) queryParams.append("mes", String(filters.mes));
  if (filters.codigo_cid) queryParams.append("codigo_cid", filters.codigo_cid);
  if (filters.grupo_cid) queryParams.append("grupo_cid", filters.grupo_cid);
  
  // Paginação
  queryParams.append("limit", String(filters.limit ?? 100));
  queryParams.append("offset", String(filters.offset ?? 0));

  const url = `${API_BASE_URL}/consultas/cids?${queryParams.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  
  if (!res.ok) {
    throw new Error("Erro ao obter dados de patologias (CIDs).");
  }
  return res.json();
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
