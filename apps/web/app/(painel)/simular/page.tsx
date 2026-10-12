import { Card } from '@/components/card';
import { ConnectionForm } from './connection-form';
import { SimulateForm } from './simulate-form';

export default function SimularPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Simular dados</h1>
        <p className="text-sm text-zinc-600">
          Sem integração real com o Wi-Fi: aqui você gera conexões com as mesmas regras de ingestão que o portal do Wi-Fi usaria.
        </p>
      </div>
      <Card title="Gerar movimento" subtitle="Cria visitas aleatórias nas últimas 2 horas.">
        <SimulateForm />
      </Card>
      <Card title="Registrar uma conexão" subtitle="Simula um cliente conectando (e saindo). Reconexões em até 30 min somam à mesma visita.">
        <ConnectionForm />
      </Card>
    </div>
  );
}
