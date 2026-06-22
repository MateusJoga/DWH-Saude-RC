"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  FatoInternacao,
  FatoProcedimento,
  FatoProcedimentoFilters,
} from "@/services/api";

type DetailKind = "internacoes" | "procedimentos";
type DetailRow = FatoInternacao | FatoProcedimento;

interface FactDetailTableProps {
  kind: DetailKind;
  title: string;
  data: DetailRow[];
  total: number;
  loading: boolean;
  filters: FatoProcedimentoFilters;
  onFilterChange: (filters: FatoProcedimentoFilters) => void;
}

interface DetailColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: DetailRow) => React.ReactNode;
}

export default function FactDetailTable({
  kind,
  title,
  data,
  total,
  loading,
  filters,
  onFilterChange,
}: FactDetailTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    ano: filters.ano?.toString() || "",
    mes: filters.mes?.toString() || "",
    cnes: filters.cnes || "",
    codigo_cid: filters.codigo_cid || "",
    codigo_procedimento: filters.codigo_procedimento || "",
    id_hospital: filters.id_hospital?.toString() || "",
    sexo: filters.sexo || "",
    faixa_etaria: filters.faixa_etaria || "",
    especialidade: filters.especialidade || "",
    complexidade: filters.complexidade || "",
    obito: filters.obito?.toString() || "",
    categoria_profissional: filters.categoria_profissional || "",
  });

  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canGoNext = total > 0 ? currentPage < totalPages : data.length === limit;
  const isProcedimentos = kind === "procedimentos";

  const alterarOrdenacao = (columnKey: string) => {
    const nextDirection = filters.order_by === columnKey && filters.order_dir === "asc" ? "desc" : "asc";
    onFilterChange({
      ...filters,
      order_by: columnKey,
      order_dir: nextDirection,
      offset: 0,
    });
  };

  const sortIndicator = (columnKey: string) => {
    if (filters.order_by !== columnKey) return "";
    return filters.order_dir === "desc" ? " ↓" : " ↑";
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ano: localFilters.ano ? Number(localFilters.ano) : undefined,
      mes: localFilters.mes ? Number(localFilters.mes) : undefined,
      cnes: localFilters.cnes || undefined,
      codigo_cid: localFilters.codigo_cid || undefined,
      codigo_procedimento: isProcedimentos ? localFilters.codigo_procedimento || undefined : undefined,
      id_hospital: localFilters.id_hospital ? Number(localFilters.id_hospital) : undefined,
      sexo: !isProcedimentos ? localFilters.sexo || undefined : undefined,
      faixa_etaria: !isProcedimentos ? localFilters.faixa_etaria || undefined : undefined,
      especialidade: !isProcedimentos ? localFilters.especialidade || undefined : undefined,
      obito: !isProcedimentos && localFilters.obito ? Number(localFilters.obito) : undefined,
      categoria_profissional: isProcedimentos ? localFilters.categoria_profissional || undefined : undefined,
      complexidade: localFilters.complexidade || undefined,
      order_by: filters.order_by,
      order_dir: filters.order_dir,
      limit,
      offset: 0,
    });
  };

  const limparFiltros = () => {
    setLocalFilters({
      ano: "",
      mes: "",
      cnes: "",
      codigo_cid: "",
      codigo_procedimento: "",
      id_hospital: "",
      sexo: "",
      faixa_etaria: "",
      especialidade: "",
      complexidade: "",
      obito: "",
      categoria_profissional: "",
    });
    onFilterChange({ limit, offset: 0, order_by: filters.order_by, order_dir: filters.order_dir });
  };

  const mudarPagina = (direcao: "anterior" | "proxima") => {
    const novoOffset = direcao === "anterior" ? Math.max(0, offset - limit) : offset + limit;
    onFilterChange({ ...filters, offset: novoOffset });
  };

  const formatarMoeda = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  const formatarNumero = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "0";
    return new Intl.NumberFormat("pt-BR").format(valor);
  };

  const formatarBooleano = (valor: boolean | number | null | undefined) => {
    if (valor === true || valor === 1) return "Sim";
    if (valor === false || valor === 0) return "Não";
    return "N/D";
  };

  const internacaoColumns: DetailColumn[] = [
    { key: "ano", label: "Competência", render: (row) => `${row.nome_mes?.substring(0, 3) || "N/D"} / ${row.ano}` },
    { key: "numero_aih", label: "AIH", render: (row) => row.numero_aih || "N/D" },
    { key: "cnes", label: "Hospital", render: (row) => row.cnes || "N/D" },
    { key: "faixa_etaria", label: "Perfil", render: (row) => `${(row as FatoInternacao).sexo || "N/D"} | ${(row as FatoInternacao).faixa_etaria || "N/D"}` },
    { key: "codigo_cid", label: "CID", render: (row) => row.codigo_cid || "N/D" },
    { key: "especialidade", label: "Especialidade", render: (row) => (row as FatoInternacao).especialidade || "N/D" },
    { key: "complexidade", label: "Complexidade", render: (row) => (row as FatoInternacao).complexidade || "N/D" },
    { key: "valor_total_internacao", label: "Valor", align: "right", render: (row) => formatarMoeda((row as FatoInternacao).valor_total_internacao) },
    { key: "dias_permanencia", label: "Dias", align: "right", render: (row) => formatarNumero((row as FatoInternacao).dias_permanencia) },
    { key: "obito", label: "Óbito", align: "right", render: (row) => formatarBooleano((row as FatoInternacao).obito) },
  ];

  const procedimentoColumns: DetailColumn[] = [
    { key: "ano", label: "Competência", render: (row) => `${row.nome_mes?.substring(0, 3) || "N/D"} / ${row.ano}` },
    { key: "numero_aih", label: "AIH", render: (row) => row.numero_aih || "N/D" },
    { key: "cnes", label: "Hospital", render: (row) => row.cnes || "N/D" },
    { key: "codigo_procedimento", label: "Procedimento", render: (row) => (row as FatoProcedimento).codigo_procedimento || "N/D" },
    { key: "categoria_profissional", label: "Profissional", render: (row) => (row as FatoProcedimento).categoria_profissional || "N/D" },
    { key: "codigo_cid", label: "CID", render: (row) => row.codigo_cid || "N/D" },
    { key: "complexidade", label: "Complexidade", render: (row) => (row as FatoProcedimento).complexidade || "N/D" },
    { key: "tipo_financiamento", label: "Financiamento", render: (row) => (row as FatoProcedimento).tipo_financiamento || "N/D" },
    { key: "valor_procedimento", label: "Valor", align: "right", render: (row) => formatarMoeda((row as FatoProcedimento).valor_procedimento) },
    { key: "quantidade_procedimentos", label: "Qtd.", align: "right", render: (row) => formatarNumero((row as FatoProcedimento).quantidade_procedimentos) },
  ];

  const columns = isProcedimentos ? procedimentoColumns : internacaoColumns;

  return (
    <div className="rounded-xl border border-gray-800 bg-[#151D30] shadow-xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 bg-[#121A2B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
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

        {!isCollapsed && (
          <form onSubmit={aplicarFiltros} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ano</label>
              <input type="number" placeholder="Ex: 2024" value={localFilters.ano} onChange={(e) => setLocalFilters({ ...localFilters, ano: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mês</label>
              <select value={localFilters.mes} onChange={(e) => setLocalFilters({ ...localFilters, mes: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-2 text-xs text-white focus:border-teal-500 focus:outline-none">
                <option value="">Todos</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CNES</label>
              <input type="text" placeholder="Hospital" value={localFilters.cnes} onChange={(e) => setLocalFilters({ ...localFilters, cnes: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">CID</label>
              <input type="text" placeholder="Ex: I10" value={localFilters.codigo_cid} onChange={(e) => setLocalFilters({ ...localFilters, codigo_cid: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
            </div>

            {!isProcedimentos && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Perfil</label>
                  <input type="text" placeholder="Faixa etária" value={localFilters.faixa_etaria} onChange={(e) => setLocalFilters({ ...localFilters, faixa_etaria: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Especialidade</label>
                  <input type="text" placeholder="Ex: Clínica" value={localFilters.especialidade} onChange={(e) => setLocalFilters({ ...localFilters, especialidade: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sexo</label>
                  <input type="text" placeholder="M/F" value={localFilters.sexo} onChange={(e) => setLocalFilters({ ...localFilters, sexo: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Óbito</label>
                  <select value={localFilters.obito} onChange={(e) => setLocalFilters({ ...localFilters, obito: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-2 text-xs text-white focus:border-teal-500 focus:outline-none">
                    <option value="">Todos</option>
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                  </select>
                </div>
              </>
            )}

            {isProcedimentos && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Procedimento</label>
                  <input type="text" placeholder="Código" value={localFilters.codigo_procedimento} onChange={(e) => setLocalFilters({ ...localFilters, codigo_procedimento: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Profissional</label>
                  <input type="text" placeholder="Categoria" value={localFilters.categoria_profissional} onChange={(e) => setLocalFilters({ ...localFilters, categoria_profissional: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Complexidade</label>
              <input type="text" placeholder="Ex: Alta" value={localFilters.complexidade} onChange={(e) => setLocalFilters({ ...localFilters, complexidade: e.target.value })} className="w-full h-9 rounded-lg border border-gray-700 bg-[#0F172A] px-3 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none" />
            </div>

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
                        {column.label}{sortIndicator(column.key)}
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
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhum registro encontrado com os filtros selecionados.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={`${kind}-${idx}-${row.numero_aih || "registro"}`} className="hover:bg-teal-500/[0.02] transition-colors">
                      {columns.map((column) => (
                        <td key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}>{column.render(row)}</td>
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
