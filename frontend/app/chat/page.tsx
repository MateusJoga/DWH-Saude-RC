"use client";

import React from "react";
import ChatBox from "@/components/ChatBox";
import { MessageSquare, Sparkles, Terminal } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-400" />
            Consulta em Linguagem Natural
          </h1>
          <p className="text-xs text-gray-400">
            Pergunte à Inteligência Artificial e veja as consultas SQL automáticas geradas na camada Ouro
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-950/20 px-3 py-1.5 rounded-lg border border-blue-900/50">
          <Terminal className="h-4 w-4" />
          <span>Pipeline NL2SQL</span>
        </div>
      </div>

      {/* Caixa do Chat */}
      <ChatBox />

      {/* Box Informativo Técnico */}
      <div className="rounded-xl border border-gray-800 bg-[#151D30]/40 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-teal-400" />
          Como funciona esta arquitetura futura?
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          O portal Next.js envia o texto da pergunta para a API FastAPI. Em produção, a API utiliza um orquestrador semântico (como LangChain/Semantic Kernel) 
          que possui acesso ao catálogo de metadados das views de agregação da camada ouro (hospitais, cids, internacoes).
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          O modelo generativo traduz a pergunta em uma query SQL Server compatível e a executa diretamente via SQLAlchemy, retornando a resposta explicada de forma amigável, 
          junto com os insights e a query técnica para validação e auditoria do usuário.
        </p>
      </div>
    </div>
  );
}
