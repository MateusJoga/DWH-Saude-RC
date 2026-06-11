"use client";

import React from "react";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Database,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  FlameKindling
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-4">
      {/* Seção Hero: Apresentação Principal */}
      <section className="text-center space-y-6 py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 blur-3xl opacity-30 -z-10 rounded-full" />
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Health Data Warehouse <br />
          <span className="bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
            Inteligência de Dados Clínicos
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-sm text-gray-400 leading-relaxed">
          Plataforma analítica corporativa conectando dados de saúde pública de Rio Claro - SP. 
          Ingere, higieniza e consolida milhões de internações hospitalares para apoiar gestores com painéis e inteligência artificial semântica.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="h-11 px-6 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0B0F19] font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <span>Acessar Dashboard Analítico</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          
          <Link
            href="/chat"
            className="h-11 px-6 rounded-lg border border-gray-700 bg-gray-800/40 hover:bg-gray-800 text-white font-semibold text-sm transition-all flex items-center gap-2"
          >
            <span>Consultar IA (Linguagem Natural)</span>
          </Link>
        </div>
      </section>

      {/* Grid: Camadas de Arquitetura DW */}
      <section className="space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Estrutura do Data Warehouse</h2>
          <p className="text-xs text-gray-500">Mapeamento em camadas implementado no SQL Server Docker</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bronze Layer */}
          <div className="rounded-xl border border-gray-800/80 bg-[#151D30]/60 p-6 flex flex-col justify-between hover:border-orange-500/40 transition-all group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-950">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">1. Camada Bronze</h3>
                <span className="text-[10px] uppercase font-mono text-orange-500 font-bold tracking-widest">Raw Data Ingestion</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Armazena os dados em seu formato original e bruto diretamente das fontes de internações (SIH/SUS), sem transformações, garantindo a rastreabilidade total.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-800/50 flex items-center gap-2 text-[10px] text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-gray-600" />
              <span>Tabelas de Carga Cruas</span>
            </div>
          </div>

          {/* Prata Layer */}
          <div className="rounded-xl border border-gray-800/80 bg-[#151D30]/60 p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-950">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">2. Camada Prata</h3>
                <span className="text-[10px] uppercase font-mono text-blue-400 font-bold tracking-widest">Cleaned & Standardized</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Realiza o tratamento, limpeza de nulos, deduplicação de internações e conformidade de tipos de dados. Estrutura as tabelas de dimensões e fatos analíticos.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-800/50 flex items-center gap-2 text-[10px] text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span>Modelagem Estrela (Star Schema)</span>
            </div>
          </div>

          {/* Ouro Layer */}
          <div className="rounded-xl border border-gray-800/80 bg-[#151D30]/60 p-6 flex flex-col justify-between hover:border-teal-500/40 transition-all group">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-950">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">3. Camada Ouro</h3>
                <span className="text-[10px] uppercase font-mono text-teal-400 font-bold tracking-widest">Aggregated & Business</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Views consolidadas e agregações mensais prontas para consumo imediato. Otimizada para alta performance em ferramentas de BI e injeção semântica em IA.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-800/50 flex items-center gap-2 text-[10px] text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Views `fato_internacoes` e `agg_cid`</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Adicional: Benefícios para Gestão em Saúde */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-800/80">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-teal-400" />
            Respostas em Segundos
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            A plataforma transforma dados complexos da saúde em informações úteis, ajudando gestores,
            secretarias, hospitais e tomadores de decisão a compreender cenários, priorizar ações e
            acompanhar resultados com mais clareza.
          </p>
          <div className="rounded-lg bg-[#0F172A] border border-gray-800 p-3.5 text-[11px] font-mono text-gray-400 leading-relaxed italic">
            <p>&ldquo;Quais doenças tiveram mais internações?&rdquo;</p>
            <p>&ldquo;Qual hospital registrou mais óbitos?&rdquo;</p>
            <p>&ldquo;Quais procedimentos tiveram maior custo?&rdquo;</p>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Com consultas em linguagem natural, gestores podem obter respostas rapidamente, sem depender
            de planilhas dispersas ou solicitações técnicas para cada nova análise.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            Gestão Baseada em Dados
          </h3>
          <ul className="space-y-3 text-xs text-gray-400">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>Visão Consolidada:</strong> Centralização das informações de internações, procedimentos, custos e indicadores hospitalares em um único ambiente.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>Mais Agilidade:</strong> Redução do tempo necessário para localizar informações e gerar análises gerenciais.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>Indicadores Estratégicos:</strong> Acompanhamento de internações, mortalidade, custos, permanência hospitalar e demais indicadores para suporte à gestão.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
