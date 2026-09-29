import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, AlertCircle, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem. Digite a mesma senha em ambos os campos.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err?.message || "Falha ao redefinir senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Link de redefinição inválido"
        subtitle="Este link de redefinição de senha está incompleto ou expirou"
        footer={
          <Link to="/esqueci-senha" className="text-pearl font-medium hover:underline">
            Solicitar novo link de redefinição
          </Link>
        }
      >
        <p className="text-sm text-snow/80 text-center py-2">
          O link utilizado parece estar incorreto ou já expirou. Por favor, solicite um novo e-mail para recuperar o acesso.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nova senha"
      subtitle="Defina sua nova credencial de acesso abaixo"
      footer={
        <Link to="/login" className="text-pearl font-medium hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-snow flex items-start gap-2.5 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-snow/90">Nova Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-11 h-12 bg-onyx/70 border-snow/15 focus:border-pearl focus:ring-2 focus:ring-pearl/20 text-snow placeholder:text-snow/30 rounded-xl transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-snow/40 hover:text-snow transition-colors p-1"
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-pearl" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium text-snow/90">Confirmar Nova Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl" aria-hidden="true" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-11 h-12 bg-onyx/70 border-snow/15 focus:border-pearl focus:ring-2 focus:ring-pearl/20 text-snow placeholder:text-snow/30 rounded-xl transition-all"
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
              Redefinindo senha...
            </>
          ) : (
            "Salvar Nova Senha"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
