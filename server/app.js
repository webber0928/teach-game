
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
    
    socket.on('player-join', (params) => {
    });
    
    socket.on('player-join-game', (data) => {
    });

    socket.on('player-answer', function(num){
    });
    
    socket.on('disconnect', () => {
    });
    
    socket.on('get-score', function(){
    });
    
    socket.on('time', function(data){
    });
    
    socket.on('time-up', function(){
    });
    
    socket.on('next-question', function(){
    });
    
    socket.on('start-game', () => {
    });
    
    socket.on('request-db-names', function(){
    });
    
    socket.on('new-quiz', function(data){
    });
    
});