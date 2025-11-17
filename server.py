#!/usr/bin/env python3
"""
Simple HTTP server with proper MIME types for ES modules
"""
import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Set proper MIME types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript; charset=utf-8')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css; charset=utf-8')
        elif self.path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=utf-8')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = 8000

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()

