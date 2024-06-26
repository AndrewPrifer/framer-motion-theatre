import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["lib/main.ts", "lib/dev.ts"],
  sourcemap: true,
  clean: true,
  dts: true,
  minify: true,
  format: ["esm", "cjs"],
});
