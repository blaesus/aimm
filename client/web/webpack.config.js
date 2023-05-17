const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

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
                loader: "babel-loader",
                options: {
                    exclude: /node_modules/,
                    plugins: [
                        "react-refresh/babel"
                    ]
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
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
            },
            "/admin-api": {
                target: "http://localhost:4100",
                changeOrigin: true,
            }
        },
    },

    plugins: [
        new ReactRefreshWebpackPlugin(),
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
