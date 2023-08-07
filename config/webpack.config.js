const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');



const config = {
	entry: {
		main: [
			'./assets/src/js/index.js',
			'./assets/src/sass/style.sass',
		]
	},
	output: {
		path: path.resolve('./assets/dist/compiled'),
		filename: '[name].js'
	},
	resolve: {
		alias: {
			'@components': path.resolve(__dirname, '../assets/src/js/components/'),
			'@simple': path.resolve(__dirname, '../assets/src/js/simple/')
		}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
        options: { presets: ['@babel/env','@babel/preset-react'] },
			},
			{
				test: /\.css$/,
				use: [
					{ loader: MiniCssExtractPlugin.loader },
					{ loader: 'css-loader' }
				]
			},
			{
				test: /\.s[ac]ss$/,
				use: [
					{ loader: MiniCssExtractPlugin.loader },
					{ loader: 'css-loader' },
					{ loader: 'sass-loader',
						options: {
							implementation: require("sass")
						}
					}
				]
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin()
	]
};

module.exports = config;
