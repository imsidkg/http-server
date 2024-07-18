import * as net from "net";
import { Socket } from "net";
import path from "path";
import * as fs from "fs";
import { Buffer } from "buffer";
import zlib from 'zlib';

const server = net.createServer((socket) => {
  let body = "";
  let contentLength = 0;
  let method = "";
  let url = "";
  let contentType = "";
  let acceptEncoding = ""; // Declare acceptEncoding here

  socket.on("data", (data) => {
    const req = data.toString();
    const lines = req.split("\r\n");

    if (!method || !url) {
      [method, url] = lines[0].split(" ");
      console.log("method is", method);
      console.log("url is", url);
    }

    let userAgent = "";

    for (let line of lines) {
      if (line.startsWith("User-Agent:")) {
        userAgent = line.split(":")[1].trim();
      } else if (line.startsWith("Content-Length:")) {
        contentLength = parseInt(line.split(":")[1].trim(), 10);
      } else if (line.startsWith("Content-Type:")) {
        contentType = line.split(":")[1].trim();
      } else if (line.startsWith("Accept-Encoding:")) {
        acceptEncoding = line.split(":")[1].trim();
      }
    }

    // Print Accept-Encoding header for debugging
    console.log('accept encoding is', acceptEncoding);

    body += req.split("\r\n\r\n")[1] || "";

    if (body.length >= contentLength) {
      // Handle POST request
      if (method === "POST" && url.startsWith("/files/")) {
        handlePostRequest(socket, body, contentType, url);
      }
      // Existing GET routes
      else if (method === "GET") {
        if (url === "/") {
          socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else if (url === "/user-agent") {
          const contentLength = userAgent.length.toString();
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${userAgent}`
          );
        } else if (url.startsWith("/echo/")) {
          const echoContent = url.slice(6); // Remove '/echo/' prefix
          const input = Buffer.from(echoContent); // Create a buffer for gzip compression

          
            

          zlib.gzip(input, (err: Error | null, compressed: Buffer) => {
            if (err) {
              console.error("Error compressing data:", err);
              socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
              return;
            }
            for(let line of lines){
              if (line.startsWith("Accept-Encoding:")) {
               acceptEncoding = line.split(":")[1].trim();
             }
           }

            const gzipSupported = acceptEncoding.includes("gzip");
            const headers = `HTTP/1.1 200 OK\r\n${gzipSupported ? "Content-Encoding: gzip\r\n" : ""}Content-Type: text/plain\r\nContent-Length: ${compressed.length}\r\n\r\n`;

            socket.write(headers); // Write headers first
            socket.write(compressed); // Then write compressed body
            socket.end(); // Ensure the connection is properly closed
          });
        } else if (url.startsWith("/files/")) {
          console.log("reached here 1");
          handleFileRequest(socket, url, acceptEncoding); // Pass acceptEncoding here
          console.log("reached here 2");
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else {
        socket.write("HTTP/1.1 405 Method Not Allowed\r\n\r\n");
      }

      // Reset for next request
      body = "";
      contentLength = 0;
      method = "";
      url = "";
      contentType = "";
      acceptEncoding = ""; // Reset acceptEncoding here
    }
  });
});

function handlePostRequest(
  socket: Socket,
  body: string,
  contentType: string,
  url: string
) {
  const args = process.argv.slice(2);
  const absPath = args[1];
  const fileName = url.split("/").pop(); // Extract filename from URL

  if (!fileName) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\nInvalid file name");
    socket.end();
    return;
  }

  let filePath = path.join(absPath, fileName);

  fs.writeFile(filePath, body, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 201 Created\r\n\r\n");
    }
    socket.end();
  });
}

function handleFileRequest(
  socket: Socket,
  url: string,
  acceptEncoding: string
) {
  const fileName = url.split("/").pop();
  const args = process.argv.slice(2);
  const absPath = args[1];
  let filePath = path.join(absPath, fileName!);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File does not exist:", filePath);
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.end();
    } else {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log(err);
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        } else {
          const gzipSupported = acceptEncoding.includes("gzip");
          if (gzipSupported) {
            zlib.gzip(data, (err: Error | null, compressed: Buffer) => {
              if (err) {
                console.error("Error compressing file:", err);
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.end();
                return;
              }

              socket.write(
                `HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: application/octet-stream\r\nContent-Length: ${compressed.length}\r\n\r\n`
              );
              socket.write(compressed);
              socket.end();
            });
          } else {
            socket.write(
              `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n`
            );
            socket.write(data);
            socket.end();
          }
        }
      });
    }
  });
}

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
