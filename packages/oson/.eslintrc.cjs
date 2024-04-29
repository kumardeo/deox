// @ts-check

const path = require("path");
const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
	ignorePatterns: [],
	extends: [path.resolve(__dirname, "../../.eslintrc.cjs")],
	rules: {
		"import/no-extraneous-dependencies": ["error", { packageDir: [__dirname] }],
		"no-underscore-dangle": "off",
		"@typescript-eslint/no-explicit-any": "off"
	},
	overrides: [
		{
			files: ["src/**/*.ts"],
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
			files: [".eslintrc.cjs", "build.ts"],
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
