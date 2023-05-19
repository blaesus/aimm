import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

local_base = 'stable-diffusion-webui/models/Stable-diffusion/test'

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/hello':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
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
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
            download_records = []
            for url in urls:
                download_url = url['downloadUrl']
                file_name = os.path.basename(download_url)
                file_path = os.path.join(local_base, file_name)

                try:
                    req = urllib.request.Request(download_url, headers=headers)
                    with urllib.request.urlopen(req) as response:
                        content_disposition = response.headers.get('Content-Disposition')
                        if content_disposition:
                            file_name = content_disposition.split('filename=')[1].strip('"')
                            file_path = os.path.join(local_base, file_name)

                        with open(file_path, 'wb') as out_file:
                            data = response.read()
                            out_file.write(data)

                    download_record = {
                        'downloadUrl': download_url,
                        'localUrl': f'http://{self.headers["Host"]}/{file_path}',
                        'fileName': file_name,
                        'fileSize': os.path.getsize(file_path)
                    }
                    download_records.append(download_record)
                except Exception as e:
                    download_record = {
                        'downloadUrl': download_url,
                        'error': str(e)
                    }
                    download_records.append(download_record)

            self.wfile.write(json.dumps(download_records).encode('utf-8'))

        elif self.path == '/api/clear':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            for file_name in os.listdir(local_base):
                file_path = os.path.join(local_base, file_name)
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except Exception as e:
                    self.send_error(500, f"Failed to delete {file_path}: {e}")
                    return

            self.wfile.write(b'Clear completed successfully.')

        else:
            self.send_error(404)


def run():
    server_address = ('', 1234)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Server running on {server_address[0]}:{server_address[1]}")
    httpd.serve_forever()


if __name__ == '__main__':
    run()
