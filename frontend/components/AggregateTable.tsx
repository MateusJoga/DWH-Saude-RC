"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Filter, RefreshCw } from "lucide-react";
import { FatoProcedimentoFilters, GenericTableRow } from "@/services/api";

interface AggregateColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: "number" | "currency" | "days" | "percent";
}

interface AggregateFilterField {
  key: keyof FatoProcedimentoFilters;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "month";
}

interface AggregateTableProps {
  title: string;
  data: GenericTableRow[];
  total: number;
  loading: boolean;
  filters: FatoProcedimentoFilters;
  columns: AggregateColumn[];
  filterFields?: AggregateFilterField[];
  onFilterChange: (filters: FatoProcedimentoFilters) => void;
}

export default function AggregateTable({ title, data, total, loading, filters, columns, filterFields = [], onFilterChange }: AggregateTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(
    Object.fromEntries(filterFields.map((field) => [field.key, filters[field.key]?.toString() || ""]))
  );
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoNext = total > 0 ? currentPage < totalPages : data.length === limit;

  const formatarNumero = (valor: unknown) => {
    if (valor === null || valor === undefined) return "0";
    return new Intl.NumberFormat("pt-BR").format(Number(valor));
  };

  const formatarMoeda = (valor: unknown) => {
    if (valor === null || valor === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
  };

  const formatarValor = (row: GenericTableRow, column: AggregateColumn) => {
    const value = row[column.key];
    if (column.format === "currency") return formatarMoeda(value);
    if (column.format === "number") return formatarNumero(value);
    if (column.format === "days") return `${formatarNumero(value)}d`;
    if (column.format === "percent") return `${formatarNumero(value)}%`;
    return value === null || value === undefined || value === "" ? "N/D" : String(value);
  };

  const alterarOrdenacao = (columnKey: string) => {
    const nextDirection = filters.order_by === columnKey && filters.order_dir === "asc" ? "desc" : "asc";
    onFilterChange({ ...filters, order_by: columnKey, order_dir: nextDirection, offset: 0 });
  };

  const mudarPagina = (direcao: "anterior" | "proxima") => {
    const novoOffset = direcao === "anterior" ? Math.max(0, offset - limit) : offset + limit;
    onFilterChange({ ...filters, offset: novoOffset });
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    const nextFilters: FatoProcedimentoFilters = {
      limit,
      offset: 0,
      order_by: filters.order_by,
      order_dir: filters.order_dir,
    };

    filterFields.forEach((field) => {
      const value = localFilters[field.key];
      if (!value) return;
      (nextFilters as Record<string, string | number>)[field.key] = field.type === "number" || field.type === "month" ? Number(value) : value;
    });

    onFilterChange(nextFilters);
  };

  const limparFiltros = () => {
    setLocalFilters(Object.fromEntries(filterFields.map((field) => [field.key, ""])));
    onFilterChange({ limit, offset: 0, order_by: filters.order_by, order_dir: filters.order_dir });
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#151D30] shadow-xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 bg-[#121A2B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
          </div>
          <button type="button" onClick={() => setIsCollapsed((value) => !value)} className="h-8 w-8 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center" title={isCollapsed ? "Expandir tabela" : "Minimizar tabela"} aria-label={isCollapsed ? "Expandir tabela" : "Minimizar tabela"}>
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && filterFields.length > 0 && (
          <form onSubmit={aplicarFiltros} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 items-end">
            {filterFields.map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{field.label}</label>
                {field.type === "month" ? (
                  <select value={localFilters[field.key] || ""} onChange={(e) => setLocalFilters({ ...localFilters, [field.key]: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-2 text-xs text-white focus:border-teal-500 focus:outline-none">
                    <option value="">Todos</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input type={field.type === "number" ? "number" : "text"} placeholder={field.placeholder} value={localFilters[field.key] || ""} onChange={(e) => setLocalFilters({ ...localFilters, [field.key]: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                )}
              </div>
            ))}
            <div className="flex gap-2 col-span-2 sm:col-span-1">
              <button type="submit" className="flex-1 h-9 rounded-lg bg-teal-500 text-xs font-bold text-[#0B0F19] hover:bg-teal-400 transition-colors flex items-center justify-center">Filtrar</button>
              <button type="button" onClick={limparFiltros} className="h-9 w-9 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center" title="Limpar filtros">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#121A2B] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}>
                      <button type="button" onClick={() => alterarOrdenacao(column.key)} className="font-bold hover:text-teal-400 transition-colors">
                        {column.label}{filters.order_by === column.key ? (filters.order_dir === "desc" ? " ↓" : " ↑") : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
                        <span>Carregando dados...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={`${title}-${idx}`} className="hover:bg-teal-500/[0.02] transition-colors">
                      {columns.map((column) => (
                        <td key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}>
                          {formatarValor(row, column)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-gray-800 bg-[#121A2B] flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span> | 20 registros por página | Total: <span className="text-white font-bold">{formatarNumero(total)}</span>
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => mudarPagina("anterior")} disabled={offset === 0 || loading} className="h-8 px-3 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />Anterior
              </button>
              <button type="button" onClick={() => mudarPagina("proxima")} disabled={!canGoNext || loading} className="h-8 px-3 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1">
                Próxima<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
