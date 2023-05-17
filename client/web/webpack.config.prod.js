const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    mode: 'production',

    entry: path.join(__dirname, 'index.tsx'),

    output: {
        path: path.resolve('build', 'web'),
        filename: '[name].[contenthash].js',
        publicPath: '/',
    },

    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin({}),
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: /@license/i,
                    },
                },
                extractComments: false,
            }),
        ],
        splitChunks: {
            cacheGroups: {
                react: {
                    name: 'react',
                    chunks: 'all',
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                },
            },
        },
        moduleIds: "deterministic",
        chunkIds: 'named',
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css'],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "babel-loader",
                options: {
                    exclude: /node_modules/,
                    plugins: [
                        "react-refresh/babel"
                    ],
                    "presets": [
                        "@babel/preset-react",
                        "@babel/preset-typescript"
                    ]
                }
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
        ],
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].css',
            ignoreOrder: false,
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'index.html'),
            filename: 'index.html',
            inject: 'body',
            inlineSource: '.css$',
        }),
    ],

}
