"use client";

import React, { useEffect, useState } from "react";
import { Activity, Database, Server, Clock, ShieldAlert } from "lucide-react";
import { getApiHealth, ApiHealthResponse } from "@/services/api";

export default function Navbar() {
  const [health, setHealth] = useState<ApiHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const data = await getApiHealth();
        setHealth(data);
        setError(false);
      } catch (err) {
        setError(true);
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
    // Revalida a saúde da conexão a cada 10 segundos
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-800 bg-[#0F172A]/80 px-6 backdrop-blur-md">
      {/* Lado Esquerdo: Titulo da Seção */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-teal-400 animate-pulse" />
        <h1 className="text-lg font-semibold tracking-wide text-white">
          Data Warehouse <span className="text-teal-400 font-bold">Saúde Pública</span>
        </h1>
      </div>

      {/* Lado Direito: Status da Conexão */}
      <div className="flex items-center gap-4 text-xs">
        {loading && (
          <div className="flex items-center gap-2 rounded-full bg-gray-800/80 px-3 py-1 text-gray-400 border border-gray-700">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>Verificando conexão...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-full bg-red-950/50 px-3 py-1 text-red-400 border border-red-800/50 animate-bounce">
            <ShieldAlert className="h-3 w-3" />
            <span>Banco Offline</span>
          </div>
        )}

        {!loading && health && (
          <div className="flex items-center gap-4">
            {/* Latência de Rede */}
            <div className="hidden items-center gap-1.5 text-gray-400 sm:flex">
              <Clock className="h-3 w-3 text-teal-400" />
              <span>DW Latência:</span>
              <span className="font-mono text-teal-300 font-semibold">{health.database.latency_ms} ms</span>
            </div>

            {/* Versão do SQL Server */}
            <div className="hidden items-center gap-1.5 text-gray-400 md:flex">
              <Server className="h-3 w-3 text-blue-400" />
              <span>Versão:</span>
              <span className="max-w-[140px] truncate font-mono text-gray-300" title={health.database.server_version}>
                {health.database.server_version}
              </span>
            </div>

            {/* Indicador de Sucesso */}
            <div className="flex items-center gap-2 rounded-full bg-emerald-950/50 px-3.5 py-1 text-emerald-400 border border-emerald-800/50">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">SQL Server Conectado</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
