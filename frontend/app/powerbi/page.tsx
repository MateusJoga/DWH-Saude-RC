"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileBarChart, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  Database, 
  Sparkles,
  RefreshCw,
  LayoutGrid,
  Filter,
  AlertTriangle
} from "lucide-react";
import { 
  getHospitais, 
  getCids, 
  HospitalAggregation, 
  CidAggregation 
} from "@/services/api";

// Dados simulados de demonstração (caso a base de dados esteja vazia ou offline)
const DEMO_HOSPITAIS: HospitalAggregation[] = [
  { ano: 2024, mes: 1, nome_mes: "Janeiro", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1250, valor_total_internacoes: 1250000, valor_total_uti: 350000, media_dias_permanencia: 5.4, quantidade_obitos: 32, taxa_obito_percentual: 2.56, quantidade_longa_permanencia: 45 },
  { ano: 2024, mes: 2, nome_mes: "Fevereiro", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1400, valor_total_internacoes: 1450000, valor_total_uti: 420000, media_dias_permanencia: 5.8, quantidade_obitos: 41, taxa_obito_percentual: 2.93, quantidade_longa_permanencia: 58 },
  { ano: 2024, mes: 3, nome_mes: "Março", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1100, valor_total_internacoes: 1100000, valor_total_uti: 290000, media_dias_permanencia: 4.9, quantidade_obitos: 26, taxa_obito_percentual: 2.36, quantidade_longa_permanencia: 31 },
  { ano: 2024, mes: 4, nome_mes: "Abril", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1600, valor_total_internacoes: 1750000, valor_total_uti: 520000, media_dias_permanencia: 6.2, quantidade_obitos: 49, taxa_obito_percentual: 3.06, quantidade_longa_permanencia: 72 },
  { ano: 2024, mes: 5, nome_mes: "Maio", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1800, valor_total_internacoes: 1950000, valor_total_uti: 600000, media_dias_permanencia: 6.5, quantidade_obitos: 52, taxa_obito_percentual: 2.89, quantidade_longa_permanencia: 81 },
  { ano: 2024, mes: 6, nome_mes: "Junho", id_hospital: 1, cnes: "2079724", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 2100, valor_total_internacoes: 2200000, valor_total_uti: 650000, media_dias_permanencia: 6.9, quantidade_obitos: 64, taxa_obito_percentual: 3.05, quantidade_longa_permanencia: 96 },
  { ano: 2024, mes: 7, nome_mes: "Julho", id_hospital: 2, cnes: "2082210", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 950, valor_total_internacoes: 950000, valor_total_uti: 250000, media_dias_permanencia: 5.1, quantidade_obitos: 21, taxa_obito_percentual: 2.21, quantidade_longa_permanencia: 28 },
  { ano: 2024, mes: 8, nome_mes: "Agosto", id_hospital: 2, cnes: "2082210", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1100, valor_total_internacoes: 1150000, valor_total_uti: 310000, media_dias_permanencia: 5.4, quantidade_obitos: 29, taxa_obito_percentual: 2.64, quantidade_longa_permanencia: 42 },
  { ano: 2024, mes: 9, nome_mes: "Setembro", id_hospital: 2, cnes: "2082210", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1250, valor_total_internacoes: 1300000, valor_total_uti: 380000, media_dias_permanencia: 5.8, quantidade_obitos: 35, taxa_obito_percentual: 2.80, quantidade_longa_permanencia: 53 },
  { ano: 2024, mes: 10, nome_mes: "Outubro", id_hospital: 2, cnes: "2082210", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 1350, valor_total_internacoes: 1400000, valor_total_uti: 410000, media_dias_permanencia: 6.0, quantidade_obitos: 38, taxa_obito_percentual: 2.81, quantidade_longa_permanencia: 60 },
  { ano: 2024, mes: 11, nome_mes: "Novembro", id_hospital: 3, cnes: "2078515", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 780, valor_total_internacoes: 780000, valor_total_uti: 180000, media_dias_permanencia: 4.8, quantidade_obitos: 16, taxa_obito_percentual: 2.05, quantidade_longa_permanencia: 19 },
  { ano: 2024, mes: 12, nome_mes: "Dezembro", id_hospital: 3, cnes: "2078515", municipio_hospital: "Rio Claro", uf_hospital: "SP", quantidade_internacoes: 820, valor_total_internacoes: 850000, valor_total_uti: 210000, media_dias_permanencia: 5.0, quantidade_obitos: 19, taxa_obito_percentual: 2.32, quantidade_longa_permanencia: 24 }
];

const DEMO_CIDS: CidAggregation[] = [
  { ano: 2024, mes: 1, nome_mes: "Janeiro", codigo_cid: "I50", grupo_cid: "Insuficiência Cardíaca", capitulo_cid: "IX", quantidade_internacoes: 843, valor_total_internacoes: 843000, valor_total_uti: 250000, media_dias_permanencia: 6.8, quantidade_obitos: 64, taxa_obito_percentual: 7.59, quantidade_longa_permanencia: 45 },
  { ano: 2024, mes: 2, nome_mes: "Fevereiro", codigo_cid: "J18", grupo_cid: "Pneumonia", capitulo_cid: "X", quantidade_internacoes: 1205, valor_total_internacoes: 1205000, valor_total_uti: 310000, media_dias_permanencia: 7.2, quantidade_obitos: 81, taxa_obito_percentual: 6.72, quantidade_longa_permanencia: 72 },
  { ano: 2024, mes: 3, nome_mes: "Março", codigo_cid: "C34", grupo_cid: "Neoplasia Pulmão", capitulo_cid: "II", quantidade_internacoes: 184, valor_total_internacoes: 550000, valor_total_uti: 180000, media_dias_permanencia: 9.8, quantidade_obitos: 11, taxa_obito_percentual: 5.98, quantidade_longa_permanencia: 22 },
  { ano: 2024, mes: 4, nome_mes: "Abril", codigo_cid: "I64", grupo_cid: "AVC", capitulo_cid: "IX", quantidade_internacoes: 541, valor_total_internacoes: 680000, valor_total_uti: 210000, media_dias_permanencia: 8.5, quantidade_obitos: 32, taxa_obito_percentual: 5.91, quantidade_longa_permanencia: 38 },
  { ano: 2024, mes: 5, nome_mes: "Maio", codigo_cid: "N17", grupo_cid: "Insuficiência Renal Aguda", capitulo_cid: "XIV", quantidade_internacoes: 329, valor_total_internacoes: 450000, valor_total_uti: 140000, media_dias_permanencia: 7.9, quantidade_obitos: 18, taxa_obito_percentual: 5.47, quantidade_longa_permanencia: 27 },
  { ano: 2024, mes: 6, nome_mes: "Junho", codigo_cid: "A09", grupo_cid: "Infecções Intestinais", capitulo_cid: "I", quantidade_internacoes: 480, valor_total_internacoes: 220000, valor_total_uti: 50000, media_dias_permanencia: 3.1, quantidade_obitos: 4, taxa_obito_percentual: 0.83, quantidade_longa_permanencia: 8 }
];

export default function PowerBiPage() {
  const [activeTab, setActiveTab] = useState<string>("internacoes");
  const [isClient, setIsClient] = useState(false);

  // Estados dos Filtros Operacionais
  const [filtroAno, setFiltroAno] = useState<string>("2024");
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [filtroUf, setFiltroUf] = useState<string>("Todos");

  // Dados reais da API
  const [dbHospitais, setDbHospitais] = useState<HospitalAggregation[]>([]);
  const [dbCids, setDbCids] = useState<CidAggregation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Efeito de Inicialização do Cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Busca dados na API ao alterar filtros
  useEffect(() => {
    if (!isClient) return;

    async function buscarDados() {
      setLoading(true);
      setApiError(false);
      try {
        const paramsHosp: any = { limit: 1000 };
        const paramsCids: any = { limit: 1000 };

        if (filtroAno !== "Todos") {
          paramsHosp.ano = parseInt(filtroAno);
          paramsCids.ano = parseInt(filtroAno);
        }
        if (filtroMes !== "Todos") {
          paramsHosp.mes = parseInt(filtroMes);
          paramsCids.mes = parseInt(filtroMes);
        }
        if (filtroUf !== "Todos") {
          paramsHosp.uf_hospital = filtroUf;
        }

        const dataHosp = await getHospitais(paramsHosp);
        const dataCids = await getCids(paramsCids);

        setDbHospitais(dataHosp);
        setDbCids(dataCids);

        // Se o banco retornar vazio, ativa o modo de demonstração para não quebrar a tela
        if (dataHosp.length === 0 && dataCids.length === 0) {
          setIsDemoMode(true);
        } else {
          setIsDemoMode(false);
        }
      } catch (err) {
        console.error("Falha ao comunicar com a API. Ativando modo demonstração.");
        setApiError(true);
        setIsDemoMode(true); // Fallback para demonstração se a API falhar
      } finally {
        setLoading(false);
      }
    }

    buscarDados();
  }, [isClient, filtroAno, filtroMes, filtroUf]);

  // Escolha do Dataset Ativo (Real ou Demo)
  const hospitaisData = useMemo(() => {
    return isDemoMode ? DEMO_HOSPITAIS : dbHospitais;
  }, [isDemoMode, dbHospitais]);

  const cidsData = useMemo(() => {
    return isDemoMode ? DEMO_CIDS : dbCids;
  }, [isDemoMode, dbCids]);

  // Auxiliares de Formatação
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  };

  const formatarNumero = (valor: number) => {
    return valor.toLocaleString("pt-BR");
  };

  // -------------------------------------------------------------------------
  // CÁLCULOS E AGGREGAÇÕES DE INDICADORES (KPIs & GRÁFICOS)
  // -------------------------------------------------------------------------

  // 1. Métricas Globais baseadas nos dados filtrados
  const kpis = useMemo(() => {
    const totalInternacoes = hospitaisData.reduce((acc, curr) => acc + curr.quantidade_internacoes, 0);
    const custoTotal = hospitaisData.reduce((acc, curr) => acc + (curr.valor_total_internacoes || 0), 0);
    const custoUti = hospitaisData.reduce((acc, curr) => acc + (curr.valor_total_uti || 0), 0);
    const obitos = hospitaisData.reduce((acc, curr) => acc + (curr.quantidade_obitos || 0), 0);
    
    // Média de dias ponderada
    const totalDias = hospitaisData.reduce((acc, curr) => acc + ((curr.media_dias_permanencia || 0) * curr.quantidade_internacoes), 0);
    const mediaDias = totalInternacoes > 0 ? (totalDias / totalInternacoes).toFixed(1) : "0.0";
    
    const taxaObito = totalInternacoes > 0 ? ((obitos / totalInternacoes) * 100).toFixed(2) : "0.00";
    const percentUti = custoTotal > 0 ? ((custoUti / custoTotal) * 100).toFixed(1) : "0.0";

    return {
      totalInternacoes,
      custoTotal,
      custoUti,
      mediaDias,
      taxaObito,
      percentUti
    };
  }, [hospitaisData]);

  // 2. Agregação Mensal (Para Gráfico de Linha/Barra de Volume)
  const dadosMensais = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const volumes = Array(12).fill(0);
    const custos = Array(12).fill(0);

    hospitaisData.forEach(curr => {
      // mes index 1-12
      const idx = curr.mes - 1;
      if (idx >= 0 && idx < 12) {
        volumes[idx] += curr.quantidade_internacoes;
        custos[idx] += curr.valor_total_internacoes || 0;
      }
    });

    return meses.map((nome, i) => ({
      nome,
      volume: volumes[i],
      custo: custos[i]
    }));
  }, [hospitaisData]);

  // 3. Agregação por Hospital/CNES
  const dadosHospitais = useMemo(() => {
    const map: Record<string, { name: string; volume: number; custo: number; uti: number }> = {};
    
    hospitaisData.forEach(curr => {
      const cnes = curr.cnes || "Sem Identificação";
      const municipio = curr.municipio_hospital || "Rio Claro";
      const id = `${cnes} (${municipio})`;

      if (!map[id]) {
        map[id] = { name: id, volume: 0, custo: 0, uti: 0 };
      }
      map[id].volume += curr.quantidade_internacoes;
      map[id].custo += curr.valor_total_internacoes || 0;
      map[id].uti += curr.valor_total_uti || 0;
    });

    return Object.values(map).sort((a, b) => b.volume - a.volume);
  }, [hospitaisData]);

  // 4. Agregação por CIDs (Top 5 por volume)
  const dadosCids = useMemo(() => {
    const map: Record<string, { code: string; name: string; volume: number; obitos: number }> = {};

    cidsData.forEach(curr => {
      const cid = curr.codigo_cid;
      const desc = curr.grupo_cid || "Patologia";
      if (!map[cid]) {
        map[cid] = { code: cid, name: desc, volume: 0, obitos: 0 };
      }
      map[cid].volume += curr.quantidade_internacoes;
      map[cid].obitos += curr.quantidade_obitos || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [cidsData]);

  // 5. CIDs de Maior Letalidade (Taxa de óbito)
  const cidsLetais = useMemo(() => {
    const map: Record<string, { code: string; name: string; volume: number; obitos: number; rate: number }> = {};

    cidsData.forEach(curr => {
      const cid = curr.codigo_cid;
      const desc = curr.grupo_cid || "Patologia";
      if (!map[cid]) {
        map[cid] = { code: cid, name: desc, volume: 0, obitos: 0, rate: 0 };
      }
      map[cid].volume += curr.quantidade_internacoes;
      map[cid].obitos += curr.quantidade_obitos || 0;
    });

    return Object.values(map)
      .filter(item => item.volume >= 10) // Evita ruídos estatísticos em volumes pequenos
      .map(item => ({
        ...item,
        rate: (item.obitos / item.volume) * 100
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [cidsData]);

  if (!isClient) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FileBarChart className="h-5.5 w-5.5 text-blue-400" />
            <span>Power BI Dashboards</span>
          </h1>
          <p className="text-xs text-gray-400">Dashboards reativos gerados em tempo real diretamente da base de dados local</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-950/20 px-3 py-1.5 rounded-lg border border-teal-900/50">
            <Database className="h-4 w-4" />
            <span>Banco: SQL Server ({isDemoMode ? "Simulado" : "Conectado"})</span>
          </div>
        </div>
      </div>

      {/* Alertas de Status do Banco e Modo Demonstração */}
      {apiError && (
        <div className="p-3.5 rounded-xl border border-red-900/50 bg-red-950/20 flex gap-3 text-xs text-red-400 items-start animate-fadeIn">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold block">Conexão com a base de dados falhou</span>
            <p>
              Não foi possível contatar o serviço de API. O portal ativou o **Modo de Demonstração (Mock)** para que você possa explorar a estrutura dos painéis de Business Intelligence com dados simulados.
            </p>
          </div>
        </div>
      )}

      {!apiError && isDemoMode && (
        <div className="p-3.5 rounded-xl border border-yellow-900/40 bg-yellow-950/15 flex gap-3 text-xs text-yellow-400 items-start animate-fadeIn">
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
          <div>
            <span className="font-bold block">Base de Dados Vazia</span>
            <p>
              O banco de dados respondeu com sucesso, mas a camada **ouro** está sem registros carregados. O portal está exibindo os dashboards em modo simulado. Carregue dados na Bronze/Prata para alimentar os painéis.
            </p>
          </div>
        </div>
      )}

      {/* Filtros Analíticos Integrados (Estilo Filtros Laterais/Superiores do Power BI) */}
      <section className="p-4 rounded-xl border border-gray-800 bg-[#0F172A] space-y-3.5 shadow-md">
        <div className="flex items-center gap-2 border-b border-gray-850 pb-2">
          <Filter className="h-4 w-4 text-blue-400" />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filtros do Relatório</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#121A2B] px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Todos">Todos os Anos</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#121A2B] px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Todos">Todos os Mêses</option>
              {[
                { v: "1", n: "Janeiro" }, { v: "2", n: "Fevereiro" }, { v: "3", n: "Março" },
                { v: "4", n: "Abril" }, { v: "5", n: "Maio" }, { v: "6", n: "Junho" },
                { v: "7", n: "Julho" }, { v: "8", n: "Agosto" }, { v: "9", n: "Setembro" },
                { v: "10", n: "Outubro" }, { v: "11", n: "Novembro" }, { v: "12", n: "Dezembro" }
              ].map(m => (
                <option key={m.v} value={m.v}>{m.n}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500">UF / Estado</label>
            <select
              value={filtroUf}
              onChange={(e) => setFiltroUf(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#121A2B] px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Todos">Todos os Estados</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
              <option value="MG">Minas Gerais (MG)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Navegação de Abas do Relatório BI */}
      <div className="flex border-b border-gray-850 gap-2 overflow-x-auto pb-px">
        {[
          { id: "internacoes", name: "Painel Geral de Internações" },
          { id: "cids", name: "Morbidades & CIDs" },
          { id: "custos", name: "Custos & Financiamento SUS" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px shrink-0 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 bg-blue-500/[0.02]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Painel Interno Customizado (Estilo Render do Power BI) */}
      <div className="border border-gray-850 bg-[#0B0F19] rounded-xl p-5 shadow-inner space-y-6">
        {/* Barra de Status */}
        <div className="flex items-center justify-between border-b border-gray-850 pb-3 text-[10px]">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              {activeTab === "internacoes" && "Painel Geral de Internações"}
              {activeTab === "cids" && "Epidemiologia e Morbidades (CIDs)"}
              {activeTab === "custos" && "Custos Analíticos e Repasses SUS"}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-gray-500">
            <span>Registros Analisados: <strong className="text-teal-400 font-bold">{formatarNumero(hospitaisData.length)}</strong></span>
            <span>Atualizado: <strong className="text-gray-400">Hoje</strong></span>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex h-[350px] w-full items-center justify-center flex-col gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-gray-400">Recalculando métricas e agregando gráficos da base...</span>
          </div>
        ) : hospitaisData.length === 0 ? (
          <div className="flex h-[300px] w-full items-center justify-center flex-col gap-2 text-center p-6 border border-dashed border-gray-800 rounded-xl">
            <AlertCircle className="h-10 w-10 text-gray-600" />
            <h3 className="text-sm font-bold text-white uppercase">Nenhum registro encontrado</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Não há internações gravadas correspondentes aos filtros selecionados na camada Ouro do banco.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. ABA INTERNAÇÕES */}
            {activeTab === "internacoes" && (
              <div className="space-y-6 animate-fadeIn">
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Volume de Internações</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{formatarNumero(kpis.totalInternacoes)}</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Total acumulado na base</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Tempo Médio Permanência</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{kpis.mediaDias} dias</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Duração média da internação</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Taxa Média de Óbito</p>
                    <h3 className="text-2xl font-bold text-red-400 mt-1">{kpis.taxaObito}%</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Mortalidade intra-hospitalar</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Custo Médio Internação</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {formatarMoeda(kpis.totalInternacoes > 0 ? kpis.custoTotal / kpis.totalInternacoes : 0)}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1">Gasto médio por internação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gráfico 1: Linha/Barra de Volume Mensal */}
                  <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Linha Histórica de Internações por Mês</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Distribuição sazonal baseada nos dados do SQL Server</p>
                    </div>

                    {/* Gráfico SVG de Barras Verticais Dinâmicas */}
                    <div className="h-48 w-full mt-4 flex items-end justify-between gap-1.5 px-2">
                      {(() => {
                        const maxVal = Math.max(...dadosMensais.map(d => d.volume), 1);
                        return dadosMensais.map((d, idx) => {
                          const barHeight = (d.volume / maxVal) * 120; // limite de 120px de altura
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                              <div className="w-full bg-[#1A253D] group-hover:bg-blue-500/10 rounded-t transition-all flex items-end justify-center h-[130px]">
                                <div 
                                  className="w-full bg-blue-500 rounded-t opacity-80 group-hover:opacity-100 transition-all cursor-pointer relative" 
                                  style={{ height: `${Math.max(barHeight, 3)}px` }}
                                >
                                  {/* Tooltip Hover */}
                                  <div className="absolute hidden group-hover:block bg-gray-900 border border-gray-700 text-[9px] p-2 rounded -top-12 left-1/2 transform -translate-x-1/2 text-white z-50 shadow-xl w-24 text-center font-sans">
                                    <span className="block font-bold">{d.nome}</span>
                                    <span>{formatarNumero(d.volume)} Casos</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-500 font-mono">{d.nome}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Gráfico 2: Top de Hospitais */}
                  <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Estabelecimentos líderes</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Participação no volume total de internações da base</p>
                    </div>
                    
                    <div className="flex flex-col gap-4 my-4">
                      {(() => {
                        const total = kpis.totalInternacoes || 1;
                        const topHospitais = dadosHospitais.slice(0, 4);
                        return topHospitais.map((h, idx) => {
                          const percent = ((h.volume / total) * 100).toFixed(1);
                          const colors = ["bg-blue-500", "bg-teal-500", "bg-purple-500", "bg-orange-500"];
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-400 font-semibold truncate max-w-[170px]">{h.name}</span>
                                <span className="font-mono text-gray-300 font-bold">{percent}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#121A2B] rounded-full overflow-hidden">
                                <div className={`h-full ${colors[idx % 4]} rounded-full`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABA MORBIDADES / CIDS */}
            {activeTab === "cids" && (
              <div className="space-y-6 animate-fadeIn">
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">CIDs Identificados</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{formatarNumero(dadosCids.length)}</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Tipos principais no período</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Patologia Principal</p>
                    <h3 className="text-lg font-bold text-teal-400 mt-1.5 truncate">
                      {dadosCids[0] ? `${dadosCids[0].code} (${dadosCids[0].name})` : "N/D"}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1">Maior número de registros no banco</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Maior Taxa de Letalidade</p>
                    <h3 className="text-2xl font-bold text-red-400 mt-1">
                      {cidsLetais[0] ? `${cidsLetais[0].rate.toFixed(2)}%` : "0.00%"}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Líder: {cidsLetais[0] ? `${cidsLetais[0].code} - ${cidsLetais[0].name}` : "N/D"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Óbitos no Período</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {formatarNumero(hospitaisData.reduce((acc, curr) => acc + (curr.quantidade_obitos || 0), 0))}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1">Total consolidado</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top 5 CIDs por Volume */}
                  <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Top 5 Patologias (CID) por Volume de Internação</h4>
                    
                    <div className="space-y-4">
                      {(() => {
                        const maxVal = dadosCids.length > 0 ? Math.max(...dadosCids.map(c => c.volume)) : 1;
                        return dadosCids.map((c, idx) => {
                          const widthPercent = ((c.volume / maxVal) * 100).toFixed(1);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-300 font-bold">{c.code} - <span className="text-gray-400 font-normal">{c.name}</span></span>
                                <span className="font-mono text-teal-400 font-bold">{formatarNumero(c.volume)} casos</span>
                              </div>
                              <div className="h-3 w-full bg-[#121A2B] rounded overflow-hidden">
                                <div className="h-full bg-teal-500 rounded" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Top 5 CIDs por Letalidade */}
                  <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Top 5 Patologias com Maior Taxa de Letalidade (%)</h4>
                    
                    <div className="space-y-4">
                      {(() => {
                        const maxVal = cidsLetais.length > 0 ? Math.max(...cidsLetais.map(c => c.rate)) : 1;
                        return cidsLetais.map((c, idx) => {
                          const widthPercent = ((c.rate / maxVal) * 100).toFixed(1);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-300 font-bold">{c.code} - <span className="text-gray-400 font-normal">{c.name}</span></span>
                                <span className="font-mono text-red-400 font-bold">{c.rate.toFixed(2)}% óbitos</span>
                              </div>
                              <div className="h-3 w-full bg-[#121A2B] rounded overflow-hidden">
                                <div className="h-full bg-red-500 rounded" style={{ width: `${widthPercent}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ABA CUSTOS */}
            {activeTab === "custos" && (
              <div className="space-y-6 animate-fadeIn">
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Faturamento Total SUS</p>
                    <h3 className="text-2xl font-bold text-[#10B981] mt-1">{formatarMoeda(kpis.custoTotal)}</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Despesas consolidadas no período</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Faturamento UTI</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{formatarMoeda(kpis.custoUti)}</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Diárias acumuladas em UTI</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">% Gasto com UTI</p>
                    <h3 className="text-2xl font-bold text-purple-400 mt-1">{kpis.percentUti}%</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Representatividade do custo crítico</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Custo Médio/Leito Dia</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      {formatarMoeda(parseFloat(kpis.mediaDias) > 0 && kpis.totalInternacoes > 0 ? kpis.custoTotal / (parseFloat(kpis.mediaDias) * kpis.totalInternacoes) : 0)}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1">Custo médio ponderado diário</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Custos Totais vs UTI por Hospital */}
                  <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Comparativo de Faturamento: Total vs UTI por Hospital</h4>
                    
                    <div className="space-y-4">
                      {(() => {
                        const topHospitais = dadosHospitais.slice(0, 4);
                        const maxVal = topHospitais.length > 0 ? Math.max(...topHospitais.map(h => h.custo)) : 1;

                        return topHospitais.map((h, idx) => {
                          const totalWidth = ((h.custo / maxVal) * 100).toFixed(1);
                          const utiWidth = ((h.uti / h.custo) * 100).toFixed(1);

                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-300 font-bold truncate max-w-[200px]">{h.name}</span>
                                <span className="font-mono text-gray-400">Total: <strong className="text-[#10B981]">{formatarMoeda(h.custo)}</strong> | UTI: <strong className="text-purple-400">{formatarMoeda(h.uti)}</strong></span>
                              </div>
                              <div className="h-4 w-full bg-[#121A2B] rounded relative overflow-hidden">
                                {/* Barra Total */}
                                <div className="h-full bg-emerald-600/80 rounded" style={{ width: `${totalWidth}%` }} />
                                {/* Barra UTI sobreposta */}
                                <div className="absolute top-0 left-0 h-full bg-purple-600/50" style={{ width: `${parseFloat(totalWidth) * parseFloat(utiWidth) / 100}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Concentração Financeira SUS */}
                  <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Faturamento Real por Hospital</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Distribuição orçamentária computada da base de dados</p>
                    </div>

                    <div className="flex flex-col gap-3 my-4">
                      {(() => {
                        const topHospitais = dadosHospitais.slice(0, 4);
                        const total = kpis.custoTotal || 1;

                        return topHospitais.map((h, idx) => {
                          const percent = ((h.custo / total) * 100).toFixed(1);
                          return (
                            <div key={idx} className="flex justify-between items-center text-[10px] p-2 rounded bg-[#121A2B]/40 border border-gray-850">
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 bg-emerald-500/10 text-emerald-400 font-bold rounded flex items-center justify-center text-[9px]">{idx + 1}</span>
                                <span className="text-gray-400 font-medium truncate max-w-[120px]">{h.name.split(" ")[0]}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-gray-200 font-bold block">{formatarMoeda(h.custo)}</span>
                                <span className="text-[8px] text-gray-500 block">{percent}% do total</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
