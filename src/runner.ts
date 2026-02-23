import type {
  PrismaClientLike,
  Seeder,
  SeedRunnerConfig,
  SeedLogger,
  SeedRunRecord,
} from './types';
import { defaultLogger } from './logger';

/**
 * Seed runner - executes seeders with environment filtering and run tracking
 */
export class SeedRunner<TClient extends PrismaClientLike = PrismaClientLike> {
  private environment: string;
  private logger: SeedLogger;
  private trackRuns: boolean;
  private seedRunModel: string;

  constructor(
    private client: TClient,
    config: SeedRunnerConfig = {},
  ) {
    this.environment =
      config.environment ??
      process.env.SEED_ENV ??
      process.env.NODE_ENV ??
      'development';
    this.logger = config.logger ?? defaultLogger;
    this.trackRuns = config.trackRuns ?? true;
    this.seedRunModel = config.seedRunModel ?? 'seedRun';
  }

  /**
   * Run a list of seeders
   */
  async run(seeders: Seeder<TClient>[]): Promise<void> {
    this.logger.info(`Starting seed run in ${this.environment} environment...`);

    let executed = 0;
    let skipped = 0;

    for (const seeder of seeders) {
      // Check environment filter
      if (
        seeder.environments &&
        !seeder.environments.includes(this.environment)
      ) {
        this.logger.info(
          `⊘ Skipping ${seeder.name} (not allowed in ${this.environment})`,
        );
        skipped++;
        continue;
      }

      // Check if already executed
      if (this.trackRuns) {
        const existing = await this.getSeedRun(seeder.name);
        if (existing) {
          this.logger.info(`⊘ Skipping ${seeder.name} (already applied)`);
          skipped++;
          continue;
        }
      }

      // Execute seeder
      try {
        this.logger.info(`→ Running ${seeder.name}...`);
        await seeder.run(this.client);

        // Record execution
        if (this.trackRuns) {
          await this.recordSeedRun(seeder.name);
        }

        this.logger.info(`✓ Completed ${seeder.name}`);
        executed++;
      } catch (error) {
        this.logger.error(`✗ Failed ${seeder.name}:`, error);
        throw error;
      }
    }

    this.logger.info(
      `Seed run complete: ${executed} executed, ${skipped} skipped`,
    );
  }

  /**
   * Get seed run record if it exists
   */
  private async getSeedRun(name: string): Promise<SeedRunRecord | null> {
    try {
      const model = this.client[this.seedRunModel];
      if (!model || typeof model.findUnique !== 'function') {
        this.logger.warn(
          `SeedRun model "${this.seedRunModel}" not found - skipping tracking`,
        );
        return null;
      }

      return await model.findUnique({
        where: { name },
      });
    } catch (error) {
      this.logger.warn('Failed to check seed run history:', error);
      return null;
    }
  }

  /**
   * Record a seed run
   */
  private async recordSeedRun(name: string): Promise<void> {
    try {
      const model = this.client[this.seedRunModel];
      if (!model || typeof model.create !== 'function') {
        return;
      }

      await model.create({
        data: {
          name,
          environment: this.environment,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to record seed run:', error);
    }
  }
}

/**
 * Convenience function to run seeders
 */
export async function runSeeders<
  TClient extends PrismaClientLike = PrismaClientLike,
>(
  client: TClient,
  seeders: Seeder<TClient>[],
  config?: SeedRunnerConfig,
): Promise<void> {
  const runner = new SeedRunner(client, config);
  await runner.run(seeders);
}
