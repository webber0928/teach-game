
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

io.on('connection', (socket) => {

    socket.on('main-join', (data) =>{
    });
    
    socket.on('main-join-game', (data) => {
    });
    
    socket.on('player-join', (data) => {
    });
    
    socket.on('player-join-game', (data) => {
    });

    socket.on('player-answer', (data) => {
    });
    
    socket.on('disconnect', (data) => {
    });
    
    socket.on('get-score', (data) => {
    });
    
    socket.on('time', (data) => {
    });
    
    socket.on('time-up', (data) => {
    });
    
    socket.on('next-question', (data) => {
    });
    
    socket.on('start-game', (data) => {
    });
    
    socket.on('request-db-names', (data) => {
    });
    
    socket.on('new-quiz', (data) => {
    });
    
});