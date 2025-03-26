import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/Extension.ts'],
  outDir: 'dist',
  format: ['cjs'],
  target: 'node18',
  sourcemap: true,
  clean: true,
  dts: false,
  external: ['vscode'],
})
