const { build } = require("esbuild");
const { copy } = require("esbuild-plugin-copy");

const baseConfig = {
    bundle: true,
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
    ...baseConfig,
    platform: "node",
    mainFields: ["module", "main"],
    format: "cjs",
    entryPoints: ["./src/extension.ts"],
    outfile: "./out/extension.js",
    external: ["vscode"],
};

const watchConfig = {
    watch: {
        onRebuild(error, result) {
            console.log("[watch] build started");
            if (error) {
                error.errors.forEach(error =>
                    console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
                );
            } else {
                console.log("[watch] build finished");
            }
        }
    }
};

const webviewConfig = {
    ...baseConfig,
    target: "es2020",
    format: "esm",
    entryPoints: ["./src/webview/main.ts"],
    outfile: "./out/webview.js",
    plugins: [
        // Copy webview css files to `out` directory unaltered
        copy({
          resolveFrom: "cwd",
          assets: {
            from: ["./src/webview/*.css"],
            to: ["./out"],
          },
        }),
        copy({
            resolveFrom: "cwd",
            assets: {
              from: ["./src/protos/*.proto"],
              to: ["./out"],
            },
          }),
    ],
};

(async () => {
    const args = process.argv.slice(2);
    try {
        if (args.includes("--watch")) {
            // Build and watch source code
            console.log("[watch] build started");
            await build({
                ...extensionConfig,
                ...watchConfig,
            });
            await build({
                ...webviewConfig,
                ...watchConfig,
            });
            console.log("[watch] build finished");
        } else {
            // Build source code
            await build(extensionConfig);
            await build(webviewConfig);
            console.log("build complete");
        }
    } catch (err) {
        process.stderr.write(err.stderr);
        process.exit(1);
    }
})();