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
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/40 text-teal-400 border border-teal-900/60 text-xs font-semibold uppercase tracking-wider mb-2">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>Etapa 2: Portal Analítico Ativo</span>
        </div>

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
              <span>Views `agg_hospital` e `agg_cid`</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Adicional: Benefícios e Roadmap IA */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-800/80">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-teal-400" />
            Roadmap IA Generativa
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nesta etapa preparatória, construímos o barramento semântico mockado. Na próxima iteração, 
            integraremos a API do <strong className="text-teal-400">Google Gemini</strong> ou OpenAI com o framework LangChain. Isso permitirá que gestores digitem perguntas livres como:
          </p>
          <div className="rounded-lg bg-[#0F172A] border border-gray-800 p-3.5 text-[11px] font-mono text-gray-400 leading-relaxed italic">
            &ldquo;Quais patologias de cardiologia tiveram tempo de permanência maior que 5 dias em Rio Claro no ano passado?&rdquo;
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            A IA analisará a pergunta, gerará a query SQL Server perfeita e responderá com tabelas e relatórios customizados dinamicamente.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            Prontidão Tecnológica
          </h3>
          <ul className="space-y-3 text-xs text-gray-400">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>Next.js 14 & Tailwind:</strong> Performance excepcional, design fluido com HSL e acentos neon.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>FastAPI Connection:</strong> Conexão segura e pool de persistência com o Microsoft SQL Server.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span><strong>Preparado para Power BI:</strong> Estrutura lateral pronta para embutir relatórios integrados via iframe seguro ou SDK JS.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

// Pequeno ícone customizado
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1.5Z" />
    </svg>
  );
}
