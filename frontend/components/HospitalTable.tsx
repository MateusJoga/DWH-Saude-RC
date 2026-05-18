"use client";

import React, { useState } from "react";
import { HospitalAggregation, HospitalFilters } from "@/services/api";
import { Filter, ChevronLeft, ChevronRight, RefreshCw, HelpCircle } from "lucide-react";

interface HospitalTableProps {
  data: HospitalAggregation[];
  loading: boolean;
  onFilterChange: (filters: HospitalFilters) => void;
  filters: HospitalFilters;
}

export default function HospitalTable({ data, loading, onFilterChange, filters }: HospitalTableProps) {
  const [localFilters, setLocalFilters] = useState({
    ano: filters.ano?.toString() || "",
    mes: filters.mes?.toString() || "",
    uf_hospital: filters.uf_hospital || "",
    cnes: filters.cnes || "",
  });

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;

  // Envia os filtros locais para o componente pai atualizar os dados
  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ano: localFilters.ano ? Number(localFilters.ano) : undefined,
      mes: localFilters.mes ? Number(localFilters.mes) : undefined,
      uf_hospital: localFilters.uf_hospital || undefined,
      cnes: localFilters.cnes || undefined,
      offset: 0, // Reseta paginação ao filtrar
    });
  };

  const limparFiltros = () => {
    setLocalFilters({ ano: "", mes: "", uf_hospital: "", cnes: "" });
    onFilterChange({
      ano: undefined,
      mes: undefined,
      uf_hospital: undefined,
      cnes: undefined,
      offset: 0,
    });
  };

  // Paginação
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
      {/* Cabeçalho da Tabela e Barra de Filtros */}
      <div className="p-5 border-b border-gray-800 bg-[#121A2B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Internações por Hospital</h2>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Camada: <span className="text-yellow-400 font-bold">Ouro</span></span>
        </div>

        {/* Formulário de Filtros */}
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

          {/* UF */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">UF Estado</label>
            <input
              type="text"
              placeholder="Ex: SP"
              maxLength={2}
              value={localFilters.uf_hospital}
              onChange={(e) => setLocalFilters({ ...localFilters, uf_hospital: e.target.value.toUpperCase() })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* CNES */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Código CNES</label>
            <input
              type="text"
              placeholder="Ex: 12345"
              value={localFilters.cnes}
              onChange={(e) => setLocalFilters({ ...localFilters, cnes: e.target.value })}
              className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Botões */}
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
      </div>

      {/* Grid de Dados da Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#121A2B] text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
            <tr>
              <th className="px-4 py-3">Competência</th>
              <th className="px-4 py-3">CNES / Hospital</th>
              <th className="px-4 py-3">Município / UF</th>
              <th className="px-4 py-3 text-right">Internações</th>
              <th className="px-4 py-3 text-right">Valor Total</th>
              <th className="px-4 py-3 text-right">Valor UTI</th>
              <th className="px-4 py-3 text-right">Permanência</th>
              <th className="px-4 py-3 text-right">Óbitos (%)</th>
              <th className="px-4 py-3 text-right">L. Perm.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
                    <span>Carregando dados da camada Ouro...</span>
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
                <tr key={`${row.ano}-${row.mes}-${row.id_hospital}-${idx}`} className="hover:bg-teal-500/[0.02] transition-colors">
                  <td className="px-4 py-3 font-sans font-semibold text-white">
                    {row.nome_mes.substring(0, 3)} / {row.ano}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="font-semibold text-teal-300">{row.cnes || "N/D"}</div>
                    <div className="text-[10px] text-gray-500">ID: {row.id_hospital}</div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div>{row.municipio_hospital || "Desconhecido"}</div>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-400">{row.uf_hospital || "N/A"}</span>
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

      {/* Controles de Paginação */}
      <div className="px-5 py-4 border-t border-gray-800 bg-[#121A2B] flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Página <span className="text-white font-bold">{currentPage}</span> {data.length > 0 && `(Mostrando ${data.length} registros)`}
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
            disabled={data.length < limit || loading}
            className="h-8 px-3 rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
