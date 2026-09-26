import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/courses/robot-maze-dash.ts", "src/courses/skywing-sprint.ts", "src/courses/meteor-shield.ts", "src/courses/pixel-trail-challenge.ts", "src/courses/rescue-crew-commander.ts", "src/courses/star-defender-squadron.ts", "src/courses/beacon-bot.ts", "src/courses/servo-creature.ts", "src/courses/dance-rover.ts", "src/courses/obstacle-explorer.ts", "src/courses/rainbow-rescue-rover.ts"],
  dts: true,
  sourcemap: true,
  clean: true,
  format: ["esm", "cjs"],
  target: "es2022",
});
