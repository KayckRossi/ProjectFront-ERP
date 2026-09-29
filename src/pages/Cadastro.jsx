import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/safeReturnTo";
import { appParams } from "@/lib/app-params";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Digite a mesma senha em ambos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);

    if (appParams.appId) {
      try {
        await base44.auth.register({ email, password });
        setShowOtp(true);
      } catch (err) {
        setError(err?.message || "Falha ao criar conta. Tente novamente.");
      } finally {
        setLoading(false);
      }
    } else {
      // Modo Demonstração sem backend: registra localmente e já conecta o usuário
      const newUser = {
        id: "user-" + Date.now(),
        email,
        full_name: email.split("@")[0],
        role: "admin",
      };
      localStorage.setItem("nexora_demo_user", JSON.stringify(newUser));
      setLoading(false);
      window.location.href = safeReturnTo();
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err?.message || "Código de verificação inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Código enviado",
        description: "Verifique seu e-mail para o novo código de verificação.",
      });
    } catch (err) {
      setError(err?.message || "Falha ao reenviar código");
    }
  };

  const handleGoogle = () => {
    if (appParams.appId) {
      base44.auth.loginWithProvider("google", safeReturnTo());
    } else {
      const demoUser = {
        id: "google-user-01",
        email: "novo.usuario@nexora.com",
        full_name: "Novo Usuário (Google)",
        role: "admin",
      };
      localStorage.setItem("nexora_demo_user", JSON.stringify(demoUser));
      window.location.href = safeReturnTo();
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código de segurança de 6 dígitos para ${email}`}
        footer={null}
      >
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-snow flex items-start gap-2.5 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
              <InputOTPSlot index={1} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
              <InputOTPSlot index={2} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
              <InputOTPSlot index={3} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
              <InputOTPSlot index={4} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
              <InputOTPSlot index={5} className="w-11 h-12 text-lg font-bold bg-onyx/80 border-snow/15 text-snow rounded-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-semibold text-snow bg-verdigris hover:bg-verdigris-hover rounded-xl shadow-lg shadow-verdigris/25 hover:shadow-verdigris/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-snow" />
              Validando código...
            </>
          ) : (
            "Verificar e Acessar"
          )}
        </Button>
        <p className="text-center text-sm text-snow/60 mt-4">
          Não recebeu o código?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-pearl font-medium hover:underline ml-1"
          >
            Reenviar código
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Cadastre-se para começar a gerenciar sua empresa no Nexora"
      footer={
        <p className="text-snow/70 text-sm">
          Já possui uma conta?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-pearl font-semibold hover:underline ml-1"
          >
            Fazer login
          </Link>
        </p>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6 bg-onyx/70 hover:bg-onyx border border-snow/15 hover:border-pearl/40 text-snow rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3 group"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
        <span className="font-medium text-snow">Continuar com o Google</span>
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-snow/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
          <span className="bg-graphite px-3 text-snow/40">ou cadastre-se com e-mail</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-snow flex items-start gap-2.5 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-snow/90">E-mail</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-snow/90">Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="No mínimo 6 caracteres"
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
              {showPassword ? <EyeOff className="w-4 h-4 text-pearl" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium text-snow/90">Confirmar Senha</Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-snow/40 pointer-events-none transition-colors group-focus-within:text-pearl" aria-hidden="true" />
            <Input
              id="confirm"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-11 h-12 bg-onyx/70 border-snow/15 focus:border-pearl focus:ring-2 focus:ring-pearl/20 text-snow placeholder:text-snow/30 rounded-xl transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-snow/40 hover:text-snow transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-pearl"
              aria-label={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4 text-pearl" /> : <Eye className="w-4 h-4" />}
            </button>
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
              Criando sua conta...
            </>
          ) : (
            "Criar Minha Conta"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
