import { useState } from 'react';
import { Store, Printer, Bell, Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

function Alternador({ ativo, aoAlternar }) {
  return (
    <button
      onClick={() => aoAlternar(!ativo)}
      className={`w-11 h-6 rounded-full transition-colors relative ${ativo ? 'bg-verdigris' : 'bg-onyx'}`}
      role="switch"
      aria-checked={ativo}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-snow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function CartaoConfiguracao({ icon: Icon, title, desc, children }) {
  return (
    <div className="bg-graphite rounded-card p-6 card-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-verdigris-light flex items-center justify-center shrink-0">
          <Icon size={20} className="text-pearl" />
        </div>
        <div>
          <h3 className="font-semibold text-snow">{title}</h3>
          <p className="text-sm text-snow/50">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LinhaConfiguracao({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-[rgba(125,226,209,0.08)] first:border-0">
      <span className="text-sm text-snow/80">{label}</span>
      {children}
    </div>
  );
}

export default function Configuracoes() {
  const [notificacoes, setNotificacoes] = useState(true);
  const [estoqueBaixo, setEstoqueBaixo] = useState(true);
  const [impressora, setImpressora] = useState(false);
  const [doisFatores, setDoisFatores] = useState(false);

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Preferências do sistema e da loja" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CartaoConfiguracao icon={Store} title="Dados da Loja" desc="Informações exibidas em cupons e notas">
          <LinhaConfiguracao label="Nome da loja">
            <input defaultValue="Nexora Market" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48" />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="CNPJ">
            <input defaultValue="12.345.678/0001-90" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48 font-mono" />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Telefone">
            <input defaultValue="(11) 3333-4444" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48" />
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Bell} title="Notificações" desc="Alertas do sistema">
          <LinhaConfiguracao label="Notificações push">
            <Alternador ativo={notificacoes} aoAlternar={setNotificacoes} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Alerta de estoque baixo">
            <Alternador ativo={estoqueBaixo} aoAlternar={setEstoqueBaixo} />
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Printer} title="Impressão" desc="Cupom não fiscal e PDV">
          <LinhaConfiguracao label="Impressora automática">
            <Alternador ativo={impressora} aoAlternar={setImpressora} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Modelo">
            <select className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm">
              <option>Térmica 80mm</option>
              <option>Térmica 58mm</option>
              <option>A4</option>
            </select>
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Shield} title="Segurança" desc="Proteção de acesso">
          <LinhaConfiguracao label="Autenticação em dois fatores">
            <Alternador ativo={doisFatores} aoAlternar={setDoisFatores} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Sessão">
            <button className="text-sm text-pearl hover:underline">Encerrar outras sessões</button>
          </LinhaConfiguracao>
        </CartaoConfiguracao>
      </div>
    </div>
  );
}
