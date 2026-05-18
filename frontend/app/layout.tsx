import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Health DW - Analytics Portal",
  description: "Portal Analítico do Data Warehouse de Saúde Pública com suporte a linguagem natural",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#0B0F19] text-gray-100 antialiased`}>
        <div className="flex h-screen w-screen overflow-hidden">
          {/* Menu Lateral de Controle */}
          <Sidebar />
          
          {/* Corpo do Painel Principal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Barra de Status Superior */}
            <Navbar />
            
            {/* Janela de Renderização Principal */}
            <main className="flex-1 overflow-y-auto bg-[#0B0F19] p-6 text-gray-200">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
