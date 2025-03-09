import net from "node:net";


const server = net.createServer((connection) => {
    // Handle connection
    connection.on("data", (data) => {
        // 
        /**
         * We already know the data ArrayBuffer:
         * 
         * 00 00 00 23  // message_size:        35
         * 00 12        // request_api_key:     18
         * 00 04        // request_api_version: 4
         * 6f 7f c6 61  // correlation_id:      1870644833
         */

        // First get the correlation_id Buffer, which position is 8, 12
        const correlationBuffer = data.subarray(8, 12);
        // Now read the correlation_id as a 32-bit unsigned integer
        const correlationID = correlationBuffer.readUInt32BE(0);


        const messageSize = 4;
        const response = Buffer.alloc(12);

        // We need to send ApiVersions v4 response with the errorCode 35
        const errorCode = 35;

        response.writeInt32BE(messageSize, 0);
        response.writeInt32BE(correlationID, 4);
        response.writeInt16BE(errorCode, 8);
        connection.write(response);
    })
});

server.listen(9092, "127.0.0.1", () => {
    console.log("Server listening on port 9092", "127.0.0.1:9092");
});
