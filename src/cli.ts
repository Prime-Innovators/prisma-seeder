#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

async function main() {
  try {
    // Look for seed.config.ts in current directory
    const configPath = path.join(process.cwd(), 'seed.config.ts');

    if (!fs.existsSync(configPath)) {
      console.error('Error: seed.config.ts not found in current directory');
      process.exit(1);
    }

    // Import the config
    const configUrl = pathToFileURL(configPath).href;
    const configModule = await import(configUrl);
    const config = configModule.default || configModule.config;

    if (!config) {
      console.error(
        'Error: seed.config.ts must export a default config or named "config" export',
      );
      process.exit(1);
    }

    // Import discovery and runner
    const { discoverSeeders } = await import('./discovery');
    const { SeedRunner } = await import('./runner');

    // Resolve seeders directory
    const configDir = path.dirname(configPath);
    const seedersDir = path.resolve(
      configDir,
      config.seedersPath || './seeders',
    );

    // Discover seeders
    const seeders = await discoverSeeders(
      seedersDir,
      config.seedersPattern || '*.ts',
    );

    // Run seeders
    const runner = new SeedRunner(config.client, config.config);
    await runner.run(seeders);
  } catch (error) {
    console.error(
      'Seeding failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
