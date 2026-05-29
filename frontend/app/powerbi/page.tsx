"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  FileBarChart, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertCircle, 
  X, 
  Save, 
  Database, 
  Sparkles,
  PieChart,
  BarChart3,
  RefreshCw,
  LayoutGrid
} from "lucide-react";

interface DashboardConfig {
  id: string;
  name: string;
  defaultUrl: string;
  url: string;
  description: string;
}

export default function PowerBiPage() {
  const [configs, setConfigs] = useState<DashboardConfig[]>([
    {
      id: "internacoes",
      name: "Painel Geral de Internações",
      defaultUrl: "",
      url: "",
      description: "Análise demográfica, fluxo de internações e permanência por hospital regional."
    },
    {
      id: "cids",
      name: "Morbidades & CIDs",
      defaultUrl: "",
      url: "",
      description: "Distribuição epidemiológica de patologias, taxas de mortalidade e CIDs mais frequentes."
    },
    {
      id: "custos",
      name: "Custos & Financiamento SUS",
      defaultUrl: "",
      url: "",
      description: "Auditoria financeira de despesas hospitalares, diárias de UTI e faturamento por procedimento."
    }
  ]);

  const [activeTab, setActiveTab] = useState<string>("internacoes");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempUrls, setTempUrls] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  // Carrega configurações salvas no localStorage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("dwh_powerbi_urls");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string>;
        setConfigs(prev => prev.map(item => ({
          ...item,
          url: parsed[item.id] || item.defaultUrl
        })));
      } catch (e) {
        console.error("Erro ao carregar URLs do Power BI do localStorage", e);
      }
    }
  }, []);

  // Preenche valores temporários para edição
  useEffect(() => {
    const urls: Record<string, string> = {};
    configs.forEach(c => {
      urls[c.id] = c.url;
    });
    setTempUrls(urls);
  }, [configs]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = configs.map(item => ({
      ...item,
      url: tempUrls[item.id] || ""
    }));
    setConfigs(updated);
    
    const urlMap: Record<string, string> = {};
    updated.forEach(c => {
      urlMap[c.id] = c.url;
    });
    localStorage.setItem("dwh_powerbi_urls", JSON.stringify(urlMap));
    setShowSettings(false);
  };

  const handleResetToDefault = (id: string) => {
    setTempUrls(prev => ({
      ...prev,
      [id]: ""
    }));
  };

  const activeConfig = configs.find(c => c.id === activeTab) || configs[0];

  // Gráficos interativos mockados (para quando não houver URL configurada)
  const renderMockDashboard = () => {
    if (activeTab === "internacoes") {
      return (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards do Relatório */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-blue-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Internações</p>
              <h3 className="text-2xl font-bold text-white mt-1">14.382</h3>
              <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1 font-sans">
                <TrendingUp className="h-3 w-3" />
                <span>+4.2% em relação ao mês anterior</span>
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-teal-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-teal-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Média Leitos/Dia</p>
              <h3 className="text-2xl font-bold text-white mt-1">426</h3>
              <p className="text-[9px] text-gray-400 mt-1">Ocupação média da rede municipal</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-purple-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Permanência Média</p>
              <h3 className="text-2xl font-bold text-white mt-1">5,8 dias</h3>
              <p className="text-[9px] text-gray-400 mt-1">Tempo médio de internação hospitalar</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-orange-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-orange-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Casos de Urgência</p>
              <h3 className="text-2xl font-bold text-white mt-1">78,4%</h3>
              <p className="text-[9px] text-orange-400 mt-1">Prevalência de caráter emergencial</p>
            </div>
          </div>

          {/* Gráficos em Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1 */}
            <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Volume de Internações por Mês</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Competência de Janeiro a Dezembro</p>
              </div>
              <div className="h-48 w-full mt-4 flex items-end justify-between gap-1.5 px-2">
                {[45, 60, 55, 78, 90, 85, 70, 65, 80, 95, 110, 105].map((val, idx) => {
                  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-[#1A253D] group-hover:bg-blue-500/20 rounded-t transition-all flex items-end justify-center" style={{ height: `${val * 1.3}px` }}>
                        <div className="w-full bg-blue-500 rounded-t opacity-80 group-hover:opacity-100 transition-all" style={{ height: `${val}px` }} />
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">{months[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico 2 */}
            <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Especialidades Médicas</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Participação no volume total de leitos</p>
              </div>
              <div className="flex flex-col gap-3.5 my-4">
                {[
                  { name: "Clínica Geral", value: "38.2%", color: "bg-blue-500", w: "w-[38.2%]" },
                  { name: "Obstetrícia", value: "24.6%", color: "bg-teal-500", w: "w-[24.6%]" },
                  { name: "Pediatria", value: "18.1%", color: "bg-purple-500", w: "w-[18.1%]" },
                  { name: "Cirurgia Geral", value: "12.8%", color: "bg-orange-500", w: "w-[12.8%]" },
                  { name: "Outros", value: "6.3%", color: "bg-gray-600", w: "w-[6.3%]" },
                ].map((spec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400 font-medium">{spec.name}</span>
                      <span className="font-mono text-gray-300 font-bold">{spec.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#121A2B] rounded-full overflow-hidden">
                      <div className={`h-full ${spec.color} rounded-full`} style={{ width: spec.value }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "cids") {
      return (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-red-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">CID Letal Líder</p>
              <h3 className="text-lg font-bold text-white mt-1.5 truncate">I10 (Hipertensão)</h3>
              <p className="text-[9px] text-gray-400 mt-1">Doenças circulatórias dominam óbitos</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-blue-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total de Óbitos registrados</p>
              <h3 className="text-2xl font-bold text-white mt-1">394</h3>
              <p className="text-[9px] text-emerald-400 mt-1 font-sans">-2.1% em relação ao trimestre anterior</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-purple-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Mortalidade Geral</p>
              <h3 className="text-2xl font-bold text-white mt-1">2,74%</h3>
              <p className="text-[9px] text-gray-400 mt-1">Relação entre óbitos e internações</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-teal-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-teal-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Carga CID Infecciosa</p>
              <h3 className="text-2xl font-bold text-white mt-1">11,2%</h3>
              <p className="text-[9px] text-gray-400 mt-1">Capítulos I e II da OMS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabela de Grupos CID */}
            <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Morbidades com maior taxa de mortalidade no município</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse font-sans">
                  <thead className="bg-[#121A2B] text-gray-400 uppercase text-[9px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-gray-400 font-semibold">Código CID</th>
                      <th className="px-3 py-2 text-gray-400 font-semibold">Grupo de Patologias</th>
                      <th className="px-3 py-2 text-gray-400 font-semibold">Internações</th>
                      <th className="px-3 py-2 text-gray-400 font-semibold">Óbitos</th>
                      <th className="px-3 py-2 text-gray-400 font-semibold text-right">Taxa Óbito (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/60 text-gray-300 font-mono">
                    {[
                      { code: "I50", desc: "Insuficiência Cardíaca", count: 843, deaths: 64, rate: "7,59%" },
                      { code: "J18", desc: "Pneumonia de Organismo Não Especificado", count: 1205, deaths: 81, rate: "6,72%" },
                      { code: "C34", desc: "Neoplasia Maligna de Brônquios e Pulmões", count: 184, deaths: 11, rate: "5,98%" },
                      { code: "I64", desc: "Acidente Vascular Cerebral (AVC)", count: 541, deaths: 32, rate: "5,91%" },
                      { code: "N17", desc: "Insuficiência Renal Aguda", count: 329, deaths: 18, rate: "5,47%" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-teal-500/[0.01] transition-colors">
                        <td className="px-3 py-2 font-bold text-teal-400">{row.code}</td>
                        <td className="px-3 py-2 font-sans text-gray-400">{row.desc}</td>
                        <td className="px-3 py-2">{row.count}</td>
                        <td className="px-3 py-2">{row.deaths}</td>
                        <td className="px-3 py-2 text-right font-bold text-red-400">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribuição por Gênero */}
            <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Distribuição Demográfica</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Perfil de internação por sexo biológico</p>
              </div>
              
              <div className="my-6 flex items-center justify-center gap-8">
                {/* SVG Pizza Simples */}
                <div className="relative h-28 w-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#1E293B" strokeWidth="32" />
                    {/* Feminino (54%) */}
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#14B8A6" strokeWidth="32" strokeDasharray="54 100" />
                    {/* Masculino (46%) */}
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#3B82F6" strokeWidth="32" strokeDasharray="46 100" strokeDashoffset="-54" />
                  </svg>
                  <div className="absolute h-14 w-14 rounded-full bg-[#0F172A] flex items-center justify-center flex-col">
                    <span className="text-[9px] text-gray-500">Total</span>
                    <span className="text-[11px] font-bold text-white">100%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-teal-500" />
                    <div className="flex flex-col text-[10px]">
                      <span className="text-gray-400 font-semibold">Feminino</span>
                      <span className="font-mono text-gray-300 font-bold">54,0%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <div className="flex flex-col text-[10px]">
                      <span className="text-gray-400 font-semibold">Masculino</span>
                      <span className="font-mono text-gray-300 font-bold">46,0%</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 leading-relaxed text-center font-sans border-t border-gray-800/80 pt-4">
                Fatores obstétricos e de saúde preventiva da mulher justificam a predominância feminina em internações eletivas.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "custos") {
      return (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-[#10B981]/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-[#10B981]/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Faturamento Total SUS</p>
              <h3 className="text-2xl font-bold text-[#10B981] mt-1">R$ 14,82 M</h3>
              <p className="text-[9px] text-gray-400 mt-1">Despesas consolidadas do município</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-blue-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Repasse Tabela SH</p>
              <h3 className="text-2xl font-bold text-white mt-1">R$ 11,46 M</h3>
              <p className="text-[9px] text-gray-400 mt-1">Serviços Hospitalares (diárias, taxas)</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-purple-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Honorários Tabela SP</p>
              <h3 className="text-2xl font-bold text-white mt-1">R$ 3,36 M</h3>
              <p className="text-[9px] text-gray-400 mt-1">Serviços Profissionais de médicos/equipe</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#121A2B]/40 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-orange-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-orange-500/10" />
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Gasto UTI Acumulado</p>
              <h3 className="text-2xl font-bold text-white mt-1">R$ 4,12 M</h3>
              <p className="text-[9px] text-orange-400 mt-1 font-bold">27,8% do faturamento da rede</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Custos Históricos */}
            <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-[#0F172A] p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Custo Mensal Consolidado (Milhares de R$)</h4>
              <div className="h-44 w-full mt-4 flex items-end justify-between gap-3 px-2">
                {[120, 140, 110, 160, 180, 210, 175, 190, 220, 240, 260, 230].map((val, idx) => {
                  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-[#1A253D] group-hover:bg-emerald-500/10 rounded-t transition-all flex items-end justify-center" style={{ height: `${val * 0.5}px` }}>
                        <div className="w-full bg-[#10B981] rounded-t opacity-85 group-hover:opacity-100 transition-all" style={{ height: `${val * 0.4}px` }} />
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">{months[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Concentração de Recursos */}
            <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Concentração Financeira</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Hospitais líderes em faturamento SUS</p>
              </div>

              <div className="flex flex-col gap-3 my-4">
                {[
                  { name: "Santa Casa de Rio Claro", val: "R$ 6,82 M", p: "46%" },
                  { name: "Hospital Auxiliar Regional", val: "R$ 4,14 M", p: "28%" },
                  { name: "Maternidade Municipal", val: "R$ 2,50 M", p: "17%" },
                  { name: "Pronto Atendimento Central", val: "R$ 1,36 M", p: "9%" },
                ].map((hosp, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] p-2 rounded bg-[#121A2B]/40 border border-gray-805">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 bg-emerald-500/10 text-emerald-400 font-bold rounded flex items-center justify-center text-[9px]">{idx + 1}</span>
                      <span className="text-gray-400 font-medium truncate max-w-[120px]">{hosp.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-gray-200 font-bold block">{hosp.val}</span>
                      <span className="text-[8px] text-gray-500 block">{hosp.p} do total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FileBarChart className="h-5.5 w-5.5 text-blue-400" />
            <span>Power BI Embedded</span>
          </h1>
          <p className="text-xs text-gray-400">Dashboards corporativos integrados ao Data Warehouse de Saúde Pública</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Engrenagem (Configurações) */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showSettings 
                ? "bg-blue-600 border-blue-500 text-white" 
                : "bg-gray-800/40 border-gray-700 hover:bg-gray-800 text-gray-300"
            }`}
          >
            <Settings className={`h-4 w-4 ${showSettings ? "animate-spin" : ""}`} />
            <span>Configurar URLs</span>
          </button>

          <a
            href="https://app.powerbi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800/40 border border-gray-700 hover:bg-gray-800 text-gray-300 transition-all"
          >
            <span>Acessar Portal BI</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Caixa de Alerta Geral sobre Power BI */}
      <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/15 flex gap-3 text-xs text-gray-400 items-start">
        <Info className="h-5 w-5 shrink-0 text-blue-400" />
        <div>
          <span className="font-bold text-blue-300 block mb-0.5">Integração com Power BI</span>
          <p className="leading-relaxed">
            Esta tela incorpora os relatórios construídos no Power BI Service utilizando os dados agregados da camada **ouro** do banco de dados SQL Server. 
            Clique em **Configurar URLs** para colar os códigos de incorporação de seu ambiente de desenvolvimento.
          </p>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="flex border-b border-gray-850 gap-2 overflow-x-auto pb-px">
        {configs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setShowSettings(false);
            }}
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

      {/* Área de Configurações das URLs */}
      {showSettings && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-xl border border-blue-900/30 bg-[#0F172A] space-y-4 animate-slideDown shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-blue-400" />
              <span>Configuração das URLs de Incorporação</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {configs.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  URL para: <span className="text-white">{c.name}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://app.powerbi.com/reportEmbed?reportId=... ou https://app.powerbi.com/view?r=..."
                    value={tempUrls[c.id] || ""}
                    onChange={(e) => setTempUrls(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="flex-1 h-9 rounded-lg border border-gray-700 bg-black/30 px-3 text-xs text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleResetToDefault(c.id)}
                    className="px-2 h-9 rounded-lg border border-gray-700 hover:bg-gray-800 text-[10px] text-gray-400 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title="Limpar Campo"
                  >
                    Limpar
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">{c.description}</p>
              </div>
            ))}
          </div>

          {/* Tutorial rápido no rodapé do formulário */}
          <div className="p-3 bg-gray-950/40 rounded-lg border border-gray-850/80 text-[10px] space-y-1 text-gray-400">
            <span className="font-bold text-gray-300 block">💡 Como extrair o link no Power BI:</span>
            <p>
              Abra seu dashboard no workspace do Power BI Cloud. Clique em <strong>Arquivo</strong> &rarr; <strong>Inserir relatório</strong> &rarr; escolha <strong>Publicar na Web (Público)</strong> ou <strong>Portal ou site</strong>. 
              Copie o link seguro fornecido no primeiro campo de texto (URL segura) e cole-o no campo correspondente acima.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar URLs</span>
            </button>
          </div>
        </form>
      )}

      {/* Área Principal de Renderização (Iframe ou Mock) */}
      <div className="relative rounded-xl border border-gray-850 bg-[#121A2B]/10 overflow-hidden shadow-2xl min-h-[500px]">
        {activeConfig.url ? (
          /* Renderização Real via Iframe */
          <div className="w-full h-[650px] relative animate-fadeIn bg-black">
            {/* Overlay para orientar que o iframe está sendo renderizado */}
            <iframe
              title={activeConfig.name}
              src={activeConfig.url}
              className="w-full h-full border-0 rounded-xl"
              allowFullScreen={true}
              loading="lazy"
              allow="geolocation; microphone; camera"
            />
          </div>
        ) : (
          /* Renderização do Mock Premium */
          <div className="p-6 space-y-6">
            {/* Header explicativo do Mock */}
            <div className="p-4 rounded-xl border border-yellow-900/30 bg-yellow-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-3 text-xs text-gray-400 items-start">
                <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500 animate-pulse" />
                <div>
                  <span className="font-bold text-yellow-500 block mb-0.5">Modo Demonstração Ativo (Sem URL vinculada)</span>
                  <p className="leading-relaxed">
                    Você está visualizando um protótipo interativo do dashboard. Para ver o painel real da saúde do município, clique em 
                    <strong> Configurar URLs </strong> acima e insira o link seguro gerado pelo seu Power BI Service.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-3.5 py-1.5 h-8 bg-yellow-500 text-[#0B0F19] hover:bg-yellow-400 font-bold rounded-lg text-[10px] tracking-wider uppercase transition-all shrink-0 flex items-center gap-1 shadow-lg shadow-yellow-500/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Configurar Relatório</span>
              </button>
            </div>

            {/* Painel Interno Customizado */}
            <div className="border border-gray-850 bg-[#0B0F19] rounded-xl p-5 shadow-inner">
              {/* Barra superior de status do Painel */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-5 text-[10px]">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-white uppercase tracking-wider">{activeConfig.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-gray-500">
                  <span>Banco: <strong className="text-teal-400 font-bold">DataWareHouse_RC</strong></span>
                  <span>Schema: <strong className="text-gray-400">ouro</strong></span>
                  <span>Atualizado: <strong className="text-gray-400">Hoje</strong></span>
                </div>
              </div>

              {/* Renderiza o Mock de Gráficos correspondente à Aba */}
              {renderMockDashboard()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
