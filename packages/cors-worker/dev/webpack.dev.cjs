const path = require("path");

const { defineConfig } = require("webpack-define-config");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = defineConfig({
	mode: "development",
	entry: "./index.ts",
	context: __dirname,
	resolve: {
		extensions: [".js", ".ts"]
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "./index.html",
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
							configFile: "tsconfig.json"
						}
					}
				]
			},
			{
				test: /\.(js|ts)x?$/,
				include: __dirname,
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
		open: true
	}
});
