const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: "development",

    entry: path.join(__dirname, "index.tsx"),

    output: {
        path: path.resolve(__dirname, "..", "..", "build", "web"),
        publicPath: "/",
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".css"],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: path.resolve(__dirname, "tsconfig.json"),
                }
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
        ]
    },

    devServer: {
        historyApiFallback: true,
        hot: true,
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
            }
        },
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
            ignoreOrder: false,
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "index.html"),
            filename: "index.html",
            inject: "body"
        }),
    ]
}
