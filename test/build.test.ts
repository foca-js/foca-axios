import { rmSync } from 'fs';
import { execSync, exec } from 'child_process';

test('esm support', async () => {
  execSync('yarn tsup');

  // esm with type=module
  await new Promise((resolve) => {
    const child = exec('node dist/esm/index.js');
    child.on('exit', (code) => {
      expect(code).toBe(0);
      resolve(code);
    });
  });

  rmSync('dist/esm/package.json');

  // esm without type=module
  await new Promise((resolve) => {
    const child = exec('node dist/esm/index.js');
    child.on('exit', (code) => {
      expect(code).toBe(1);
      resolve(code);
    });
  });

  // cjs
  await new Promise((resolve) => {
    const child = exec('node dist/index.js');
    child.on('exit', (code) => {
      expect(code).toBe(0);
      resolve(code);
    });
  });
});
