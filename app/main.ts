import * as net from 'net';
import { Socket } from 'net';
import path from 'path';
import * as fs from 'fs';

const server = net.createServer((socket) => {
   let body = '';
   let contentLength = 0;

   socket.on('data', (data) => {
    const req = data.toString();
    const lines = req.split('\r\n');
    const [method, url] = lines[0].split(' ');
    const str = url.split('/')[2];

    let userAgent = '';
    let contentType = '';

    for(let line of lines){
      if(line.startsWith('User-Agent:')){
        userAgent = line.split(':')[1].trim();
      } else if(line.startsWith('Content-Length:')){
        contentLength = parseInt(line.split(':')[1].trim(), 10);
      } else if(line.startsWith('Content-Type:')){
        contentType = line.split(':')[1].trim();
      }
    }

    // Handle POST request
    if (method === 'POST' && url === '/files') {
      body += req.split('\r\n\r\n')[1];
      
      if (body.length >= contentLength) {
        handlePostRequest(socket, body, contentType);
        body = '';
        contentLength = 0;
      }
      return;
    }

    // Existing GET routes
    if (method === 'GET') {
      if (url === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
      } else if (url === '/user-agent') {
        const contentLength = userAgent.length.toString();
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`);
      } else if (url === `/echo/${str}`) {
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`);
      } else if(url.startsWith('/files')){  
        handleFileRequest(socket, url);
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      }
    } else {
      socket.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n');
    }
   });
});

function handlePostRequest(socket:Socket, body : string, contentType : string) {
  const args = process.argv.slice(2);
  const absPath = args[1];
  const fileName = body.split('\r\n')[1].split(';')[2].split('=')[1].replace(/"/g, '');
  const fileContent = body.split('\r\n\r\n')[1].split('\r\n')[0];
  
  let filePath = path.join(absPath, fileName);
  
  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      console.error('Error writing file:', err);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    } else {
      socket.write('HTTP/1.1 201 Created\r\n\r\n');
    }
    socket.end();
  });
}

function handleFileRequest(socket:Socket, url:string) {
  const fileName = url.split('/')[2];
  const args = process.argv.slice(2);
  const absPath = args[1];
  let filePath = path.join(absPath, fileName);

  const prefix = '/app';
  if (filePath.startsWith(prefix)) {
     filePath = filePath.replace(prefix, '');
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
     if (err) {
        console.error('File does not exist:', filePath);
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.end();
     } else {
        fs.readFile(filePath, (err, data) => {
           if (err) {
              console.log(err);
              socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
           } else {
              socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n`);
              socket.write(data);
           }
           socket.end();
        });
     }
  });
}

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});