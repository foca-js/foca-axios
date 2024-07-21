import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      include: ['src/**'],
      exclude: ['src/bin.ts'],
      all: true,
      reporter: ['html', 'lcovonly', 'text-summary'],
    },
    maxConcurrency: 1,
    fileParallelism: false,
    logHeapUsage: true,
    environment: 'node',
    globals: true,
    watch: false,
  },
});
