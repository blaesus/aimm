import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer


class RequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        if self.path == '/api/hello':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_error(404)

    def do_POST(self):
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            urls = json.loads(body.decode('utf-8'))

            if self.path == '/api/download':
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()

                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
                for url in urls:
                    download_url = url['downloadUrl']
                    file_name = os.path.basename(download_url)
                    file_path = os.path.join('stable-diffusion-webui', 'models', 'Stable-diffusion', 'test', file_name)

                    try:
                        req = urllib.request.Request(download_url, headers=headers)
                        with urllib.request.urlopen(req) as response, open(file_path, 'wb') as out_file:
                            data = response.read()
                            out_file.write(data)
                    except Exception as e:
                        self.send_error(500, f"Failed to download {download_url}: {e}")
                        return

                self.wfile.write(b'Download completed successfully.')

            elif self.path == '/api/delete':
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()

                for url in urls:
                    file_name = os.path.basename(url['downloadUrl'])
                    file_path = os.path.join('stable-diffusion-webui', 'models', 'Stable-diffusion', 'test', file_name)

                    try:
                        os.remove(file_path)
                    except Exception as e:
                        self.send_error(500, f"Failed to delete {file_path}: {e}")
                        return

                self.wfile.write(b'Delete completed successfully.')

            else:
                self.send_error(404)


def run():
    server_address = ('', 1234)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Server running on {server_address[0]}:{server_address[1]}")
    httpd.serve_forever()


if __name__ == '__main__':
    run()
