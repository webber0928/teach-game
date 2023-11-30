const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {LiveGames} = require('./utils/liveGames');
const {Players} = require('./utils/players');

const publicPath = path.join(__dirname, '../frontend');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const GAMES = new LiveGames();
const PLAYERS = new Players();

const { MongoClient } = require('mongodb');
const url = 'mongodb://13.113.190.142:27017/kahootDB';
// const uri = 'mongodb://AdminWebber:0000@localhost:27017/kahootDB';



app.use(express.static(publicPath));

server.listen(3000, () => {
    console.log("Server started on port 3000");
});

async function connectTable (table) {
    const client = new MongoClient(url);
    await client.connect();

    const db = client.db();
    const collection = db.collection(table);
    return {
        client,
        collection
    }
}

io.on('connection', (socket) => {
    try {
        console.log('A user connected');
    
        socket.on('host-join', async (data) => {
            console.log('A user host-join');

            let db = await connectTable('kahootGames')
            let query = { id:  parseInt(data.id)};
            let result = await db.collection.findOne(query);
            await db.client.close();

            if(result) {
                const gamePin = Math.floor(Math.random()*9000) + 1000;
                GAMES.addGame(gamePin, socket.id, false, {
                    playersAnswered: 0, 
                    questionLive: false, 
                    gameid: data.id, 
                    question: 1
                });


                const game = GAMES.getGame(socket.id)
                console.log(game)
                socket.join(game.pin);

                console.log('Game Created with pin:', game.pin); 
                socket.emit('showGamePin', { pin: game.pin });
            } else {
                socket.emit('noGameFound');
            }
        });
        
        socket.on('host-join-game', async (data) => {
            console.log('A user host-join-game');

            let oldHostId = data.id;
            let game = GAMES.getGame(oldHostId);
            if(game){
                game.hostId = socket.id;
                socket.join(game.pin);
                let playerData = PLAYERS.getPlayers(oldHostId);
                for(let i = 0; i < Object.keys(PLAYERS.players).length; i++){
                    if(PLAYERS.players[i].hostId == oldHostId){
                        PLAYERS.players[i].hostId = socket.id;
                    }
                }

                let gameid = game.gameData['gameid'];

                let db = await connectTable('kahootGames')
                let query = { id:  parseInt(gameid) };
                let result = await db.collection.find(query).toArray();
                await db.client.close();

                let question = result[0].questions[0].question;
                let answer1 = result[0].questions[0].answers[0];
                let answer2 = result[0].questions[0].answers[1];
                let answer3 = result[0].questions[0].answers[2];
                let answer4 = result[0].questions[0].answers[3];
                let correctAnswer = result[0].questions[0].correct;

                socket.emit('gameQuestions', {
                    q1: question,
                    a1: answer1,
                    a2: answer2,
                    a3: answer3,
                    a4: answer4,
                    correct: correctAnswer,
                    playersInGame: playerData.length,
                    questionNum: 1,
                    questionLen: result[0].questions.length
                });

                socket.to(game.pin).emit('gameStartedPlayer', game.pin);
                game.gameData.questionLive = true;
            }else{
                socket.emit('noGameFound');
            }
        });

        socket.on('player-join', (params) => {
            console.log('A user player-join', params);
            
            let gameFound = false;
            console.log(GAMES.games)
            for(let i = 0; i < GAMES.games.length; i++){
                if(params.pin == GAMES.games[i].pin){
                    console.log('Player connected to game');
                    let hostId = GAMES.games[i].hostId;
                    
                    PLAYERS.addPlayer(hostId, socket.id, params.name, params.pin, {
                        score: 0, 
                        answer: 0
                    });
                    
                    socket.join(params.pin);
                    
                    let playersInGame = PLAYERS.getPlayers(hostId);
                    socket.to(params.pin).emit('updatePlayerLobby', playersInGame);
                    gameFound = true;
                }
            }
            
            if(gameFound == false){
                socket.emit('noGameFound');
            }
        });
        
        socket.on('player-join-game', (data) => {
            console.log('A user player-join-game');

            let player = PLAYERS.getPlayer(data.id);
            if(player){
                let game = GAMES.getGame(player.hostId);
                socket.join(game.pin);
                player.playerId = socket.id;

                let playerData = PLAYERS.getPlayers(game.hostId);
                socket.emit('playerGameData', playerData);
            }else socket.emit('noGameFound');
        });
        
        socket.on('disconnect', () => {
            console.log('A user disconnect');

            let game = GAMES.getGame(socket.id);

            if(game){
                if(game.gameLive == false){
                    GAMES.removeGame(socket.id);
                    console.log('Game ended with pin:', game.pin);

                    let playersToRemove = PLAYERS.getPlayers(game.hostId);

                    for(let i = 0; i < playersToRemove.length; i++){
                        PLAYERS.removePlayer(playersToRemove[i].playerId);
                    }

                    io.emit('hostDisconnect', game.pin);
                    socket.leave(game.pin);
                }
            }else{
                let player = PLAYERS.getPlayer(socket.id);
                if(player){
                    let hostId = player.hostId;
                    let game = GAMES.getGame(hostId);
                    let pin = game.pin;
                    
                    if(game.gameLive == false){
                        PLAYERS.removePlayer(socket.id);
                        let playersInGame = PLAYERS.getPlayers(hostId);

                        io.emit('updatePlayerLobby', playersInGame);
                        socket.leave(pin);
                    }
                }
            }
            
        });

        socket.on('playerAnswer', async (num) => {
            console.log('A user playerAnswer');

            let player = PLAYERS.getPlayer(socket.id);
            let hostId = player.hostId;
            let playerNum = PLAYERS.getPlayers(hostId);
            let game = GAMES.getGame(hostId);
            if(game.gameData.questionLive == true){
                player.gameData.answer = num;
                game.gameData.playersAnswered += 1;

                let gameQuestion = game.gameData.question;
                let gameid = game.gameData.gameid;

                let db = await connectTable('kahootGames')
                let query = { id:  parseInt(gameid)};
                let result = await db.collection.find(query).toArray();
                await db.client.close();

                let correctAnswer = result[0].questions[gameQuestion - 1].correct;

                if(num == correctAnswer){
                    player.gameData.score += 100;
                    io.to(game.pin).emit('getTime', socket.id);
                    socket.emit('answerResult', true);
                }

                if(game.gameData.playersAnswered == playerNum.length){
                    game.gameData.questionLive = false; 
                    let playerData = PLAYERS.getPlayers(game.hostId);
                    io.to(game.pin).emit('questionOver', playerData, correctAnswer);
                }else{
                    io.to(game.pin).emit('updatePlayersAnswered', {
                        playersInGame: playerNum.length,
                        playersAnswered: game.gameData.playersAnswered
                    });
                }
            }
        });
        
        socket.on('getScore', function(){
            console.log('A user getScore');

            let player = PLAYERS.getPlayer(socket.id);
            socket.emit('newScore', player.gameData.score); 
        });
        
        socket.on('time', function(data){
            console.log('A user time');

            let time = data.time / 20;
            time = time * 100;
            let playerid = data.player;
            let player = PLAYERS.getPlayer(playerid);
            player.gameData.score += time;
        });
        
        socket.on('timeUp', async () => {
            console.log('A user timeUp');

            let game = GAMES.getGame(socket.id);
            game.gameData.questionLive = false;
            let playerData = PLAYERS.getPlayers(game.hostId);
            
            let gameQuestion = game.gameData.question;
            let gameid = game.gameData.gameid;

            let db = await connectTable('kahootGames')
            let query = { id:  parseInt(gameid)};
            let result = await db.collection.findOne(query);
            await db.client.close();
            let correctAnswer = result[0].questions[gameQuestion - 1].correct;
            io.to(game.pin).emit('questionOver', playerData, correctAnswer);
        });
        
        socket.on('nextQuestion', async () => {
            console.log('A user requestDbNames');

            let playerData = PLAYERS.getPlayers(socket.id);
            //Reset players current answer to 0
            for(let i = 0; i < Object.keys(PLAYERS.players).length; i++){
                if(PLAYERS.players[i].hostId == socket.id){
                    PLAYERS.players[i].gameData.answer = 0;
                }
            }
            
            let game = GAMES.getGame(socket.id);
            game.gameData.playersAnswered = 0;
            game.gameData.questionLive = true;
            game.gameData.question += 1;
            let gameid = game.gameData.gameid;
            
            let db = await connectTable('kahootGames')
            let query = { id:  parseInt(gameid)};
            let res = await db.collection.findOne(query);
            await db.client.close();
            if(res[0].questions.length >= game.gameData.question){
                let questionNum = game.gameData.question;
                questionNum = questionNum - 1;
                let question = res[0].questions[questionNum].question;
                let answer1 = res[0].questions[questionNum].answers[0];
                let answer2 = res[0].questions[questionNum].answers[1];
                let answer3 = res[0].questions[questionNum].answers[2];
                let answer4 = res[0].questions[questionNum].answers[3];
                let correctAnswer = res[0].questions[questionNum].correct;

                socket.emit('gameQuestions', {
                    q1: question,
                    a1: answer1,
                    a2: answer2,
                    a3: answer3,
                    a4: answer4,
                    correct: correctAnswer,
                    playersInGame: playerData.length,
                    questionNum: questionNum + 1,
                    questionLen: res[0].questions.length
                });
                db.close();
            }else{
                let playersInGame = PLAYERS.getPlayers(game.hostId);
                let first = {name: "", score: 0};
                let second = {name: "", score: 0};
                let third = {name: "", score: 0};
                let fourth = {name: "", score: 0};
                let fifth = {name: "", score: 0};
                
                for(let i = 0; i < playersInGame.length; i++){
                    console.log(playersInGame[i].gameData.score);
                    if(playersInGame[i].gameData.score > fifth.score){
                        if(playersInGame[i].gameData.score > fourth.score){
                            if(playersInGame[i].gameData.score > third.score){
                                if(playersInGame[i].gameData.score > second.score){
                                    if(playersInGame[i].gameData.score > first.score){
                                        //First Place
                                        fifth.name = fourth.name;
                                        fifth.score = fourth.score;
                                        
                                        fourth.name = third.name;
                                        fourth.score = third.score;
                                        
                                        third.name = second.name;
                                        third.score = second.score;
                                        
                                        second.name = first.name;
                                        second.score = first.score;
                                        
                                        first.name = playersInGame[i].name;
                                        first.score = playersInGame[i].gameData.score;
                                    }else{
                                        //Second Place
                                        fifth.name = fourth.name;
                                        fifth.score = fourth.score;
                                        
                                        fourth.name = third.name;
                                        fourth.score = third.score;
                                        
                                        third.name = second.name;
                                        third.score = second.score;
                                        
                                        second.name = playersInGame[i].name;
                                        second.score = playersInGame[i].gameData.score;
                                    }
                                }else{
                                    //Third Place
                                    fifth.name = fourth.name;
                                    fifth.score = fourth.score;
                                        
                                    fourth.name = third.name;
                                    fourth.score = third.score;
                                    
                                    third.name = playersInGame[i].name;
                                    third.score = playersInGame[i].gameData.score;
                                }
                            }else{
                                //Fourth Place
                                fifth.name = fourth.name;
                                fifth.score = fourth.score;
                                
                                fourth.name = playersInGame[i].name;
                                fourth.score = playersInGame[i].gameData.score;
                            }
                        }else{
                            //Fifth Place
                            fifth.name = playersInGame[i].name;
                            fifth.score = playersInGame[i].gameData.score;
                        }
                    }
                }
                
                io.to(game.pin).emit('GameOver', {
                    num1: first.name,
                    num2: second.name,
                    num3: third.name,
                    num4: fourth.name,
                    num5: fifth.name
                });
            }

            io.to(game.pin).emit('nextQuestionPlayer');
        });
        
        socket.on('startGame', () => {
            console.log('A user startGame');
            let game = GAMES.getGame(socket.id);
            game.gameLive = true;

            console.log('L404', game)
            socket.join(game.pin)
            socket.emit('gameStarted', game.hostId);
        });
        
        socket.on('requestDbNames', async () => {
            console.log('A user requestDbNames');

            let db = await connectTable('kahootGames')
            let result = await db.collection.find({}).toArray();
            await db.client.close();

            socket.emit('gameNamesData', result);
        });
        
        socket.on('newQuiz', async (data) => {
            console.log('A user newQuiz', data);

            let db = await connectTable('kahootGames')
            let result = await db.collection.find({}).toArray();

            let num = Object.keys(result).length;
            if(num == 0) {
                data.id = 1
                num = 1
            } else data.id = result[num -1].id + 1;

            await db.collection.insertOne(data)
            await db.client.close();
            socket.emit('startGameFromCreator', num);
        });
    } catch (error) {
        console.error(error)
    }
});
