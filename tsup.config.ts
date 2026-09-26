import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/courses/robot-maze-dash.ts", "src/courses/skywing-sprint.ts", "src/courses/meteor-shield.ts", "src/courses/pixel-trail-challenge.ts", "src/courses/rescue-crew-commander.ts", "src/courses/star-defender-squadron.ts"],
  dts: true,
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  target: "es2022",
});
