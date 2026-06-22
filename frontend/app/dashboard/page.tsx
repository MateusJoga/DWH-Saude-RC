"use client";

import React, { useEffect, useState } from "react";
import AggregateTable from "@/components/AggregateTable";
import CidTable from "@/components/CidTable";
import FactDetailTable from "@/components/FactDetailTable";
import HospitalTable from "@/components/HospitalTable";
import KPICards, { DashboardResumo } from "@/components/KPICards";
import {
  CidAggregation,
  CidFilters,
  FatoInternacao,
  FatoProcedimento,
  FatoProcedimentoFilters,
  GenericTableRow,
  HospitalAggregation,
  HospitalFilters,
  getCids,
  getDashboardResumo,
  getFatoInternacoes,
  getFatoProcedimentos,
  getHospitais,
  getTabelaAgregada,
} from "@/services/api";
import { AlertTriangle, Layers } from "lucide-react";

const DEFAULT_FILTERS = { limit: 20, offset: 0 };

export default function DashboardPage() {
  const [hospitais, setHospitais] = useState<HospitalAggregation[]>([]);
  const [cids, setCids] = useState<CidAggregation[]>([]);
  const [fatoInternacoes, setFatoInternacoes] = useState<FatoInternacao[]>([]);
  const [fatoProcedimentos, setFatoProcedimentos] = useState<FatoProcedimento[]>([]);
  const [aggInternacoes, setAggInternacoes] = useState<GenericTableRow[]>([]);
  const [aggProcedimentos, setAggProcedimentos] = useState<GenericTableRow[]>([]);
  const [aggMortalidade, setAggMortalidade] = useState<GenericTableRow[]>([]);
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(true);

  const [totalHospitais, setTotalHospitais] = useState(0);
  const [totalCids, setTotalCids] = useState(0);
  const [totalFatoInternacoes, setTotalFatoInternacoes] = useState(0);
  const [totalFatoProcedimentos, setTotalFatoProcedimentos] = useState(0);
  const [totalAggInternacoes, setTotalAggInternacoes] = useState(0);
  const [totalAggProcedimentos, setTotalAggProcedimentos] = useState(0);
  const [totalAggMortalidade, setTotalAggMortalidade] = useState(0);

  const [loadingHospitais, setLoadingHospitais] = useState(true);
  const [loadingCids, setLoadingCids] = useState(true);
  const [loadingFatoInternacoes, setLoadingFatoInternacoes] = useState(true);
  const [loadingFatoProcedimentos, setLoadingFatoProcedimentos] = useState(true);
  const [loadingAggInternacoes, setLoadingAggInternacoes] = useState(true);
  const [loadingAggProcedimentos, setLoadingAggProcedimentos] = useState(true);
  const [loadingAggMortalidade, setLoadingAggMortalidade] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [hospitalFilters, setHospitalFilters] = useState<HospitalFilters>(DEFAULT_FILTERS);
  const [cidFilters, setCidFilters] = useState<CidFilters>(DEFAULT_FILTERS);
  const [fatoInternacaoFilters, setFatoInternacaoFilters] = useState<FatoProcedimentoFilters>(DEFAULT_FILTERS);
  const [fatoProcedimentoFilters, setFatoProcedimentoFilters] = useState<FatoProcedimentoFilters>(DEFAULT_FILTERS);
  const [aggInternacoesFilters, setAggInternacoesFilters] = useState<FatoProcedimentoFilters>(DEFAULT_FILTERS);
  const [aggProcedimentosFilters, setAggProcedimentosFilters] = useState<FatoProcedimentoFilters>(DEFAULT_FILTERS);
  const [aggMortalidadeFilters, setAggMortalidadeFilters] = useState<FatoProcedimentoFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    async function carregar() {
      setLoadingFatoInternacoes(true);
      try {
        const result = await getFatoInternacoes(fatoInternacaoFilters);
        setFatoInternacoes(result.data);
        setTotalFatoInternacoes(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar internações detalhadas.");
      } finally {
        setLoadingFatoInternacoes(false);
      }
    }
    carregar();
  }, [fatoInternacaoFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingFatoProcedimentos(true);
      try {
        const result = await getFatoProcedimentos(fatoProcedimentoFilters);
        setFatoProcedimentos(result.data);
        setTotalFatoProcedimentos(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar procedimentos detalhados.");
      } finally {
        setLoadingFatoProcedimentos(false);
      }
    }
    carregar();
  }, [fatoProcedimentoFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingAggInternacoes(true);
      try {
        const result = await getTabelaAgregada("agg-internacoes-mensais", aggInternacoesFilters);
        setAggInternacoes(result.data);
        setTotalAggInternacoes(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar internações mensais.");
      } finally {
        setLoadingAggInternacoes(false);
      }
    }
    carregar();
  }, [aggInternacoesFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingAggProcedimentos(true);
      try {
        const result = await getTabelaAgregada("agg-procedimentos-mensais", aggProcedimentosFilters);
        setAggProcedimentos(result.data);
        setTotalAggProcedimentos(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar procedimentos mensais.");
      } finally {
        setLoadingAggProcedimentos(false);
      }
    }
    carregar();
  }, [aggProcedimentosFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingAggMortalidade(true);
      try {
        const result = await getTabelaAgregada("agg-mortalidade-hospital", aggMortalidadeFilters);
        setAggMortalidade(result.data);
        setTotalAggMortalidade(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar mortalidade hospitalar.");
      } finally {
        setLoadingAggMortalidade(false);
      }
    }
    carregar();
  }, [aggMortalidadeFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingHospitais(true);
      try {
        const result = await getHospitais(hospitalFilters);
        setHospitais(result.data);
        setTotalHospitais(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar hospitais.");
      } finally {
        setLoadingHospitais(false);
      }
    }
    carregar();
  }, [hospitalFilters]);

  useEffect(() => {
    async function carregar() {
      setLoadingCids(true);
      try {
        const result = await getCids(cidFilters);
        setCids(result.data);
        setTotalCids(result.total);
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao carregar CIDs.");
      } finally {
        setLoadingCids(false);
      }
    }
    carregar();
  }, [cidFilters]);

  useEffect(() => {
  async function carregarResumo() {
    setLoadingResumo(true);

    try {
      const data = await getDashboardResumo();
      setResumo(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao carregar resumo do dashboard.");
    } finally {
      setLoadingResumo(false);
    }
  }

  carregarResumo();
  }, []);

  const internacoesMensaisColumns = [
    { key: "ano", label: "Ano" },
    { key: "mes", label: "Mês" },
    { key: "cnes", label: "CNES" },
    { key: "id_hospital", label: "Hospital" },
    { key: "quantidade_internacoes", label: "Internações", align: "right" as const, format: "number" as const },
    { key: "quantidade_obitos", label: "Óbitos", align: "right" as const, format: "number" as const },
    { key: "valor_total_internacoes", label: "Valor Total", align: "right" as const, format: "currency" as const },
  ];

  const procedimentosMensaisColumns = [
    { key: "ano", label: "Ano" },
    { key: "mes", label: "Mês" },
    { key: "cnes", label: "CNES" },
    { key: "codigo_procedimento", label: "Procedimento" },
    { key: "total_procedimentos", label: "Procedimentos", align: "right" as const, format: "number" as const },
    { key: "valor_total_procedimentos", label: "Valor Total", align: "right" as const, format: "currency" as const },
  ];

  const mortalidadeColumns = [
    { key: "ano", label: "Ano" },
    { key: "mes", label: "Mês" },
    { key: "cnes", label: "CNES" },
    { key: "id_hospital", label: "Hospital" },
    { key: "total_internacoes", label: "Internações", align: "right" as const, format: "number" as const },
    { key: "total_obitos", label: "Óbitos", align: "right" as const, format: "number" as const },
    { key: "taxa_mortalidade", label: "Taxa", align: "right" as const, format: "percent" as const },
  ];

  const filtrosInternacoesAgregadas = [
    { key: "ano" as const, label: "Ano", type: "number" as const, placeholder: "Ex: 2024" },
    { key: "mes" as const, label: "Mês", type: "month" as const },
    { key: "cnes" as const, label: "CNES", placeholder: "Hospital" },
    { key: "id_hospital" as const, label: "ID Hospital", type: "number" as const },
    { key: "uf_hospital" as const, label: "UF", placeholder: "SP" },
    { key: "especialidade" as const, label: "Especialidade", placeholder: "Clínica" },
    { key: "complexidade" as const, label: "Complexidade", placeholder: "Alta" },
    { key: "grupo_cid" as const, label: "Grupo CID", placeholder: "Pneumonia" },
  ];

  const filtrosProcedimentosAgregados = [
    { key: "ano" as const, label: "Ano", type: "number" as const, placeholder: "Ex: 2024" },
    { key: "mes" as const, label: "Mês", type: "month" as const },
    { key: "cnes" as const, label: "CNES", placeholder: "Hospital" },
    { key: "id_hospital" as const, label: "ID Hospital", type: "number" as const },
    { key: "codigo_procedimento" as const, label: "Procedimento", placeholder: "Código" },
    { key: "categoria_profissional" as const, label: "Profissional", placeholder: "Categoria" },
    { key: "complexidade" as const, label: "Complexidade", placeholder: "Alta" },
    { key: "tipo_financiamento" as const, label: "Financiamento", placeholder: "Tipo" },
  ];

  const filtrosMortalidade = [
    { key: "ano" as const, label: "Ano", type: "number" as const, placeholder: "Ex: 2024" },
    { key: "mes" as const, label: "Mês", type: "month" as const },
    { key: "cnes" as const, label: "CNES", placeholder: "Hospital" },
    { key: "id_hospital" as const, label: "ID Hospital", type: "number" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white">Painel Geral de Indicadores</h1>
          <p className="text-xs text-gray-400">Análise de internações hospitalares e morbidades da rede municipal</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-950/20 px-3 py-1.5 rounded-lg border border-teal-900/50">
          <Layers className="h-4 w-4" />
          <span>Indicadores Consolidados</span>
        </div>
      </div>

      <KPICards resumo={resumo} loading={loadingResumo} />

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-900/50 bg-red-950/20 flex gap-3 text-xs text-red-400 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold text-sm block mb-1">Aviso: Erro de Comunicação com a API</span>
            <p>Não foi possível buscar dados da API. Verifique se backend e banco estão ativos.</p>
            <p className="mt-1.5 font-mono text-[10px] text-red-300 bg-red-950/40 p-1.5 rounded border border-red-900/40">LOG: {errorMessage}</p>
          </div>
        </div>
      )}

      <FactDetailTable kind="internacoes" title="Internações Detalhadas" data={fatoInternacoes} total={totalFatoInternacoes} loading={loadingFatoInternacoes} filters={fatoInternacaoFilters} onFilterChange={setFatoInternacaoFilters} />
      <FactDetailTable kind="procedimentos" title="Procedimentos Realizados" data={fatoProcedimentos} total={totalFatoProcedimentos} loading={loadingFatoProcedimentos} filters={fatoProcedimentoFilters} onFilterChange={setFatoProcedimentoFilters} />

      <AggregateTable title="Internações Mensais Agregadas" data={aggInternacoes} total={totalAggInternacoes} loading={loadingAggInternacoes} filters={aggInternacoesFilters} columns={internacoesMensaisColumns} filterFields={filtrosInternacoesAgregadas} onFilterChange={setAggInternacoesFilters} />
      <AggregateTable title="Procedimentos Mensais Agregados" data={aggProcedimentos} total={totalAggProcedimentos} loading={loadingAggProcedimentos} filters={aggProcedimentosFilters} columns={procedimentosMensaisColumns} filterFields={filtrosProcedimentosAgregados} onFilterChange={setAggProcedimentosFilters} />
      <AggregateTable title="Mortalidade Hospitalar Agregada" data={aggMortalidade} total={totalAggMortalidade} loading={loadingAggMortalidade} filters={aggMortalidadeFilters} columns={mortalidadeColumns} filterFields={filtrosMortalidade} onFilterChange={setAggMortalidadeFilters} />

      <HospitalTable data={hospitais} total={totalHospitais} loading={loadingHospitais} onFilterChange={setHospitalFilters} filters={hospitalFilters} />
      <CidTable data={cids} total={totalCids} loading={loadingCids} onFilterChange={setCidFilters} filters={cidFilters} />
    </div>
  );
}
