import * as net from 'net';

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const req = data.toString();
        const lines = req.split('\r\n'); // Split request into lines based on '\r\n'

        // Extract the URL from the request (first line after splitting by spaces)
        const url = lines[0].split(' ')[1];

        // Initialize variables for response and extracted data
        let response;
        let str = '';
        let userAgent = '';

        // Find the User-Agent header in the HTTP request
        for (let line of lines) {
            if (line.startsWith('User-Agent: ')) {
                userAgent = line.split(': ')[1];
                break;
            }
        }

        // Determine the response based on the requested URL
        if (url === '/') {
            response = 'HTTP/1.1 200 OK\r\n\r\n';
        } else if (url === '/user-agent') {
            response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`;
        } else if (url.startsWith('/echo/')) {
            str = url.split('/')[2];
            response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${str.length}\r\n\r\n${str}`;
        } else {
            response = 'HTTP/1.1 404 Not Found\r\n\r\n';
        }

        socket.write(response); // Send the determined response back to the client
    });
});

server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
