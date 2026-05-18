"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  Lightbulb, 
  Sparkles, 
  ChevronRight,
  ShieldAlert,
  Grid,
  BookOpen,
  Database
} from "lucide-react";
import { postIaPergunta } from "@/services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
  tipo_pergunta?: string;
  sql_executado?: string | null;
  insights?: string[];
  status?: string;
  intencao_detectada?: string;
  dados?: Record<string, any>[];
}

export default function ChatBox() {
  const [pergunta, setPergunta] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Sou o seu Assistente Analítico de IA. Pergunte-me qualquer dúvida sobre os dados da saúde na camada ouro, ou solicite conceitos explicativos da saúde pública e DW (ex: 'O que é CNES?'). Eu rotearei e resolverei sua dúvida com segurança!",
      tipo_pergunta: "conceptual"
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestionTab, setSuggestionTab] = useState<"analytical" | "conceptual">("analytical");
  
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Rolagem automática para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const enviarMensagem = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const novaMensagemUsuario: Message = { role: "user", text: texto };
    setMessages((prev) => [...prev, novaMensagemUsuario]);
    setPergunta("");
    setLoading(true);

    try {
      const response = await postIaPergunta(texto);
      const novaMensagemIa: Message = {
        role: "assistant",
        text: response.resposta,
        tipo_pergunta: response.tipo_pergunta,
        sql_executado: response.sql_executado,
        insights: response.insights,
        status: response.status,
        intencao_detectada: response.intencao_detectada,
        dados: response.dados,
      };
      setMessages((prev) => [...prev, novaMensagemIa]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique se os servidores do backend FastAPI e do SQL Server estão ativos.",
          tipo_pergunta: "unknown",
          status: "error"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensagem(pergunta);
  };

  // Sugestões analíticas (que consultam o banco)
  const sugestoesAnaliticas = [
    { label: "Mais Internações (Hospitais)", q: "Quais hospitais tiveram mais internações?" },
    { label: "Morbidades Comuns (CIDs)", q: "Quais CIDs tiveram mais internações?" },
    { label: "Letalidade Hospitalar", q: "Qual CID teve maior taxa de óbito?" }
  ];

  // Sugestões conceituais (que explicam termos teóricos locais)
  const sugestoesConceituais = [
    { label: "O que é CNES?", q: "O que é CNES?" },
    { label: "Significado do CID A", q: "O que significa o grupo CID A?" },
    { label: "O que é Camada Ouro?", q: "O que é camada ouro?" }
  ];

  return (
    <div className="flex flex-col h-[600px] border border-gray-800 rounded-xl bg-[#151D30] shadow-2xl overflow-hidden">
      {/* Barra superior de identificação */}
      <div className="p-4 bg-[#121A2B] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Assistente Analítico de IA</h2>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              NL2SQL Pipeline: Roteador de Perguntas Ativo
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-teal-950/40 text-teal-400 px-2 py-0.5 rounded border border-teal-900/60">
          Sandbox v2 (LLM Ready)
        </span>
      </div>

      {/* Histórico de Mensagens */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-850">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${
              msg.role === "user" ? "bg-teal-500 text-[#0B0F19]" : "bg-blue-500/10 text-blue-400 border border-blue-900/50"
            }`}>
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Balão de Mensagem */}
            <div className="space-y-2 flex-1">
              {/* Badges de Tipo de Pergunta, Intenção e Alertas */}
              {msg.role === "assistant" && msg.tipo_pergunta && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {/* Badge de tipo de pergunta */}
                  {msg.tipo_pergunta === "analytical" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-950/60 text-teal-400 border border-teal-900/40 flex items-center gap-1">
                      <Database className="h-2.5 w-2.5" />
                      Consulta Analítica (DW)
                    </span>
                  )}
                  {msg.tipo_pergunta === "conceptual" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/40 flex items-center gap-1">
                      <BookOpen className="h-2.5 w-2.5" />
                      Conceito (SUS / DW)
                    </span>
                  )}
                  {msg.tipo_pergunta === "unknown" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/40">
                      Fora de Escopo
                    </span>
                  )}
                  {msg.tipo_pergunta === "blocked_by_safety" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-900/60 flex items-center gap-1 animate-bounce">
                      <ShieldAlert className="h-3 w-3" />
                      Segurança Barrada
                    </span>
                  )}

                  {/* Badge de Intenção detectada (se houver e for analítica) */}
                  {msg.tipo_pergunta === "analytical" && msg.intencao_detectada && msg.intencao_detectada !== "none" && (
                    <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">
                      Mapeado: {msg.intencao_detectada}
                    </span>
                  )}
                </div>
              )}

              {/* Corpo da Resposta Textual */}
              <div className={`p-4 rounded-xl text-sm ${
                msg.role === "user" 
                  ? "bg-teal-500 text-[#0B0F19] font-medium rounded-tr-none" 
                  : msg.tipo_pergunta === "blocked_by_safety"
                    ? "bg-red-950/20 text-red-300 rounded-tl-none border border-red-900/50"
                    : "bg-[#0F172A] text-gray-300 rounded-tl-none border border-gray-800"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>

              {/* TABELA DE DADOS (RENDERIZA APENAS SE HOUVER DADOS) */}
              {msg.role === "assistant" && msg.dados && msg.dados.length > 0 && (
                <div className="rounded-lg border border-gray-800 bg-[#0F172A] overflow-hidden text-xs shadow-md">
                  <div className="bg-gray-900/80 px-3 py-2 border-b border-gray-800 text-gray-400 text-[10px] font-bold flex items-center gap-1.5">
                    <Grid className="h-3.5 w-3.5 text-teal-400" />
                    <span>DADOS DE INTERNAÇÕES CONSOLIDADAS</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse font-sans">
                      <thead className="bg-[#121A2B] text-gray-400 uppercase text-[9px] tracking-wider border-b border-gray-800">
                        <tr>
                          {Object.keys(msg.dados[0]).map((col) => (
                            <th key={col} className="px-3 py-2 text-gray-400 font-semibold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850/60 text-gray-300 font-mono">
                        {msg.dados.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-teal-500/[0.02] transition-colors">
                            {Object.keys(msg.dados[0]).map((col) => {
                              const val = row[col];
                              let displayVal = "N/D";
                              if (val !== null && val !== undefined) {
                                if (typeof val === "number") {
                                  if (col.includes("Custo") || col.includes("R$")) {
                                    displayVal = val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
                                  } else {
                                    displayVal = val.toLocaleString("pt-BR");
                                  }
                                } else {
                                  displayVal = String(val);
                                }
                              }
                              return (
                                <td key={col} className="px-3 py-2">{displayVal}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BOX DE SQL (OCULTAR QUANDO NULL) */}
              {msg.role === "assistant" && msg.sql_executado && msg.sql_executado.trim() !== "" && (
                <div className="rounded-lg border border-gray-800 bg-black/40 overflow-hidden text-xs">
                  <div className="bg-gray-900/80 px-3 py-1.5 border-b border-gray-800 flex items-center justify-between text-gray-400 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 font-sans">
                      <Terminal className="h-3.5 w-3.5 text-teal-400" />
                      QUERY SELECT EXECUTADA (LEITURA SEGURA)
                    </span>
                    <span className="font-mono text-gray-500">ouro.fato_internacoes</span>
                  </div>
                  <pre className="p-3 font-mono text-teal-300 whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
                    {msg.sql_executado}
                  </pre>
                </div>
              )}

              {/* BOX DE INSIGHTS (OCULTAR QUANDO DADOS E INSIGHTS VAZIOS) */}
              {msg.role === "assistant" && msg.insights && msg.insights.length > 0 && (
                <div className="p-3 bg-teal-950/15 border border-teal-900/40 rounded-lg text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold tracking-wide">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    <span>INSIGHTS OPERACIONAIS</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 pl-1 font-sans">
                    {msg.insights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Digitador */}
        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-900/50 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-xl bg-[#0F172A] border border-gray-800 text-gray-400 text-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce delay-75" />
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce delay-150" />
                <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-bounce delay-300" />
              </span>
              <span>Roteando pergunta e recuperando resposta analítica...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Rodapé: Caixa de Entrada e Sugestões Rápidas */}
      <div className="p-4 bg-[#121A2B] border-t border-gray-800 flex flex-col gap-3">
        {/* Sugestões Rápidas Separadas por Abas (Perguntas Analíticas / Perguntas Conceituais) */}
        {messages.length === 1 && !loading && (
          <div className="space-y-2">
            {/* Header das abas de sugestões */}
            <div className="flex items-center gap-3 border-b border-gray-800/80 pb-1">
              <button
                type="button"
                onClick={() => setSuggestionTab("analytical")}
                className={`text-[9px] uppercase font-bold tracking-widest pb-1 transition-all border-b-2 ${
                  suggestionTab === "analytical" 
                    ? "border-teal-500 text-teal-400 font-extrabold" 
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Perguntas Analíticas (Consultas)
              </button>
              <button
                type="button"
                onClick={() => setSuggestionTab("conceptual")}
                className={`text-[9px] uppercase font-bold tracking-widest pb-1 transition-all border-b-2 ${
                  suggestionTab === "conceptual" 
                    ? "border-blue-500 text-blue-400 font-extrabold" 
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                Perguntas Conceituais (Teóricas)
              </button>
            </div>

            {/* Conteúdo das sugestões */}
            <div className="flex flex-wrap gap-2 animate-fadeIn">
              {suggestionTab === "analytical" ? (
                sugestoesAnaliticas.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => enviarMensagem(sug.q)}
                    className="px-2.5 py-1 text-[10px] rounded-lg border border-gray-800 bg-[#151D30] text-gray-300 hover:border-teal-500/60 hover:text-teal-400 transition-all flex items-center gap-1 group text-left"
                  >
                    <span>{sug.label}</span>
                    <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-teal-400 shrink-0" />
                  </button>
                ))
              ) : (
                sugestoesConceituais.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => enviarMensagem(sug.q)}
                    className="px-2.5 py-1 text-[10px] rounded-lg border border-gray-800 bg-[#151D30] text-gray-300 hover:border-blue-500/60 hover:text-blue-400 transition-all flex items-center gap-1 group text-left"
                  >
                    <span>{sug.label}</span>
                    <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-blue-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            placeholder="Pergunte sobre estatísticas ou conceitos ex: 'O que significa CNES?'"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            disabled={loading}
            className="flex-1 h-11 rounded-lg border border-gray-700 bg-[#0F172A] px-4 text-xs text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!pergunta.trim() || loading}
            className="h-11 w-11 rounded-lg bg-teal-500 text-[#0B0F19] hover:bg-teal-400 disabled:opacity-30 transition-all flex items-center justify-center shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
