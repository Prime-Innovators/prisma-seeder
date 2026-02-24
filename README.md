# @primeinnovators/prisma-seeder

[![npm version](https://badge.fury.io/js/@primeinnovators%2Fprisma-seeder.svg)](https://badge.fury.io/js/@primeinnovators%2Fprisma-seeder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A scalable, environment-aware seeding framework for Prisma that treats seeds like migrations. It provides automatic discovery of seeders, version tracking, and environment-specific execution, making it easy to manage database seeding in development, staging, and production environments.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Auto-discovery**: Automatically loads seeders from a directory—no manual imports required.
- **Config-based**: Simple `seed.config.ts` file—no boilerplate runner code needed.
- **Versioned seeders**: Each seeder has a unique identifier (e.g., `001_roles`).
- **Environment filtering**: Control which seeders run in dev, staging, or prod.
- **Idempotent by design**: Seeders are tracked and won't run twice.
- **Type-safe**: Full TypeScript support with your generated Prisma client.
- **Zero coupling**: Works with any Prisma project; no schema modifications required (tracking is optional).

## Installation

Install the package via your preferred package manager:

```bash
bun add @primeinnovators/prisma-seeder
# or
npm install @primeinnovators/prisma-seeder
# or
yarn add @primeinnovators/prisma-seeder
# or
pnpm add @primeinnovators/prisma-seeder
```

## Quick Start

The recommended approach uses a configuration file for auto-discovery and minimal setup.

### 1. Add SeedRun Model (Optional, for Tracking)

To enable automatic tracking of executed seeders, add the following model to your `schema.prisma`:

```prisma
model SeedRun {
  id          String   @id @default(cuid())
  name        String   @unique
  environment String?
  appliedAt   DateTime @default(now())
}
```

Then, run `npx prisma migrate dev` to apply the changes and create the table.

### 2. Create seed.config.ts

Create a `seed.config.ts` file in your project root (or preferred location):

```typescript
// seed.config.ts
import { defineSeedConfig } from "@primeinnovators/prisma-seeder";
import { prisma } from "./src/client"; // Adjust to your Prisma client import

export default defineSeedConfig({
  client: prisma,
  seedersPath: "./prisma/seeds",
  seedersPattern: "*.ts",
  config: {
    trackRuns: true,
  },
});
```

### 3. Create Seeders Directory

Create a directory for your seeders (e.g., `prisma/seeds`). Each `.ts` file will be auto-discovered and executed in alphabetical order. Here's an example:

```typescript
// prisma/seeds/001_roles.ts
import type { PrismaClient } from "@prisma/client";
import type { Seeder } from "@primeinnovators/prisma-seeder";

export const rolesSeeder: Seeder<PrismaClient> = {
  name: "001_roles",
  environments: ["development", "staging", "production"],
  async run(prisma) {
    await prisma.role.upsert({
      where: { name: "Admin" },
      update: {},
      create: { name: "Admin" },
    });
  },
};
```

```typescript
// prisma/seeds/002_users.ts
import type { PrismaClient } from "@prisma/client";
import type { Seeder } from "@primeinnovators/prisma-seeder";

export const usersSeeder: Seeder<PrismaClient> = {
  name: "002_demo_users",
  environments: ["development"], // Dev only
  async run(prisma) {
    await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: { email: "demo@example.com", name: "Demo User" },
    });
  },
};
```

### 4. Configure Prisma Seed Command

Update your `package.json` to use the `prisma-seeder` CLI directly:

```json
{
  "prisma": {
    "seed": "prisma-seeder"
  }
}
```

### 5. Run the Seeds

Execute the seeding process:

```bash
npx prisma db seed
```

That's it! When adding new seeders, simply place them in your seeders directory—they will be auto-discovered without updating any configuration.

## Manual Setup

For projects preferring explicit control over seeders without auto-discovery, you can import and run seeders manually:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { SeedRunner } from "@primeinnovators/prisma-seeder";
import { rolesSeeder } from "./seeders/001_roles";
import { usersSeeder } from "./seeders/002_users";

const prisma = new PrismaClient();

const seeders = [rolesSeeder, usersSeeder];

async function main() {
  const runner = new SeedRunner(prisma);
  await runner.run(seeders);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
```

Then configure in `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

This approach gives you full control over which seeders run, but requires manual imports.

## Configuration

Customize the `SeedRunner` with options:

```typescript
import { SeedRunner } from "@primeinnovators/prisma-seeder";

const runner = new SeedRunner(prisma, {
  // Override environment detection
  environment: "production",

  // Custom logger
  logger: {
    info: (msg) => console.log(msg),
    warn: (msg) => console.warn(msg),
    error: (msg) => console.error(msg),
  },

  // Disable run tracking (if no SeedRun model)
  trackRuns: false,

  // Custom seed run model name
  seedRunModel: "customSeedRun",
});

await runner.run(seeders);
```

## Environment Variables

- `SEED_ENV`: Overrides the environment (takes precedence over `NODE_ENV`).
- `NODE_ENV`: Fallback for environment detection (defaults to `'development'`).

## Best Practices

### Naming Convention

Use numeric prefixes for consistent ordering:

- `001_roles.ts` - Foundational data (runs in all environments).
- `010_plans.ts` - Core business data (staging/prod).
- `900_demo_users.ts` - Demo data (dev only).

### Idempotency

Ensure seeders are idempotent using operations like `upsert` or `connectOrCreate`:

```typescript
// Good: Idempotent
await prisma.role.upsert({
  where: { name: "Admin" },
  update: {},
  create: { name: "Admin" },
});

// Bad: Fails on re-run
await prisma.role.create({
  data: { name: "Admin" },
});
```

### Environment Filtering

Specify environments explicitly:

```typescript
export const demoDataSeeder: Seeder = {
  name: "900_demo_data",
  environments: ["development"], // Dev only
  async run(prisma) {
    // Create test data
  },
};

export const plansSeeder: Seeder = {
  name: "010_plans",
  environments: ["staging", "production"], // Exclude dev
  async run(prisma) {
    // Create production data
  },
};
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

For bugs or feature requests, open an issue on the [GitHub repository](https://github.com/Prime-Innovators/prisma-seeder).

## License

MIT License. See [LICENSE](LICENSE) for details.
