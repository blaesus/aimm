import os
import json
import urllib.request
from urllib.parse import urlparse
from http.server import BaseHTTPRequestHandler, HTTPServer


class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/download':
            self.handle_download_request()
        elif self.path == '/api/ready':
            self.handle_ready_request()
        elif self.path == '/api/clear':
            self.handle_clear_request()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not found')

    def handle_download_request(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        urls = json.loads(post_data)

        download_records = []
        for url_data in urls:
            download_url = url_data['downloadUrl']
            local_filename = self.download_file(download_url)
            download_record = {
                'downloadUrl': download_url,
                'localUrl': self.get_local_url(local_filename),
                'filename': local_filename
            }
            download_records.append(download_record)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(download_records).encode('utf-8'))

    def download_file(self, url):
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
        req = urllib.request.Request(url, headers=headers)
        response = urllib.request.urlopen(req)
        content_disposition = response.headers.get('Content-Disposition')
        if content_disposition:
            filename = self.extract_filename(content_disposition)
        else:
            filename = self.guess_filename(url)
        local_filename = os.path.join('stable-diffusion-webui/models/Stable-diffusion/test/', filename)
        with open(local_filename, 'wb') as f:
            f.write(response.read())
        return local_filename

    def extract_filename(self, content_disposition):
        filename = content_disposition.split('filename=')[1].strip('\"\'')
        return filename

    def guess_filename(self, url):
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        return filename

    def get_local_url(self, local_filename):
        base_url = 'http://localhost:1234/'
        local_url = os.path.join(base_url, local_filename)
        return local_url

    def handle_ready_request(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        file_to_check = json.loads(post_data)['file']

        local_filename = os.path.join('stable-diffusion-webui/models/Stable-diffusion/test/', file_to_check)
        if os.path.exists(local_filename):
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File ready')
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File not found')

    def handle_clear_request(self):
        file_dir = 'stable-diffusion-webui/models/Stable-diffusion/test/'
        for filename in os.listdir(file_dir):
            file_path = os.path.join(file_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Files cleared')


def run_server():
    server_address = ('localhost', 1234)
    httpd = HTTPServer(server_address, RequestHandler)
    print('Server running on localhost:1234...')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()
