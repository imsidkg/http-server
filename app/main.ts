
import * as net from 'net';
const server = net.createServer((socket) => {
   socket.on('data' , (data) => {
    const req = data.toString();
    const url =  req.split(' ')[1];
    const res =  url === '/' ? 'HTTP/1.1 200 OK\r\n\r\n' : 'HTTP/1.1 404 Not Found\r\n\r\n';
    socket.write(res)

   })
});

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});