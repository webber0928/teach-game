const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const publicPath = path.join(__dirname, '../frontend');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    // 在这里监听和处理来自客户端的其他事件
});

app.use(express.static(publicPath));

//Starting server on port 3000
server.listen(3000, () => {
    console.log("Server started on port 3000");
});