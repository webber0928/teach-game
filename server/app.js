
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const frontendPath = path.join(__dirname, '../frontend');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(frontendPath));
server.listen(3000, () => {
    console.log("Server started on port 3000");
});
