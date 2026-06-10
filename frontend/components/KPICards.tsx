"use client";

import React from "react";
import {
  FileText,
  ActivitySquare,
  HeartPulse,
  Wallet,
  TrendingUp,
  Info,
} from "lucide-react";

export interface DashboardResumo {
  total_internacoes: number;
  total_obitos: number;
  valor_total_internacoes: string | number;
  valor_total_uti: string | number;
  total_procedimentos: number;
  valor_total_procedimentos: string | number;
}

interface KPICardsProps {
  resumo: DashboardResumo | null;
  loading: boolean;
}

export default function KPICards({ resumo, loading }: KPICardsProps) {
  const totalInternacoes = Number(resumo?.total_internacoes || 0);
  const totalObitos = Number(resumo?.total_obitos || 0);
  const totalProcedimentos = Number(resumo?.total_procedimentos || 0);

  const valorTotalInternacoes = Number(resumo?.valor_total_internacoes || 0);
  const valorTotalProcedimentos = Number(resumo?.valor_total_procedimentos || 0);
  const valorTotalUti = Number(resumo?.valor_total_uti || 0);

  const taxaObito =
    totalInternacoes > 0
      ? ((totalObitos / totalInternacoes) * 100).toFixed(2)
      : "0.00";

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(valor);

  const formatarNumero = (num: number) =>
    new Intl.NumberFormat("pt-BR").format(num);

  const cardClasses =
    "rounded-xl border border-gray-800 bg-[#151D30] p-5 shadow-lg flex flex-col justify-between hover:border-teal-500/50 transition-all duration-300 group";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-teal-800/30 bg-teal-950/10 p-3 text-xs text-teal-400">
        <Info className="h-4.5 w-4.5 shrink-0 text-teal-400" />
        <div>
          <span className="font-semibold">Nota dos indicadores:</span>{" "}
          Os indicadores abaixo são consolidados a partir do Data Warehouse e
          representam os dados atualmente carregados na base.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Internações
            </span>
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarNumero(totalInternacoes)}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Total consolidado</span>
            </div>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Óbitos
            </span>
            <div className="rounded-lg bg-red-500/10 p-2.5 text-red-400">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarNumero(totalObitos)}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-400">
              <span>Taxa de óbito: {taxaObito}%</span>
            </div>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Procedimentos
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
              <ActivitySquare className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarNumero(totalProcedimentos)}
            </div>
            <div className="mt-1.5 text-[10px] text-emerald-400">
              <span>{formatarMoeda(valorTotalProcedimentos)}</span>
            </div>
          </div>
        </div>

        <div className={cardClasses}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Valor Internações
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {loading ? "..." : formatarMoeda(valorTotalInternacoes)}
            </div>
            <div className="mt-1.5 text-[10px] text-gray-400">
              <span>UTI: {formatarMoeda(valorTotalUti)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}