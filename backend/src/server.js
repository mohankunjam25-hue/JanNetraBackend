const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});
const http = require('http'); 
const connectDB = require('./config/db');
const { app } = require('./app');
const { initializeSocket } = require('./socket'); 


const fs = require('fs');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app); // Create HTTP server

// Ensure temp directory exists
const tempDir = path.resolve(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

connectDB()
    .then(() => {
        initializeSocket(server); // Initialize socket.io

        server.listen(PORT, () => {
            console.log(`Server is running at port : ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });
