import * as net from 'net';
import path from 'path';
import * as fs from 'fs'

const server = net.createServer((socket) => {
   socket.on('data' , (data) => {
    const req = data.toString();
    const url =  req.split(' ')[1];
    const res =  url === '/' ? 'HTTP/1.1 200 OK\r\n\r\n' : 'HTTP/1.1 404 Not Found\r\n\r\n';
    const str = url.split('/')[2];
    const lines = req.split('\r\n'); // Corrected to split the entire request by \r\n

   let userAgent = '';

   for(let line of lines){
    if(line.startsWith('User-Agent:')){
        userAgent = line.split(':')[1].trim(); // Trim to remove any leading/trailing whitespace
        break;
    }
   }

   
    if (url === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
    } else if (url === '/user-agent') {
        const contentLength = userAgent.length.toString(); // Convert length to string
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`);
    } 
    else if (url === `/echo/${str}`) {
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`)
    }
    else if(url.startsWith('/files')){  
        const fileName = url.split('/')[2];
        console.log(fileName)
        let filePath = path.join(__dirname, fileName);
        console.log('Original file path:', filePath);
        
        // Trim the /app prefix
        const prefix = '/app';
        if (filePath.startsWith(prefix)) {
           filePath = filePath.replace(prefix, '');
        }
        console.log('Trimmed file path:', filePath);
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
               console.error('File does not exist:', filePath);
               socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            } else {
               fs.readFile(filePath, (err, data) => {
                  if (err) {
                     console.log(err);
                     socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                  } else {
                     socket.write(`HTTP/1.1 200 OK\r\nContent-Length: ${data.length}\r\n\r\n`);
                     socket.write(data);
                  }
                  socket.end(); // Ensure the connection is properly closed
               });
            }
         });

    }
    else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }

   })
});

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
