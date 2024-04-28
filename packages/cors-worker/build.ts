/* eslint-disable no-console */

/*
  This script is heavily inspired by `built.ts` used in @kaze-style/react.
  https://github.com/taishinaritomi/kaze-style/blob/main/scripts/build.ts
  MIT License
  Copyright (c) 2022 Taishi Naritomi
*/

import cp from "child_process";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import {
	build as esbuild,
	type Plugin,
	type PluginBuild,
	type BuildOptions
} from "esbuild";
import * as glob from "glob";

const entryPoints = glob.sync("./src/**/*.{ts,js}", {
	ignore: [
		"./src/**/*.test.ts",
		"./src/mod.ts",
		"./src/middleware.ts",
		"./src/deno/**/*.ts"
	]
});

/*
  This plugin is inspired by the following.
  https://github.com/evanw/esbuild/issues/622#issuecomment-769462611
*/
const addExtension = (
	extension: string = ".js",
	fileExtension: string = ".ts"
): Plugin => ({
	name: "add-extension",
	setup(build: PluginBuild) {
		// eslint-disable-next-line consistent-return
		build.onResolve({ filter: /.*/ }, (args) => {
			if (args.importer) {
				const p = path.join(args.resolveDir, args.path);
				let tsPath = `${p}${fileExtension}`;

				let importPath = "";
				if (fs.existsSync(tsPath)) {
					importPath = args.path + extension;
				} else {
					tsPath = path.join(
						args.resolveDir,
						args.path,
						`index${fileExtension}`
					);
					if (fs.existsSync(tsPath)) {
						importPath = `${args.path}/index${extension}`;
					}
				}
				return { path: importPath, external: true };
			}
		});
	}
});

const commonOptions: BuildOptions = {
	entryPoints,
	logLevel: "info",
	platform: "node"
};

const cjsOptions: BuildOptions = {
	...commonOptions,
	outbase: "./src",
	outdir: "./dist/cjs",
	format: "cjs"
};

const esmOptions: BuildOptions = {
	...commonOptions,
	bundle: true,
	outbase: "./src",
	outdir: "./dist/esm",
	format: "esm",
	plugins: [addExtension(".js")]
};

Promise.all([esbuild(esmOptions), esbuild(cjsOptions)]).catch((error) => {
	console.error(error);
});

cp.execSync(`tsc --project tsconfig.dts.json`, { stdio: "inherit" });

const cjsPackageJson = { type: "commonjs" };

fse.writeJSONSync("./dist/cjs/package.json", cjsPackageJson, {
	encoding: "utf8"
});

fse.writeJSONSync("./dist/dts/package.json", cjsPackageJson, {
	encoding: "utf8"
});
