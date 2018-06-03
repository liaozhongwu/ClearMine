'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

http.createServer((req, resp) => {
  if (req.url.includes('dist')) {
    const baseDir = path.join(__dirname, '..');
    const file = path.join(baseDir, req.url);
    fs.access(file, (err) => {
      if (err) {
        resp.end('404 not found');
      } else {
        fs.createReadStream(file).pipe(resp);
      }
    });
  } else if (req.url.includes('favicon.ico')) {
    fs.createReadStream(path.join(__dirname, '../src/favicon.ico')).pipe(resp);
  } else {
    fs.createReadStream(path.join(__dirname, '../src/index.html')).pipe(resp);
  }
}).listen(8040);