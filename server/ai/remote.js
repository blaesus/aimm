const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { exec } = require('child_process');


const SUB_DIR = "for_bench"

const downloadDir = path.join(__dirname, `stable-diffusion-webui/models/Stable-diffusion/${SUB_DIR}`);

const server = http.createServer((req, res) => {
    const { method, url } = req;
    const { pathname } = new URL(url, `http://${req.headers.host}`);

    console.info("Request: ", method, pathname);

    if (method === 'POST' && pathname === '/api/download') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', async () => {
            try {
                const downloadList = JSON.parse(body);

                for (const item of downloadList) {
                    const { downloadUrl, filename } = item;
                    const path = `${downloadDir}/${filename}`;
                    downloadFile(downloadUrl, path)
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ok: true}));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({
                    ok: false,
                    reason: 'Invalid JSON payload',
                    data: body
                }));
            }
        });
    } else if (method === 'POST' && pathname === '/api/ready') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const readyStatus = data.map((filename) => {
                    const filePath = path.join(downloadDir, filename);
                    return {
                        filename,
                        ready: fs.existsSync(filePath),
                    };
                });
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(readyStatus));
            } catch (error) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Invalid JSON data'}));
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

function downloadFile(url, filepath) {
    const file = fs.createWriteStream(filepath);
    const request = http.get(url, function(response) {
        response.pipe(file);

        // after download completed close filestream
        file.on("finish", () => {
            file.close();
            console.log("Download Completed");
        });
    });
}

function getFileName(url) {
    const contentDisposition = headers['content-disposition'];
    if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches) {
            return matches[1];
        }
    }

    return path.basename(new URL(url).pathname);
}

server.listen(1234, () => {
    console.log('Server is running on http://localhost:1234');
});
