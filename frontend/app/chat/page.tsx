"use client";

import React from "react";
import ChatBox from "@/components/ChatBox";
import { MessageSquare, Terminal } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-400" />
            Consulta em Linguagem Natural
          </h1>
          <p className="text-xs text-gray-400">
            Faça perguntas sobre os indicadores de saúde e receba respostas organizadas para apoiar a tomada de decisão.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-950/20 px-3 py-1.5 rounded-lg border border-blue-900/50">
          <Terminal className="h-4 w-4" />
          <span>Assistente Analítico</span>
        </div>
      </div>

      <ChatBox />
    </div>
  );
}
