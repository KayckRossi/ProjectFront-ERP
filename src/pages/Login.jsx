import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/safeReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err?.message || "E-mail ou senha incorretos. Por favor, verifique seus dados de acesso.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para gerenciar seu negócio no ERP"
      footer={
        <p className="text-snow/70 text-sm">
          Ainda não possui uma conta?{" "}
          <Link
            to={"/cadastro" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-pearl font-semibold hover:underline ml-1"
          >
            Cadastre-se grátis
          </Link>
        </p>
      }
    >
      {/* Botão de Login com o Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6 bg-onyx/70 hover:bg-onyx border border-snow/15 hover:border-pearl/40 text-snow rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3 group"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
        <span className="font-medium text-snow">Continuar com o Google</span>
      </Button>

      {/* Divisor */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-snow/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
          <span className="bg-graphite px-3 text-snow/40">ou entre com seu e-mail</span>
        </div>
      </div>

      {/* Alerta de erro */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-snow flex items-start gap-2.5 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário de Login */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo E-mail */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-snow/90">
            E-mail corporativo ou pessoal
          </Label>
          <div className="relative group">
            <Mail
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl"
              aria-hidden="true"
            />
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

        {/* Campo Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-snow/90">
              Senha
            </Label>
            <Link
              to="/esqueci-senha"
              className="text-xs text-pearl hover:text-pearl/80 hover:underline transition-colors font-medium"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative group">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl"
              aria-hidden="true"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-11 h-12 bg-onyx/70 border-snow/15 focus:border-pearl focus:ring-2 focus:ring-pearl/20 text-snow placeholder:text-snow/30 rounded-xl transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-snow/40 hover:text-snow transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-pearl"
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-pearl" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Lembrar de mim */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-snow/70 hover:text-snow transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-snow/20 bg-onyx text-verdigris focus:ring-pearl/30 focus:ring-offset-graphite cursor-pointer"
            />
            <span>Lembrar de mim neste dispositivo</span>
          </label>
        </div>

        {/* Botão de Envio */}
        <Button
          type="submit"
          className="w-full h-12 font-semibold text-snow bg-verdigris hover:bg-verdigris-hover rounded-xl shadow-lg shadow-verdigris/25 hover:shadow-verdigris/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-snow" />
              Acessando sistema...
            </>
          ) : (
            "Acessar Sistema"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
