import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Ignorar para segurança
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber as instruções de recuperação"
      footer={
        <Link to="/login" className="text-pearl font-medium hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a página de login</span>
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-verdigris/20 text-pearl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-snow font-medium text-base">E-mail de recuperação enviado!</p>
          <p className="text-sm text-snow/70">
            Se houver uma conta associada a <strong className="text-snow">{email}</strong>, você receberá um link em instantes.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-snow/90">E-mail cadastrado</Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-onyx/70 border-snow/15 focus:border-pearl focus:ring-2 focus:ring-pearl/20 text-snow placeholder:text-snow/30 rounded-xl transition-all"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 font-semibold text-snow bg-verdigris hover:bg-verdigris-hover rounded-xl shadow-lg shadow-verdigris/25 hover:shadow-verdigris/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-snow" />
                Enviando link...
              </>
            ) : (
              "Enviar Link de Recuperação"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
