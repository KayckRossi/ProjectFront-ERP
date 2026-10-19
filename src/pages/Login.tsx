import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Eye, EyeOff, ArrowRight, ShieldCheck, BarChart3, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simula delay de autenticação
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  const features = [
    { icon: Package, title: 'Controle de Estoque', description: 'Gerencie produtos e movimentações' },
    { icon: BarChart3, title: 'Relatórios Gerenciais', description: 'Análises detalhadas do negócio' },
    { icon: Users, title: 'Gestão de Clientes', description: 'Cadastro completo de clientes' },
    { icon: ShieldCheck, title: 'Segurança', description: 'Controle de permissões por usuário' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">nexo365</h1>
              <p className="text-white/70 text-sm">Nuvex Tecnologia</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Simplifique a gestão<br />
                do seu negócio
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-md">
                Controle vendas, estoque, finanças e muito mais em uma única plataforma intuitiva e poderosa.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <feature.icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70 mt-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            © 2024 Nuvex Tecnologia. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">nexo365</h1>
              <p className="text-muted-foreground text-sm">Nuvex Tecnologia</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="mt-2 text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-0 shadow-none lg:shadow-sm lg:border">
            <CardContent className="p-0 lg:p-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Manter conectado
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Entrar no sistema
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <div className="bg-muted/50 rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Modo demonstração:</span>{' '}
              Use qualquer e-mail e senha para entrar
            </p>
          </div>

          {/* Footer Mobile */}
          <p className="lg:hidden text-center text-sm text-muted-foreground">
            © 2024 Nuvex Tecnologia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
