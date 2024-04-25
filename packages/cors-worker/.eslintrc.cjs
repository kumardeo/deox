const path = require("path");

/** @type {import("eslint-define-config").ESLintConfig} */
const eslintConfig = {
	ignorePatterns: [],
	extends: [path.resolve(__dirname, "../../.eslintrc.cjs")],
	settings: {
		"import/resolver": {
			typescript: {
				project: [path.resolve(__dirname, "tsconfig.json")]
			}
		}
	},
	rules: {
		"import/no-extraneous-dependencies": [
			"error",
			{
				devDependencies: [
					path.resolve(__dirname, "scripts/**/*"),
					path.resolve(__dirname, "vitest.config.*"),
					path.resolve(__dirname, "webpack.*.*"),
					path.resolve(__dirname, "**/*.{test,spec}.?(c|m)[jt]s?(x)")
				],
				includeInternal: false,
				includeTypes: false,
				packageDir: [__dirname, path.resolve(__dirname, "../..")]
			}
		],
		"no-underscore-dangle": "off",
		"@typescript-eslint/no-explicit-any": "off"
	},
	overrides: [
		{
			files: ["**/*.ts"],
			excludedFiles: ["vitest.config.*", "**/*.{test,spec}.?(c|m)[jt]s?(x)"],
			parserOptions: {
				project: [path.resolve(__dirname, "tsconfig.json")]
			}
		},
		{
			files: ["dev/**/*.ts"],
			parserOptions: {
				project: [path.resolve(__dirname, "tsconfig.dev.json")]
			},
			settings: {
				"import/resolver": {
					typescript: {
						project: [path.resolve(__dirname, "tsconfig.dev.json")]
					}
				}
			}
		}
	]
};

module.exports = eslintConfig;
