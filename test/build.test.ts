import { rmSync } from 'fs';
import { execSync, exec } from 'child_process';
import { beforeEach, expect, test } from 'vitest';
import { compare } from 'compare-versions';

function testFile(filename: string, expectCode: number) {
  return new Promise((resolve) => {
    const child = exec(`node ${filename}`);
    child.on('exit', (code) => {
      try {
        expect(code).toBe(expectCode);
      } finally {
        resolve(code);
      }
    });
  });
}

beforeEach(() => {
  execSync('pnpm tsup');
}, 10000);

test('ESM with type=module', async () => {
  await testFile('dist/esm/index.js', 0);
});

test.skipIf(compare(process.version, '22.7.0', '>='))(
  'ESM with type=commonjs',
  async () => {
    rmSync('dist/esm/package.json');
    await testFile('dist/esm/index.js', 1);
  },
);

test('pure commonjs', async () => {
  await testFile('dist/index.js', 0);
});
