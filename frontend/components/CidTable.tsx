"use client";

import React, { useState } from "react";
import { CidAggregation, CidFilters } from "@/services/api";
import { Filter, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RefreshCw } from "lucide-react";

interface CidTableProps {
  data: CidAggregation[];
  total: number;
  loading: boolean;
  onFilterChange: (filters: CidFilters) => void;
  filters: CidFilters;
}

export default function CidTable({ data, total, loading, onFilterChange, filters }: CidTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    ano: filters.ano?.toString() || "",
    mes: filters.mes?.toString() || "",
    codigo_cid: filters.codigo_cid || "",
    grupo_cid: filters.grupo_cid || "",
  });

  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoNext = total > 0 ? currentPage < totalPages : data.length === limit;

  const alterarOrdenacao = (columnKey: string) => {
    const nextDirection = filters.order_by === columnKey && filters.order_dir === "asc" ? "desc" : "asc";
    onFilterChange({ ...filters, order_by: columnKey, order_dir: nextDirection, offset: 0 });
  };

  const renderHeader = (label: string, columnKey: string, align = "") => (
    <th className={`px-4 py-3 ${align}`}>
      <button type="button" onClick={() => alterarOrdenacao(columnKey)} className="font-bold hover:text-teal-400 transition-colors">
        {label}{filters.order_by === columnKey ? (filters.order_dir === "desc" ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ano: localFilters.ano ? Number(localFilters.ano) : undefined,
      mes: localFilters.mes ? Number(localFilters.mes) : undefined,
      codigo_cid: localFilters.codigo_cid || undefined,
      grupo_cid: localFilters.grupo_cid || undefined,
      limit,
      order_by: filters.order_by,
      order_dir: filters.order_dir,
      offset: 0,
    });
  };

  const limparFiltros = () => {
    setLocalFilters({ ano: "", mes: "", codigo_cid: "", grupo_cid: "" });
    onFilterChange({
      ano: undefined,
      mes: undefined,
      codigo_cid: undefined,
      grupo_cid: undefined,
      limit,
      order_by: filters.order_by,
      order_dir: filters.order_dir,
      offset: 0,
    });
  };

  const mudarPagina = (direcao: "anterior" | "proxima") => {
    const novoOffset = direcao === "anterior" 
      ? Math.max(0, offset - limit) 
      : offset + limit;
    
    onFilterChange({
      ...filters,
      offset: novoOffset,
    });
  };

  const formatarMoeda = (valor: number | null) => {
    if (valor === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  const formatarNumero = (valor: number | null) => {
    if (valor === null) return "0";
    return new Intl.NumberFormat("pt-BR").format(valor);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#151D30] shadow-xl overflow-hidden">
      {/* Barra superior de título e filtros */}
      <div className="p-5 border-b border-gray-800 bg-[#121A2B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Internações por Patologia (CID)</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="h-8 w-8 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center"
            title={isCollapsed ? "Expandir tabela" : "Minimizar tabela"}
            aria-label={isCollapsed ? "Expandir tabela" : "Minimizar tabela"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Formulário de busca */}
        {!isCollapsed && (
        <form onSubmit={aplicarFiltros} className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 items-end">
          {/* Ano */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ano</label>
            <input
              type="number"
              placeholder="Ex: 2024"
              value={localFilters.ano}
              onChange={(e) => setLocalFilters({ ...localFilters, ano: e.target.value })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Mês */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mês</label>
            <select
              value={localFilters.mes}
              onChange={(e) => setLocalFilters({ ...localFilters, mes: e.target.value })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-2 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Código CID */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Código CID</label>
            <input
              type="text"
              placeholder="Ex: I10"
              value={localFilters.codigo_cid}
              onChange={(e) => setLocalFilters({ ...localFilters, codigo_cid: e.target.value })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Grupo CID */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Grupo de Doença</label>
            <input
              type="text"
              placeholder="Ex: Cardiologia"
              value={localFilters.grupo_cid}
              onChange={(e) => setLocalFilters({ ...localFilters, grupo_cid: e.target.value })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 col-span-2 sm:col-span-1">
            <button
              type="submit"
              className="flex-1 h-9 rounded-lg bg-teal-500 text-xs font-bold text-[#0B0F19] hover:bg-teal-400 transition-colors flex items-center justify-center gap-1.5"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={limparFiltros}
              className="h-9 w-9 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center"
              title="Limpar filtros"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Grid da Tabela */}
      {!isCollapsed && (
      <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#121A2B] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
            <tr>
              {renderHeader("Competência", "ano")}
              {renderHeader("Código CID", "codigo_cid")}
              {renderHeader("Grupo / Capítulo Diagnóstico", "grupo_cid")}
              {renderHeader("Internações", "quantidade_internacoes", "text-right")}
              {renderHeader("Custo Total", "valor_total_internacoes", "text-right")}
              {renderHeader("Custo UTI", "valor_total_uti", "text-right")}
              {renderHeader("Permanência", "media_dias_permanencia", "text-right")}
              {renderHeader("Óbitos (%)", "quantidade_obitos", "text-right")}
              {renderHeader("L. Perm.", "quantidade_longa_permanencia", "text-right")}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
                    <span>Carregando dados...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-sm">
                  <span>Nenhum registro encontrado com os filtros selecionados.</span>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={`${row.ano}-${row.mes}-${row.codigo_cid}-${idx}`} className="hover:bg-teal-500/[0.02] transition-colors">
                  <td className="px-4 py-3 font-sans font-semibold text-white">
                    {row.nome_mes.substring(0, 3)} / {row.ano}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-teal-950/40 text-teal-400 font-bold border border-teal-800/40">
                      {row.codigo_cid}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans max-w-xs">
                    <div className="font-semibold truncate text-white" title={row.grupo_cid || ""}>
                      {row.grupo_cid || "Patologia Geral"}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate" title={row.capitulo_cid || ""}>
                      {row.capitulo_cid || "Sem capítulo especificado"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-bold">{formatarNumero(row.quantidade_internacoes)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatarMoeda(row.valor_total_internacoes)}</td>
                  <td className="px-4 py-3 text-right text-emerald-500">{formatarMoeda(row.valor_total_uti)}</td>
                  <td className="px-4 py-3 text-right text-purple-400 font-bold">{row.media_dias_permanencia ? `${row.media_dias_permanencia}d` : "0d"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-red-400 font-semibold">{formatarNumero(row.quantidade_obitos)}</div>
                    <div className="text-[9px] text-gray-500">({row.taxa_obito_percentual || 0}%)</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-400">{formatarNumero(row.quantidade_longa_permanencia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="px-5 py-4 border-t border-gray-800 bg-[#121A2B] flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span> | 20 registros por página | Total: <span className="text-white font-bold">{formatarNumero(total)}</span>
        </span>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mudarPagina("anterior")}
            disabled={offset === 0 || loading}
            className="h-8 px-3 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          
          <button
            type="button"
            onClick={() => mudarPagina("proxima")}
            disabled={!canGoNext || loading}
            className="h-8 px-3 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
