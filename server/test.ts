import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const sshCommand = ` ssh root@104.143.3.153 -p 10168 -i ~/.ssh/id_ed25519`
async function test() {
    const ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36`
    const tempPath = `/tmp/out.tmp`
    const url = `https://civitai.com/api/download/models/62833`
    const wget = `wget --user-agent="${ua}" --quiet -O "${tempPath}" "${url}"`
    execAsync(`${sshCommand} 'nohup ${wget} &'`)
        .then(result => console.info(result))
        .catch(console.error)
}

test();
