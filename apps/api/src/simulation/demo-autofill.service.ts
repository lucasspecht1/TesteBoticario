import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { DAY_MS, MINUTE_MS } from '../common/time';
import { env } from '../env';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEMO_AVG_VISITS_PER_DAY,
  listFinishedVisits,
  splitReturningCustomers,
} from './demo-history';
import { DemoHistoryService } from './demo-history.service';
import {
  createSeededRng,
  generateVisits,
  type GeneratedVisit,
} from './generator';

/** Intervalo entre as rodadas do preenchimento. */
const AUTOFILL_INTERVAL_MS = 5 * MINUTE_MS;
/** Os clientes que voltam são sorteados entre os aparelhos vistos nesse prazo. */
const RETURNING_CUSTOMER_WINDOW_DAYS = 90;

/** O que uma rodada do preenchimento fez. */
export type AutofillResult = { createdVisits: number; closedVisits: number };

/**
 * Com `DEMO_AUTOFILL`, gera a cada `AUTOFILL_INTERVAL_MS` as visitas da loja demo que faltam desde a
 * última até agora, para a demonstração publicada não parar no dia do seed.
 */
// trade-off: grava direto no banco, como o seed, sem passar pela regra de reconexão da ingestão
@Injectable()
export class DemoAutofillService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DemoAutofillService.name);
  private timer?: NodeJS.Timeout;
  private ongoingRun?: Promise<unknown>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly demoHistory: DemoHistoryService,
  ) {}

  onApplicationBootstrap(): void {
    if (!env.DEMO_AUTOFILL) return;
    this.startRun();
    this.timer = setInterval(() => this.startRun(), AUTOFILL_INTERVAL_MS);
  }

  /** Espera a rodada em andamento terminar antes de a API sair. */
  async onApplicationShutdown(): Promise<void> {
    clearInterval(this.timer);
    await this.ongoingRun;
  }

  /** Uma rodada: encerra as visitas abertas cuja permanência já passou e gera as que faltam até `now`. */
  async run(now = new Date()): Promise<AutofillResult> {
    const storeId = env.DEFAULT_STORE_ID;
    const lastVisitStart = await this.findLastVisitStart(storeId);
    // sem histórico, quem cria a loja demo é o seed
    if (!lastVisitStart) return { createdVisits: 0, closedVisits: 0 };

    const closedVisits = await this.closeFinishedVisits(storeId, now);
    const missingVisits = generateVisits({
      from: lastVisitStart,
      to: now,
      avgPerDay: DEMO_AVG_VISITS_PER_DAY,
      seed: lastVisitStart.getTime(),
    });
    if (missingVisits.length > 0)
      await this.insertMissingVisits(storeId, missingVisits, now);
    return { createdVisits: missingVisits.length, closedVisits };
  }

  /** Uma rodada por vez, fora das requisições: a falha vai para o log e a próxima rodada tenta de novo. */
  private startRun(): void {
    this.ongoingRun ??= this.run()
      .catch((error: unknown) =>
        this.logger.error(error instanceof Error ? error.stack : error),
      )
      .finally(() => {
        this.ongoingRun = undefined;
      });
  }

  private async findLastVisitStart(storeId: string): Promise<Date | null> {
    const { _max } = await this.prisma.visit.aggregate({
      where: { storeId },
      _max: { startedAt: true },
    });
    return _max.startedAt;
  }

  private async insertMissingVisits(
    storeId: string,
    visits: GeneratedVisit[],
    now: Date,
  ): Promise<void> {
    const knownDevices = await this.prisma.device.findMany({
      where: {
        storeId,
        lastSeenAt: {
          gte: new Date(
            now.getTime() - RETURNING_CUSTOMER_WINDOW_DAYS * DAY_MS,
          ),
        },
      },
      select: { id: true },
    });
    const { returningVisits, newCustomerVisits } = splitReturningCustomers(
      visits,
      knownDevices.map((device) => device.id),
      createSeededRng(now.getTime()),
    );
    // trade-off: as duas gravações não estão numa transação; uma queda entre elas deixa sem as visitas
    // de quem volta daquela janela (sem duplicar nada, porque a próxima rodada parte da última visita)
    await this.demoHistory.insertNewCustomerVisits(storeId, newCustomerVisits);
    await this.demoHistory.insertReturningVisits(storeId, returningVisits);
  }

  private async closeFinishedVisits(
    storeId: string,
    now: Date,
  ): Promise<number> {
    const openVisits = await this.prisma.visit.findMany({
      where: { storeId, endedAt: null },
      select: { id: true, deviceId: true, startedAt: true },
    });
    const finishedVisits = listFinishedVisits(openVisits, now);
    const updates = await this.prisma.$transaction(
      finishedVisits.map(({ id, endedAt }) =>
        // só se continuar aberta: a ingestão pode ter registrado a saída real nesse meio-tempo
        this.prisma.visit.updateMany({
          where: { id, endedAt: null },
          data: { endedAt },
        }),
      ),
    );
    const closedVisits = finishedVisits.filter(
      (_, index) => updates[index].count > 0,
    );
    await this.demoHistory.advanceLastSeen(closedVisits);
    return closedVisits.length;
  }
}
