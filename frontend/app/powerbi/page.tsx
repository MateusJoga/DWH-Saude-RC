"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Database,
  DollarSign,
  FileBarChart,
  Filter,
  HeartPulse,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  DashboardResumo,
  SerieInternacoes,
  TopCid,
  TopHospital,
  TopProcedimento,
  getDashboardResumo,
  getSeriesInternacoes,
  getTopCids,
  getTopHospitais,
  getTopProcedimentos,
} from "@/services/api";

type TabId = "geral" | "morbidades" | "custos";

const EMPTY_RESUMO: DashboardResumo = {
  total_internacoes: 0,
  total_obitos: 0,
  valor_total_internacoes: 0,
  valor_total_uti: 0,
  total_procedimentos: 0,
  valor_total_procedimentos: 0,
};

export default function PowerBiPage() {
  const [activeTab, setActiveTab] = useState<TabId>("geral");
  const [filtroAno, setFiltroAno] = useState<string>("Todos");
  const [filtroMes, setFiltroMes] = useState<string>("Todos");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [resumo, setResumo] = useState<DashboardResumo>(EMPTY_RESUMO);
  const [series, setSeries] = useState<SerieInternacoes[]>([]);
  const [topHospitais, setTopHospitais] = useState<TopHospital[]>([]);
  const [topCids, setTopCids] = useState<TopCid[]>([]);
  const [topProcedimentos, setTopProcedimentos] = useState<TopProcedimento[]>([]);

  const periodoParams = useMemo(() => ({
    ano: filtroAno !== "Todos" ? Number(filtroAno) : undefined,
    mes: filtroMes !== "Todos" ? Number(filtroMes) : undefined,
  }), [filtroAno, filtroMes]);

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      setApiError(null);
      try {
        const [resumoData, seriesData, hospitaisData, cidsData, procedimentosData] = await Promise.all([
          getDashboardResumo(periodoParams),
          getSeriesInternacoes({ ...periodoParams, limit: 120 }),
          getTopHospitais({ ...periodoParams, limit: 10 }),
          getTopCids({ ...periodoParams, limit: 10 }),
          getTopProcedimentos({ ...periodoParams, limit: 10 }),
        ]);

        setResumo({ ...EMPTY_RESUMO, ...resumoData });
        setSeries(seriesData);
        setTopHospitais(hospitaisData);
        setTopCids(cidsData);
        setTopProcedimentos(procedimentosData);
      } catch (err: any) {
        setApiError(err.message || "Não foi possível carregar os indicadores.");
        setResumo(EMPTY_RESUMO);
        setSeries([]);
        setTopHospitais([]);
        setTopCids([]);
        setTopProcedimentos([]);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [periodoParams]);

  const totalInternacoes = Number(resumo.total_internacoes || 0);
  const totalObitos = Number(resumo.total_obitos || 0);
  const custoTotal = Number(resumo.valor_total_internacoes || 0);
  const custoUti = Number(resumo.valor_total_uti || 0);
  const totalProcedimentos = Number(resumo.total_procedimentos || 0);
  const valorProcedimentos = Number(resumo.valor_total_procedimentos || 0);
  const taxaObito = totalInternacoes > 0 ? (totalObitos / totalInternacoes) * 100 : 0;
  const percentUti = custoTotal > 0 ? (custoUti / custoTotal) * 100 : 0;
  const hasData = totalInternacoes > 0 || totalProcedimentos > 0 || series.length > 0 || topHospitais.length > 0 || topCids.length > 0 || topProcedimentos.length > 0;

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  };

  const formatarNumero = (valor: number) => {
    return valor.toLocaleString("pt-BR");
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  const maxSerie = Math.max(...series.map((item) => Number(item.quantidade_internacoes || 0)), 1);
  const maxHospital = Math.max(...topHospitais.map((item) => Number(item.quantidade_internacoes || 0)), 1);
  const maxCid = Math.max(...topCids.map((item) => Number(item.quantidade_internacoes || 0)), 1);
  const maxProcedimento = Math.max(...topProcedimentos.map((item) => Number(item.valor_total_procedimentos || 0)), 1);

  const tabs: { id: TabId; name: string }[] = [
    { id: "geral", name: "Visão Geral" },
    { id: "morbidades", name: "Morbidades" },
    { id: "custos", name: "Custos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FileBarChart className="h-5.5 w-5.5 text-blue-400" />
            <span>Painéis Gerenciais</span>
          </h1>
          <p className="text-xs text-gray-400">Indicadores consolidados da base de saúde para acompanhamento executivo.</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-950/20 px-3 py-1.5 rounded-lg border border-teal-900/50">
          <Database className="h-4 w-4" />
          <span>{apiError ? "Dados indisponíveis" : "Base conectada"}</span>
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-xl border border-red-900/50 bg-red-950/20 flex gap-3 text-xs text-red-400 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold block">Não foi possível carregar os dados reais</span>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      <section className="p-4 rounded-xl border border-gray-800 bg-[#0F172A] space-y-3.5 shadow-md">
        <div className="flex items-center gap-2 border-b border-gray-850 pb-2">
          <Filter className="h-4 w-4 text-blue-400" />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filtros do Relatório</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500">Ano</label>
            <input
              type="number"
              placeholder="Todos"
              value={filtroAno === "Todos" ? "" : filtroAno}
              onChange={(e) => setFiltroAno(e.target.value || "Todos")}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#121A2B] px-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#121A2B] px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Todos">Todos os meses</option>
              {[
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
              ].map((nome, index) => (
                <option key={nome} value={index + 1}>{nome}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex border-b border-gray-850 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px shrink-0 ${
              activeTab === tab.id ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[300px] w-full items-center justify-center flex-col gap-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-xs text-gray-400">Carregando indicadores da base...</span>
        </div>
      ) : !hasData && !apiError ? (
        <div className="flex h-[300px] w-full items-center justify-center flex-col gap-2 text-center p-6 border border-dashed border-gray-800 rounded-xl">
          <AlertCircle className="h-10 w-10 text-gray-600" />
          <h3 className="text-sm font-bold text-white uppercase">Nenhum registro encontrado</h3>
          <p className="text-xs text-gray-400 max-w-sm">Não há dados para os filtros selecionados. Tente remover o ano ou mês para consultar toda a base.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "geral" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Internações" value={formatarNumero(totalInternacoes)} detail="Total no período" color="text-blue-400" />
                <MetricCard icon={<HeartPulse className="h-5 w-5" />} label="Óbitos" value={formatarNumero(totalObitos)} detail={`Taxa: ${formatarPercentual(taxaObito)}`} color="text-red-400" />
                <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Custo Internações" value={formatarMoeda(custoTotal)} detail={`UTI: ${formatarPercentual(percentUti)}`} color="text-emerald-400" />
                <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Procedimentos" value={formatarNumero(totalProcedimentos)} detail={formatarMoeda(valorProcedimentos)} color="text-teal-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                  <ChartHeader title="Evolução Mensal de Internações" subtitle="Volume e custo por competência" />
                  <div className="h-56 w-full mt-5 flex items-end justify-between gap-1.5 px-2">
                    {series.map((item) => {
                      const volume = Number(item.quantidade_internacoes || 0);
                      const barHeight = (volume / maxSerie) * 150;
                      return (
                        <div key={`${item.ano}-${item.mes}`} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full h-[160px] bg-[#121A2B] rounded-t flex items-end">
                            <div className="w-full bg-blue-500/80 rounded-t min-h-[3px]" style={{ height: `${Math.max(barHeight, 3)}px` }} />
                          </div>
                          <span className="text-[9px] text-gray-500">{item.nome_mes?.substring(0, 3) || item.mes}</span>
                          <span className="hidden group-hover:block absolute mt-[-34px] text-[9px] bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white">
                            {formatarNumero(volume)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                  <ChartHeader title="Hospitais por Internações" subtitle="Top estabelecimentos no período" />
                  <RankBars
                    rows={topHospitais.map((item) => ({
                      label: item.cnes || item.municipio_hospital || "Hospital",
                      value: Number(item.quantidade_internacoes || 0),
                      max: maxHospital,
                      valueLabel: formatarNumero(Number(item.quantidade_internacoes || 0)),
                      color: "bg-teal-500",
                    }))}
                  />
                </section>
              </div>
            </div>
          )}

          {activeTab === "morbidades" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                <ChartHeader title="CIDs por Volume de Internação" subtitle="Principais morbidades no período" />
                <RankBars
                  rows={topCids.map((item) => ({
                    label: `${item.codigo_cid} - ${item.grupo_cid || "Sem descrição"}`,
                    value: Number(item.quantidade_internacoes || 0),
                    max: maxCid,
                    valueLabel: `${formatarNumero(Number(item.quantidade_internacoes || 0))} internações`,
                    color: "bg-blue-500",
                  }))}
                />
              </section>

              <section className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                <ChartHeader title="CIDs com Mais Óbitos" subtitle="Ranking absoluto, não taxa ajustada" />
                <RankBars
                  rows={[...topCids].sort((a, b) => Number(b.quantidade_obitos || 0) - Number(a.quantidade_obitos || 0)).map((item) => ({
                    label: `${item.codigo_cid} - ${item.grupo_cid || "Sem descrição"}`,
                    value: Number(item.quantidade_obitos || 0),
                    max: Math.max(...topCids.map((cid) => Number(cid.quantidade_obitos || 0)), 1),
                    valueLabel: `${formatarNumero(Number(item.quantidade_obitos || 0))} óbitos`,
                    color: "bg-red-500",
                  }))}
                />
              </section>
            </div>
          )}

          {activeTab === "custos" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                <ChartHeader title="Procedimentos por Custo" subtitle="Maiores valores consolidados" />
                <RankBars
                  rows={topProcedimentos.map((item) => ({
                    label: item.codigo_procedimento || "Procedimento",
                    value: Number(item.valor_total_procedimentos || 0),
                    max: maxProcedimento,
                    valueLabel: formatarMoeda(Number(item.valor_total_procedimentos || 0)),
                    color: "bg-emerald-500",
                  }))}
                />
              </section>

              <section className="rounded-xl border border-gray-800 bg-[#0F172A] p-5">
                <ChartHeader title="Composição de Custos" subtitle="Internações, UTI e procedimentos" />
                <div className="space-y-5 mt-5">
                  <CompositionBar label="Internações" value={custoTotal} total={custoTotal + valorProcedimentos} color="bg-blue-500" formatter={formatarMoeda} />
                  <CompositionBar label="Procedimentos" value={valorProcedimentos} total={custoTotal + valorProcedimentos} color="bg-emerald-500" formatter={formatarMoeda} />
                  <CompositionBar label="UTI dentro das internações" value={custoUti} total={custoTotal || 1} color="bg-purple-500" formatter={formatarMoeda} />
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4">
      <div className={`mb-3 ${color}`}>{icon}</div>
      <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      <p className="text-[9px] text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

function ChartHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h4>
      <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function RankBars({ rows }: { rows: { label: string; value: number; max: number; valueLabel: string; color: string }[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-500 mt-5">Sem dados para exibir.</p>;
  }

  return (
    <div className="space-y-4 mt-5">
      {rows.map((row, idx) => (
        <div key={`${row.label}-${idx}`} className="space-y-1.5">
          <div className="flex justify-between gap-3 text-[10px]">
            <span className="text-gray-300 font-semibold truncate">{row.label}</span>
            <span className="font-mono text-gray-300 font-bold shrink-0">{row.valueLabel}</span>
          </div>
          <div className="h-2 w-full bg-[#121A2B] rounded-full overflow-hidden">
            <div className={`h-full ${row.color} rounded-full`} style={{ width: `${Math.max((row.value / row.max) * 100, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompositionBar({ label, value, total, color, formatter }: { label: string; value: number; total: number; color: string; formatter: (value: number) => string }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-300 font-semibold">{label}</span>
        <span className="font-mono text-gray-300 font-bold">{formatter(value)} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-3 w-full bg-[#121A2B] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.max(percent, value > 0 ? 2 : 0)}%` }} />
      </div>
    </div>
  );
}
