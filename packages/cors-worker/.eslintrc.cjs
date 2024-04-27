const path = require("path");
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
	ignorePatterns: [],
	extends: [path.resolve(__dirname, "../../.eslintrc.cjs")],
	rules: {
		"import/no-extraneous-dependencies": [
			"error",
			{
				devDependencies: [],
				packageDir: [__dirname]
			}
		],
		"no-underscore-dangle": "off",
		"@typescript-eslint/no-explicit-any": "off"
	},
	overrides: [
		{
			files: ["src/**/*.ts"],
			excludedFiles: ["vitest.config.*", "**/*.{test,spec}.?(c|m)[jt]s?(x)"],
			parserOptions: {
				project: [path.resolve(__dirname, "tsconfig.json")]
			},
			settings: {
				"import/resolver": {
					typescript: {
						project: [path.resolve(__dirname, "tsconfig.json")]
					}
				}
			}
		},
		{
			files: ["dev/**/*.ts"],
			parserOptions: {
				project: [
					path.resolve(__dirname, "tsconfig.json"),
					path.resolve(__dirname, "dev/tsconfig.json")
				]
			},
			settings: {
				"import/resolver": {
					typescript: {
						project: [path.resolve(__dirname, "dev/tsconfig.json")]
					}
				}
			}
		},
		{
			files: [
				".eslintrc.*",
				"webpack.*.*",
				"dev/**/*",
				"scripts/**/*",
				"build.ts",
				"package.ts",
				"vitest.config.*",
				"**/*.{test,spec}.?(c|m)[jt]s?(x)"
			],
			rules: {
				"import/no-extraneous-dependencies": [
					"error",
					{
						devDependencies: true,
						packageDir: [__dirname, path.join(__dirname, "../..")]
					}
				]
			}
		}
	]
});
