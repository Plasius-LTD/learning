import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/courses/robot-maze-dash.ts"],
  dts: true,
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  target: "es2022",
});
