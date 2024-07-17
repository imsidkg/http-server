
import * as net from 'net';
const server = net.createServer((socket) => {
   socket.on('data' , (data) => {
    const req = data.toString();
    const url =  req.split(' ')[1];
    const res =  url === '/' ? 'HTTP/1.1 200 OK\r\n\r\n' : 'HTTP/1.1 404 Not Found\r\n\r\n';
    const str = url.split('/')[2];
    if(url === `/echo/${str}`){
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`)
    }
    else{
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    }

   })
});

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});