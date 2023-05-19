import os
import json
import requests
from urllib.parse import unquote
from http.server import BaseHTTPRequestHandler, HTTPServer


class MyRequestHandler(BaseHTTPRequestHandler):
    download_dir = 'stable-diffusion-webui/models/Stable-diffusion/test/'

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)

        if self.path == '/api/download':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            download_records = []
            for item in data:
                download_url = item['downloadUrl']
                local_filename = self.download_file(download_url)
                record = {
                    'downloadUrl': download_url,
                    'localUrl': f'http://localhost:1234/{local_filename}',
                    'filename': local_filename
                }
                download_records.append(record)

            response = json.dumps({'downloads': download_records})
            self.wfile.write(response.encode())

        elif self.path == '/api/ready':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()

            if 'filename' in data:
                filename = unquote(data['filename'])
                ready = self.is_file_ready(filename)
                response = 'READY' if ready else 'NOT READY'
                self.wfile.write(response.encode())

        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write('404 Not Found'.encode())

    def do_GET(self):
        if self.path == '/api/clear':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()

            self.clear_directory()
            self.wfile.write('Directory cleared'.encode())

        elif self.path == '/api/hello':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write('OK'.encode())

        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write('404 Not Found'.encode())

    def download_file(self, url):
        # Spoof the request with User-Agent
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, stream=True)

        filename = self.get_filename(url, response.headers)
        local_filepath = os.path.join(self.download_dir, filename)

        with open(local_filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    f.write(chunk)

        return filename

    def get_filename(self, url, headers):
        # Try to extract the filename from the URL
        filename = url.split('/')[-1]

        # If the filename cannot be guessed, check the Content-Disposition header
        if 'Content-Disposition' in headers:
            disposition = headers['Content-Disposition']
            if 'filename' in disposition:
                filename = disposition.split('filename=')[1].strip('"')

        return filename

    def is_file_ready(self, filename):
        filepath = os.path.join(self.download_dir, filename)
        return os.path.exists(filepath)

    def clear_directory(self):
        for filename in os.listdir(self.download_dir):
            filepath = os.path.join(self.download_dir, filename)
            os.remove(filepath)

    def log_message(self, format, *args):
        # Disable logging to console
        pass


def run_server():
    server_address = ('', 1234)
    httpd = HTTPServer(server_address, MyRequestHandler)
    print('Server running on localhost:1234')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()
