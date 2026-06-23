// Minimal ESLint flat config whose main job is to ENFORCE the tier boundary:
//   engine/  imports nothing from kit/ or game/
//   kit/     may use engine/, but not game/
//   game/    may use both (no restriction)
// (Run with `npm run lint`.)
export default [
  {
    files: ["src/engine/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/kit/**", "**/game/**"], message: "engine/ must not import from kit/ or game/ (keep the engine generic)." },
        ],
      }],
    },
  },
  {
    files: ["src/kit/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/game/**"], message: "kit/ must not import from game/ (the kit is content-agnostic; inject game data instead)." },
        ],
      }],
    },
  },
];
