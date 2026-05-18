"use client";

import React from "react";
import { 
  FileText, 
  Building2, 
  ActivitySquare, 
  Clock,
  TrendingUp,
  Info
} from "lucide-react";
import { HospitalAggregation } from "@/services/api";

interface KPICardsProps {
  hospitalData: HospitalAggregation[];
  loading: boolean;
}

export default function KPICards({ hospitalData, loading }: KPICardsProps) {
  
  // =========================================================================
  // CÁLCULO DE MÉTRICAS CLIENT-SIDE (TEMPORÁRIO)
  // EVOLUÇÃO FUTURA:
  // Estes cálculos refletem apenas os dados carregados na página atual (paginados).
  // Em uma etapa futura, criaremos o endpoint GET /consultas/resumo-geral
  // no FastAPI, o qual executará SELECT SUM(), AVG() etc. globais no banco,
  // trazendo os dados acumulados totais do Data Warehouse independente de paginação.
  // =========================================================================

  const totalInternacoes = hospitalData.reduce((acc, curr) => acc + curr.quantidade_internacoes, 0);
  
  // Lista CNES distintos
  const cnesAtivos = new Set(hospitalData.map(h => h.cnes).filter(Boolean)).size;
  
  // Soma custos de UTI
  const totalUti = hospitalData.reduce((acc, curr) => acc + (Number(curr.valor_total_uti) || 0), 0);
  
  // Média de permanência ponderada pelo número de internações de cada registro
  const somaPermanencia = hospitalData.reduce((acc, curr) => acc + ((Number(curr.media_dias_permanencia) || 0) * curr.quantidade_internacoes), 0);
  const mediaPermanencia = totalInternacoes > 0 ? (somaPermanencia / totalInternacoes).toFixed(2) : "0.00";

  // Formatação monetária (Real R$)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(valor);
  };

  const formatarNumero = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const cardClasses = "rounded-xl border border-gray-800 bg-[#151D30] p-5 shadow-lg flex flex-col justify-between hover:border-teal-500/50 transition-all duration-300 group";

  return (
    <div className="flex flex-col gap-4">
      {/* Aviso Metodológico das Métricas */}
      <div className="flex items-start gap-2.5 rounded-lg border border-teal-800/30 bg-teal-950/10 p-3 text-xs text-teal-400">
        <Info className="h-4.5 w-4.5 shrink-0 text-teal-400" />
        <div>
          <span className="font-semibold">Nota Arquitetural:</span> As métricas abaixo são agregadas em tempo real com base nos dados exibidos na página atual (até 100 registros por query). No roadmap evolutivo do projeto, integraremos a API com a rota global <code className="bg-teal-900/40 px-1 py-0.5 rounded font-mono text-[10px] text-teal-300">GET /consultas/resumo-geral</code> para fornecer estatísticas gerais consolidadas diretamente da camada ouro.
        </div>
      </div>

      {/* Grid de Cards KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total de Internações */}
        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Internações</span>
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarNumero(totalInternacoes)}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Volume acumulado na página</span>
            </div>
          </div>
        </div>

        {/* Card 2: Hospitais Ativos */}
        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hospitais CNES</span>
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarNumero(cnesAtivos)}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-400">
              <span>Estabelecimentos mapeados</span>
            </div>
          </div>
        </div>

        {/* Card 3: Custos Totais de UTI */}
        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Valor Total UTI</span>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <ActivitySquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarMoeda(totalUti)}
            </div>
            <div className="mt-1.5 text-[10px] text-emerald-400 flex items-center gap-1">
              <span>Reembolso total de UTI</span>
            </div>
          </div>
        </div>

        {/* Card 4: Média de Permanência */}
        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Média Permanência</span>
            <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : `${mediaPermanencia} dias`}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-400">
              <span>Média ponderada por internação</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
