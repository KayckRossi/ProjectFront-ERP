import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// Evita que um erro de renderização deixe a tela em branco. `chave` (ex.: a rota) reinicia o estado ao mudar.
export default class ErrorBoundary extends Component {
  state = { erro: null };

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro na interface:', erro, info?.componentStack);
  }

  componentDidUpdate(anterior) {
    if (this.state.erro && anterior.chave !== this.props.chave) this.setState({ erro: null });
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center text-center py-24 px-4">
        <div className="w-14 h-14 rounded-full bg-danger/15 flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-danger" />
        </div>
        <h2 className="text-lg font-semibold text-snow">Algo deu errado nesta tela</h2>
        <p className="text-sm text-snow/50 mt-1 max-w-md">{this.state.erro.message}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => this.setState({ erro: null })}
            className="h-10 px-4 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}
