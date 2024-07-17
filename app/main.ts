import * as net from 'net';

const server = net.createServer((socket) => {
   socket.on('data' , (data) => {
    const req = data.toString();
    const url =  req.split(' ')[1];
    const res =  url === '/' ? 'HTTP/1.1 200 OK\r\n\r\n' : 'HTTP/1.1 404 Not Found\r\n\r\n';
    const str = url.split('/')[2];
    const lines = req.split('\r\n'); // Corrected to split the entire request by \r\n
    console.log(lines)

   let userAgent = '';

   for(let line of lines){
    if(line.startsWith('User-Agent:')){
        userAgent = line.split(':')[1].trim(); 
        break;
    }
   }

   
    if (url === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
    } else if (url === '/user-agent') {
        const contentLength = userAgent.length.toString(); 
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`);
    } 
    else if (url === `/echo/${str}`) {
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`)
    }
    else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }

   })
});

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
