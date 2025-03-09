import net from "node:net";


const server = net.createServer((connection) => {
    // Handle connection
    const correlationID = 7;
    const messageSize = 4;
    const response = Buffer.alloc(8);
    response.writeInt32BE(messageSize, 0);
    response.writeInt32BE(correlationID, 4);
    connection.write(response);
});

server.listen(9092, "127.0.0.1");
