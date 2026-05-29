import {Injectable, Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';

/**
 * Cap the connection pool so a long dev session / hot-reloads don't exhaust
 * Neon's connection limit. Auto-enables pgbouncer mode on the pooled endpoint.
 */
function withPoolParams(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const pooled = u.host.includes('pooler');
    if (!u.searchParams.has('connection_limit')) {
      u.searchParams.set('connection_limit', pooled ? '10' : '5');
    }
    if (!u.searchParams.has('pool_timeout')) {
      u.searchParams.set('pool_timeout', '20');
    }
    if (pooled && !u.searchParams.has('pgbouncer')) {
      u.searchParams.set('pgbouncer', 'true');
    }
    return u.toString();
  } catch {
    return url;
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = withPoolParams(process.env.DATABASE_URL);
    super(url ? {datasources: {db: {url}}} : undefined);
  }

  async onModuleInit() {
    // Neon free-tier compute auto-suspends when idle; the first connection
    // while it wakes up can exceed the default timeout. Retry a few times.
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        const delayMs = attempt * 2000;
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxAttempts} failed; retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
