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
        req.on('end', () => {
            try {
                const downloadList = JSON.parse(body);
                const downloadRecords = [];

                downloadList.forEach((item, index) => {
                    const { downloadUrl, filename } = item;
                    downloadFile(downloadUrl, filename)
                    downloadRecords.push({
                        downloadUrl,
                        filename,
                    })
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(downloadRecords));
            } catch (error) {
                res.statusCode = 400;
                res.end('Invalid JSON payload');
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

function downloadFile(url, fileName) {
    const tempFileName = fileName + '.part';
    const tempFilePath = path.join(downloadDir, tempFileName);
    const finalFilePath = path.join(downloadDir, fileName);
    const downloadCommand = `
        wget --quiet --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3" -O "${tempFilePath}" "${url}" && mv "${tempFilePath}" "${finalFilePath}"`

    exec(downloadCommand, (error) => {
        if (error) {
            console.error(error);
        }
        else {
            console.log(`Downloaded ${fileName} to ${finalFilePath}`)
        }
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
