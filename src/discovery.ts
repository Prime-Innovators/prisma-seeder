import * as fs from 'fs';
import * as path from 'path';
import type { Seeder, PrismaClientLike } from './types';

/**
 * Discover and load seeders from a directory
 */
export async function discoverSeeders<
  TClient extends PrismaClientLike = PrismaClientLike,
>(seedersDir: string, pattern: string = '*.ts'): Promise<Seeder<TClient>[]> {
  const seeders: Seeder<TClient>[] = [];

  // Check if directory exists
  if (!fs.existsSync(seedersDir)) {
    throw new Error(`Seeders directory not found: ${seedersDir}`);
  }

  // Read all files in directory
  const files = fs.readdirSync(seedersDir);

  // Convert glob pattern to regex
  const regex = globToRegex(pattern);

  // Filter and sort files
  const seederFiles = files
    .filter((file) => regex.test(file))
    .sort((a, b) => naturalSort(a, b));

  // Load each seeder
  for (const file of seederFiles) {
    const filePath = path.join(seedersDir, file);
    try {
      const module = await import(filePath);

      // Try to extract seeder from module
      const seeder = extractSeeder(module, file);

      if (seeder) {
        seeders.push(seeder);
      }
    } catch (error) {
      throw new Error(
        `Failed to load seeder from ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return seeders;
}

/**
 * Extract seeder from a module
 * Supports both default exports and named exports
 */
function extractSeeder<TClient extends PrismaClientLike = PrismaClientLike>(
  module: any,
  filename: string,
): Seeder<TClient> | null {
  // Try default export first
  if (module.default && isSeeder(module.default)) {
    return module.default;
  }

  // Try to find a named export that looks like a seeder
  for (const key of Object.keys(module)) {
    if (isSeeder(module[key])) {
      return module[key];
    }
  }

  throw new Error(
    `No valid seeder found in ${filename}. Expected an object with 'name' and 'run' properties.`,
  );
}

/**
 * Check if an object is a valid seeder
 */
function isSeeder(obj: any): obj is Seeder {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.run === 'function'
  );
}

/**
 * Convert glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
  const escapedPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escapedPattern}$`);
}

/**
 * Natural sort for filenames (handles numeric prefixes correctly)
 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
