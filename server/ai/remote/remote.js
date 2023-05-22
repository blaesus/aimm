const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('koa-router')();
const fs = require('fs');
const path = require('path');
const { exec, execSync} = require('child_process');

const SUB_DIR = "for_bench"
const downloadDir = `/workspace/stable-diffusion-webui/models/Stable-diffusion/${SUB_DIR}`;

function downloadFile(url, filepath) {
    console.info("Downloading url: ", url, " to ", filepath);
    const tempPath = `${filepath}.tmp`;
    const finalPath = filepath;
    // Use wget to download
    execSync(`wget --quiet -O ${tempPath} ${url}`)
    console.info("Downloaded to ", tempPath);
    fs.renameSync(tempPath, finalPath)
    console.info("Renamed to ", finalPath);
}

router.post('/api/download', async (ctx) => {
    const downloadList = ctx.request.body;
    console.info("parsed", downloadList)
    for (const item of downloadList) {
        const { downloadUrl, filename } = item;
        const path = `${downloadDir}/${filename}`;
        downloadFile(downloadUrl, path)
    }
    ctx.body = {ok: true};
})

router.post('/api/ready', async (ctx) => {
    const data = ctx.request.body;
    const readyStatus = data.map((filename) => {
        const filePath = path.join(downloadDir, filename);
        return {
            filename,
            ready: fs.existsSync(filePath),
        };
    });
    ctx.body = readyStatus;
})

router.post('/api/clear', async (ctx) => {
    const files = fs.readdirSync(downloadDir);
    files.forEach(file => {
        const filePath = path.join(downloadDir, file);
        fs.unlinkSync(filePath);
    });
    ctx.body = 'Directory cleared';
})

router.get('/api/hello', async (ctx) => {
    ctx.body = { ok: true };
})

const app = new Koa();
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(1234, () => {
    console.log('Server is running on http://localhost:1234');
});
