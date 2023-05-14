// For dev server

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:4000',
            changeOrigin: true,
        })
    );
    app.use(
        '/admin-api',
        createProxyMiddleware({
            target: 'http://localhost:4100',
            changeOrigin: true,
        })
    );
};
