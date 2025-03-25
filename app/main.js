import net from "node:net";


/**
 * Writes an unsigned variable-length integer to a buffer
 * @param {Buffer} buffer - The buffer to write to
 * @param {number} value - The integer value to write
 * @param {number} offset - The offset in the buffer to start writing
 * @returns {number} The new offset after writing
 */
function writeUnsignedVarInt(buffer, value, offset) {
    let currentOffset = offset;

    // Handle values that fit in a single byte (0-127)
    if (value < 128) {
        buffer.writeUInt8(value, currentOffset);
        return currentOffset + 1;
    }

    // For larger values, we need multiple bytes
    while (value >= 128) {
        // Write 7 bits of the value + set the continuation bit (MSB)
        buffer.writeUInt8((value & 0x7F) | 0x80, currentOffset);
        currentOffset++;
        // Shift right by 7 bits
        value >>>= 7;
    }

    // Write the final byte (without continuation bit)
    buffer.writeUInt8(value, currentOffset);
    return currentOffset + 1;
}


const server = net.createServer((connection) => {
    // Handle connection
    connection.on("data", (data) => {
        /**
         * Request ArrayBuffer structure:
         * 
         * 00 00 00 23  // message_size:        35              (4 bytes long)
         * 00 12        // request_api_key:     18              (2 bytes long)
         * 00 04        // request_api_version: 4               (2 bytes long)
         * 6f 7f c6 61  // correlation_id:      1870644833      (4 bytes long)
         */


        const apiKey = data.readUInt16BE(4);

        const correlationBuffer = data.subarray(8, 12);
        const correlationID = correlationBuffer.readUInt32BE(0);

        console.log({ apiKey, correlationID })

        /**
         * Response ArrayBuffer structure:
         * 
         * 00 00 00 12  // message_size:        18              (4 bytes long)
         * 6f 7f c6 61  // correlation_id:      1870644833      (4 bytes long)
         * 00 00        // error_code:          0               (2 bytes long)
         * API Keys array section
         * 
         * 00 00 00 00  // API Keys array size: 0                 (4 bytes long)
         */


        const responseBuffer = Buffer.alloc(28);

        // Set message size
        responseBuffer.writeUInt32BE(25, 0);

        // Set correlation ID (same as request)
        correlationBuffer.copy(responseBuffer, 4);

        // Set error code
        responseBuffer.writeUInt16BE(0, 8);

        // Set API Keys array size
        responseBuffer.writeUInt32BE(1, 10); // 4-byte size indicating 1 API key

        // Add an API key entry (API key 18 - ApiVersions)
        responseBuffer.writeUInt16BE(18, 14); // API key (16-bit)
        responseBuffer.writeUInt16BE(0, 16);  // Min version (16-bit)
        responseBuffer.writeUInt16BE(4, 18);  // Max version (16-bit)

        // Add throttle_time_ms (required for ApiVersions v3)
        responseBuffer.writeUInt32BE(0, 20);

        responseBuffer.writeUInt8(0, 24);

        // Send response
        connection.write(responseBuffer);
    })
});

server.listen(9092, "127.0.0.1", () => {
    console.log("Server listening on port 9092", "127.0.0.1:9092");
});
