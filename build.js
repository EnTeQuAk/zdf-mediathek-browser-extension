import { context, build } from "esbuild";
import { cpSync } from "node:fs";

const watch = process.argv.includes("--watch");

const config = {
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  outfile: "dist/content.js",
  target: ["chrome120", "firefox115"],
  minify: !watch,
  sourcemap: watch ? "inline" : false,
};

function copyStatic() {
  cpSync("manifest.json", "dist/manifest.json");
  cpSync("content.css", "dist/content.css");
  cpSync("icons", "dist/icons", { recursive: true });
}

if (watch) {
  const ctx = await context({
    ...config,
    plugins: [
      {
        name: "copy-static",
        setup(build) {
          build.onEnd(() => {
            copyStatic();
            console.log("[build] Rebuilt");
          });
        },
      },
    ],
  });
  await ctx.watch();
  console.log("[build] Watching for changes...");
} else {
  await build(config);
  copyStatic();
  console.log("[build] Done");
}
