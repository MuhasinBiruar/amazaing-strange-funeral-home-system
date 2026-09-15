import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    utils: 'src/utils.ts',
  },
  outDir: 'dist',
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  dts: {
    sourcemap: true,
  },
});
