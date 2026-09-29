import React from "react";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-onyx text-snow relative flex flex-col items-center justify-center py-8 px-4 overflow-y-auto overflow-x-hidden selection:bg-verdigris selection:text-snow">
      {/* Luz ambiente de fundo */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-verdigris/15 blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 w-[450px] h-[350px] bg-pearl/10 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        {/* Marca no topo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-3 mb-4 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-verdigris flex items-center justify-center shadow-lg shadow-verdigris/25 border border-pearl/20 transition-transform group-hover:scale-105 duration-200">
              <span className="text-snow font-bold text-xl tracking-tight">N</span>
            </div>
            <div className="text-left">
              <span className="text-snow font-bold text-lg tracking-tight block leading-tight">Nexora</span>
              <span className="text-[10px] text-pearl font-medium tracking-wider uppercase block">ERP & PDV Inteligente</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-snow">{title}</h1>
            {subtitle && <p className="text-sm text-snow/60 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Card do formulário */}
        <div className="bg-graphite/90 backdrop-blur-xl rounded-2xl border border-[rgba(125,226,209,0.15)] p-6 sm:p-7 card-shadow shadow-2xl shadow-black/80">
          {children}
        </div>

        {footer && (
          <div className="text-center text-sm text-snow/60 mt-5">
            {footer}
          </div>
        )}

        {/* Selo de segurança no rodapé */}
        <div className="text-center pt-6 pb-2">
          <div className="inline-flex items-center justify-center gap-2 text-xs text-snow/40 px-3 py-1.5 rounded-full bg-graphite/50 border border-snow/5">
            <ShieldCheck className="w-3.5 h-3.5 text-pearl shrink-0" />
            <span>Ambiente protegido com criptografia de ponta a ponta</span>
          </div>
          <p className="text-[11px] text-snow/25 mt-2">
            © {new Date().getFullYear()} Nexora ERP • Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
