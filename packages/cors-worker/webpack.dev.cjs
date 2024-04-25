const path = require("path");

const { defineConfig } = require("webpack-define-config");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = defineConfig({
	mode: "development",
	entry: "./index.ts",
	context: path.resolve(__dirname, "dev"),
	resolve: {
		extensions: [".js", ".ts"]
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: `index.html`,
			templateContent:
				"<html><head></head><body>Nothing to show here! Open DevTools.</body></html>",
			chunks: "all",
			chunksSortMode: "manual",
			minify: false
		})
	],
	module: {
		rules: [
			{
				test: /\.(js|ts)x?$/,
				exclude: /node_modules[\\/]/,
				use: [
					{
						loader: "babel-loader"
					}
				]
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules[\\/]/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: "tsconfig.dev.json"
						}
					}
				]
			},
			{
				test: /\.(js|ts)x?$/,
				include: path.resolve(__dirname, "dev"),
				enforce: "pre",
				use: [
					{
						loader: "source-map-loader"
					}
				]
			}
		]
	},
	devServer: {
		liveReload: true,
		open: false,
		hot: false
	}
});
