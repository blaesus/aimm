const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { exec } = require('child_process');

const downloadDir = path.join(__dirname, 'stable-diffusion-webui/models/Stable-diffusion/test');

const server = http.createServer((req, res) => {
    const { method, url } = req;
    const { pathname } = new URL(url, `http://${req.headers.host}`);

    if (method === 'POST' && pathname === '/api/download') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            try {
                const downloadList = JSON.parse(body);
                const downloadRecords = [];

                downloadList.forEach((item, index) => {
                    const { downloadUrl } = item;
                    const fileName = getFileName(downloadUrl);

                    downloadFile(downloadUrl, fileName, (error, savedFilePath) => {
                        if (error) {
                            downloadRecords.push({ downloadUrl, error: error.message });
                        } else {
                            downloadRecords.push({ downloadUrl, savedFilePath, fileName });
                        }

                        if (downloadRecords.length === downloadList.length) {
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(downloadRecords));
                        }
                    });
                });
            } catch (error) {
                res.statusCode = 400;
                res.end('Invalid JSON payload');
            }
        });
    } else if (method === 'GET' && pathname === '/api/ready') {
        const query = new URL(url, `http://${req.headers.host}`).searchParams;
        const fileName = query.get('file');
        const filePath = path.join(downloadDir, fileName);

        fs.access(filePath, fs.constants.F_OK, (error) => {
            res.setHeader('Content-Type', 'application/json');
            if (error) {
                res.end(JSON.stringify({ ready: false }));
            } else {
                res.end(JSON.stringify({ ready: true }));
            }
        });
    } else if (method === 'POST' && pathname === '/api/clear') {
        fs.readdir(downloadDir, (error, files) => {
            if (error) {
                res.statusCode = 500;
                res.end('Internal Server Error');
            } else {
                files.forEach(file => {
                    const filePath = path.join(downloadDir, file);
                    fs.unlinkSync(filePath);
                });
                res.end('Directory cleared');
            }
        });
    } else if (method === 'GET' && pathname === '/api/hello') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

function downloadFile(url, fileName, callback) {
    const command = `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3" -L -o "${path.join(downloadDir, fileName)}" "${url}"`;

    exec(command, (error) => {
        if (error) {
            callback(error);
        } else {
            callback(null, path.join(downloadDir, fileName));
        }
    });
}

function getFileName(url) {
    const parsedUrl = new URL(url);
    const contentDisposition = parsedUrl.searchParams.get('response-content-disposition');

    if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches) {
            return matches[1];
        }
    }

    return path.basename(parsedUrl.pathname);
}

server.listen(1234, () => {
    console.log('Server is running on http://localhost:1234');
});
