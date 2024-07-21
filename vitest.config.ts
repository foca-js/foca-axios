import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      include: ['src/**'],
      all: true,
      reporter: ['html', 'lcovonly', 'text-summary'],
    },
    include: ['test/**/*.test.ts'],
    maxConcurrency: 1,
    fileParallelism: false,
    logHeapUsage: true,
    environment: 'node',
    globals: true,
    watch: false,
  },
});
