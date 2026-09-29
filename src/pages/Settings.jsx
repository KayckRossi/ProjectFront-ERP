import { useState } from 'react';
import { Store, Printer, Bell, Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

function Toggle({ on, setOn }) {
  return (
    <button onClick={() => setOn(!on)} className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-verdigris' : 'bg-onyx'}`} role="switch" aria-checked={on}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-snow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SettingCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="bg-graphite rounded-card p-6 card-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-verdigris-light flex items-center justify-center shrink-0"><Icon size={20} className="text-pearl" /></div>
        <div>
          <h3 className="font-semibold text-snow">{title}</h3>
          <p className="text-sm text-snow/50">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-[rgba(125,226,209,0.08)] first:border-0">
      <span className="text-sm text-snow/80">{label}</span>
      {children}
    </div>
  );
}

export default function Settings() {
  const [notif, setNotif] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [printer, setPrinter] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Preferências do sistema e da loja" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SettingCard icon={Store} title="Dados da Loja" desc="Informações exibidas em cupons e notas">
          <Row label="Nome da loja"><input defaultValue="Nexora Market" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48" /></Row>
          <Row label="CNPJ"><input defaultValue="12.345.678/0001-90" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48 font-mono" /></Row>
          <Row label="Telefone"><input defaultValue="(11) 3333-4444" className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-48" /></Row>
        </SettingCard>

        <SettingCard icon={Bell} title="Notificações" desc="Alertas do sistema">
          <Row label="Notificações push"><Toggle on={notif} setOn={setNotif} /></Row>
          <Row label="Alerta de estoque baixo"><Toggle on={lowStock} setOn={setLowStock} /></Row>
        </SettingCard>

        <SettingCard icon={Printer} title="Impressão" desc="Cupom não fiscal e PDV">
          <Row label="Impressora automática"><Toggle on={printer} setOn={setPrinter} /></Row>
          <Row label="Modelo"><select className="h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"><option>Termal 80mm</option><option>Termal 58mm</option><option>A4</option></select></Row>
        </SettingCard>

        <SettingCard icon={Shield} title="Segurança" desc="Proteção de acesso">
          <Row label="Autenticação em dois fatores"><Toggle on={twoFa} setOn={setTwoFa} /></Row>
          <Row label="Sessão"><button className="text-sm text-pearl hover:underline">Encerrar outras sessões</button></Row>
        </SettingCard>
      </div>
    </div>
  );
}
