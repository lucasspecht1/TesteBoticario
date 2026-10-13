import type { PrismaService } from '../prisma/prisma.service';
import { DemoAutofillService } from './demo-autofill.service';
import type { DemoHistoryService } from './demo-history.service';

jest.mock('../env', () => ({
  env: { DEFAULT_STORE_ID: 'loja-demo', DEMO_AUTOFILL: false },
}));

/** Prisma falso em que a busca da última visita só termina quando o teste manda. */
function createSlowPrisma() {
  let finishLookup: () => void = () => undefined;
  const aggregate = jest.fn(
    () =>
      new Promise((resolve) => {
        finishLookup = () => resolve({ _max: { startedAt: null } });
      }),
  );
  const prisma = { visit: { aggregate } } as unknown as PrismaService;
  return { prisma, aggregate, finishLookup: () => finishLookup() };
}

describe('DemoAutofillService', () => {
  it('não começa uma rodada nova enquanto a anterior ainda está rodando', async () => {
    const { prisma, aggregate, finishLookup } = createSlowPrisma();
    const service = new DemoAutofillService(
      prisma,
      {} as unknown as DemoHistoryService,
    );

    service['startRun']();
    service['startRun']();
    finishLookup();
    await service.onApplicationShutdown();

    expect(aggregate).toHaveBeenCalledTimes(1);
  });

  it('com a flag desligada, não agenda nenhuma rodada', () => {
    const { prisma, aggregate } = createSlowPrisma();
    const service = new DemoAutofillService(
      prisma,
      {} as unknown as DemoHistoryService,
    );

    service.onApplicationBootstrap();

    expect(aggregate).not.toHaveBeenCalled();
  });
});
