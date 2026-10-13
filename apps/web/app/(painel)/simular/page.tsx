import { RECENT_WINDOW_HOURS, SIMULATE_MAX_VISITS } from '@wifi/shared';
import { Card } from '@/components/ui/card';
import { PageIntro } from '@/components/ui/page-intro';
import { API_DOCS_URL } from '@/lib/api';
import { getRiseStyle } from '@/lib/rise';
import { ManualRegistration } from './manual-registration';
import { RULE_STEPS, RULE_TEST_OFFSET_HOURS } from './rule-steps';
import { SimulateForm } from './simulate-form';
import { VisitRuleDemo } from './visit-rule-demo';

const SIMULATE_RISE_INDEX = 1;
const RULE_DEMO_RISE_INDEX = 2;

/** Tela para gerar dados de teste: movimento aleatório, demonstração da regra de visita e cadastro manual. */
export default function SimulatePage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageIntro title="Simular dados">
        Ainda sem integração com o Wi-Fi real: aqui você gera conexões com as mesmas regras que o
        portal do Wi-Fi usaria.
      </PageIntro>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card
          className="rise"
          style={getRiseStyle(SIMULATE_RISE_INDEX)}
          title="Gerar movimento"
          subtitle={`Cria visitas aleatórias nas últimas ${RECENT_WINDOW_HOURS} horas.`}
        >
          <SimulateForm maxVisits={SIMULATE_MAX_VISITS} />
        </Card>
        <Card
          className="rise"
          style={getRiseStyle(RULE_DEMO_RISE_INDEX)}
          title="Testar a regra de visita"
          subtitle="Três conexões do mesmo aparelho, com a resposta real da API."
        >
          <VisitRuleDemo steps={RULE_STEPS} testOffsetHours={RULE_TEST_OFFSET_HOURS} />
        </Card>
      </div>
      <ManualRegistration docsUrl={API_DOCS_URL} />
    </div>
  );
}
