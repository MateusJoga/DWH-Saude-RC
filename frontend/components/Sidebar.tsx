"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  BarChart3, 
  MessageSquareShare, 
  FileBarChart, 
  Settings, 
  Lock, 
  HeartHandshake
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // Função auxiliar para marcar link ativo
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0B0F19] text-gray-300 flex flex-col justify-between shrink-0">
      {/* Bloco Superior: Logo e Navegação Principal */}
      <div className="p-5 flex flex-col gap-6">
        {/* Identificação Corporativa */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-teal-950/20 border border-teal-800/30">
          <HeartHandshake className="h-5 w-5 text-teal-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-widest">Health DW</div>
            <div className="text-[10px] text-gray-400 font-mono">Rio Claro - SP</div>
          </div>
        </div>

        {/* Menu Navegação Principal */}
        <nav className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
            Navegação
          </div>
          
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive("/") 
                ? "bg-teal-500/10 text-teal-400 border-l-2 border-teal-400 font-semibold" 
                : "hover:bg-gray-850 hover:text-white"
            }`}
          >
            <Home className="h-4.5 w-4.5" />
            <span>Início</span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive("/dashboard") 
                ? "bg-teal-500/10 text-teal-400 border-l-2 border-teal-400 font-semibold" 
                : "hover:bg-gray-850 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/chat"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive("/chat") 
                ? "bg-teal-500/10 text-teal-400 border-l-2 border-teal-400 font-semibold" 
                : "hover:bg-gray-850 hover:text-white"
            }`}
          >
            <MessageSquareShare className="h-4.5 w-4.5" />
            <span>Chat IA (Natural)</span>
          </Link>
        </nav>

        {/* Relatórios Power BI */}
        <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-800/80">
          <div className="flex justify-between items-center px-2 mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dashboards BI</span>
            <span className="text-[8px] bg-teal-950/40 text-teal-400 font-bold px-1.5 py-0.5 rounded border border-teal-900/60">ATIVO</span>
          </div>

          <Link
            href="/powerbi"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive("/powerbi") 
                ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-400 font-semibold" 
                : "hover:bg-gray-850 hover:text-white"
            }`}
          >
            <FileBarChart className="h-4.5 w-4.5 text-blue-400" />
            <span>Power BI Embedded</span>
          </Link>

        </div>
      </div>

      {/* Bloco Inferior: Autenticação e Configurações Futuras */}
      <div className="p-5 border-t border-gray-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs px-2 text-gray-500 select-none cursor-not-allowed group relative">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-gray-600 group-hover:text-teal-400" />
            <span>Autenticação Integrada</span>
          </div>
          <span className="text-[8px] bg-teal-950/40 text-teal-500 font-semibold px-1 rounded">RBAC</span>
          <span className="absolute hidden group-hover:block bg-gray-900 border border-gray-700 text-[10px] p-2 rounded -top-8 left-6 text-white z-50 shadow-xl w-48">
            Controle de acessos baseado em perfis (Médico, Diretor, Analista) via OAuth2/JWT.
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
          <Settings className="h-4 w-4" />
          <span>Configurações</span>
        </div>
      </div>
    </aside>
  );
}
