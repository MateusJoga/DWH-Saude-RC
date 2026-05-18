"use client";

import React, { useEffect, useState } from "react";
import KPICards from "@/components/KPICards";
import HospitalTable from "@/components/HospitalTable";
import CidTable from "@/components/CidTable";
import { 
  getHospitais, 
  getCids, 
  HospitalAggregation, 
  CidAggregation, 
  HospitalFilters, 
  CidFilters 
} from "@/services/api";
import { AlertTriangle, RefreshCw, Layers } from "lucide-react";

export default function DashboardPage() {
  const [hospitais, setHospitais] = useState<HospitalAggregation[]>([]);
  const [cids, setCids] = useState<CidAggregation[]>([]);
  
  const [loadingHospitais, setLoadingHospitais] = useState<boolean>(true);
  const [loadingCids, setLoadingCids] = useState<boolean>(true);
  
  const [errorHospitais, setErrorHospitais] = useState<string | null>(null);
  const [errorCids, setErrorCids] = useState<string | null>(null);

  // Estados dos filtros ativos (por padrão traz limit de 10 registros para performance e foco analítico)
  const [hospitalFilters, setHospitalFilters] = useState<HospitalFilters>({
    limit: 50,
    offset: 0
  });

  const [cidFilters, setCidFilters] = useState<CidFilters>({
    limit: 50,
    offset: 0
  });

  // Efeito para buscar dados de Hospitais
  useEffect(() => {
    async function carregarHospitais() {
      setLoadingHospitais(true);
      setErrorHospitais(null);
      try {
        const data = await getHospitais(hospitalFilters);
        setHospitais(data);
      } catch (err: any) {
        setErrorHospitais(err.message || "Erro desconhecido ao carregar dados de hospitais.");
      } finally {
        setLoadingHospitais(false);
      }
    }
    carregarHospitais();
  }, [hospitalFilters]);

  // Efeito para buscar dados de CIDs
  useEffect(() => {
    async function carregarCids() {
      setLoadingCids(true);
      setErrorCids(null);
      try {
        const data = await getCids(cidFilters);
        setCids(data);
      } catch (err: any) {
        setErrorCids(err.message || "Erro desconhecido ao carregar dados de CIDs.");
      } finally {
        setLoadingCids(false);
      }
    }
    carregarCids();
  }, [cidFilters]);

  // Handlers para mudança de filtros
  const handleHospitalFilterChange = (novosFiltros: HospitalFilters) => {
    setHospitalFilters(novosFiltros);
  };

  const handleCidFilterChange = (novosFiltros: CidFilters) => {
    setCidFilters(novosFiltros);
  };

  return (
    <div className="space-y-6">
      {/* Título da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white">Painel Geral de Indicadores</h1>
          <p className="text-xs text-gray-400">Análise de internações hospitalares e morbidades da rede municipal</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-950/20 px-3 py-1.5 rounded-lg border border-teal-900/50">
          <Layers className="h-4 w-4" />
          <span>Camada Ouro Operacional</span>
        </div>
      </div>

      {/* Seção 1: KPI Cards */}
      <KPICards 
        hospitalData={hospitais} 
        loading={loadingHospitais} 
      />

      {/* Notificação de Erros de Conexão */}
      {(errorHospitais || errorCids) && (
        <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20 flex gap-3 text-xs text-red-400 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold text-sm block mb-1">Aviso: Erro de Comunicação com a API</span>
            <p>
              Não foi possível buscar dados da API FastAPI. Certifique-se de que os contêineres de backend e do banco SQL Server estão ativos.
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-red-300 bg-red-950/40 p-1.5 rounded border border-red-900/40">
              LOG: {errorHospitais || errorCids}
            </p>
          </div>
        </div>
      )}

      {/* Seção 2: Tabela de Hospitais */}
      <HospitalTable 
        data={hospitais}
        loading={loadingHospitais}
        onFilterChange={handleHospitalFilterChange}
        filters={hospitalFilters}
      />

      {/* Seção 3: Tabela de CIDs */}
      <CidTable 
        data={cids}
        loading={loadingCids}
        onFilterChange={handleCidFilterChange}
        filters={cidFilters}
      />
    </div>
  );
}
