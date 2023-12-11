//Import dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

//Import classes
const { LiveGames } = require('./utils/liveGames');
const { Players } = require('./utils/players');

const publicPath = path.join(__dirname, '../frontend');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const games = new LiveGames();
const players = new Players();

const MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/";
var url = "mongodb://localhost:9453/";

app.use(express.static(publicPath));

server.listen(3000, () => {
    console.log('Server started on port 3000');
});

io.on('connection', (socket) => {
    console.log('on: connection')
    socket.on('host-join', (data) => {
        console.log('on: host-join', data)
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db('kahootDB');
            var query = { id: parseInt(data.id) };
            dbo.collection('kahootGames')
                .find(query)
                .toArray(function (err, result) {
                    if (err) throw err;

                    if (result[0] !== undefined) {
                        var gamePin = Math.floor(Math.random() * 900) + 100;
                        games.addGame(gamePin, socket.id, false, {
                            playersAnswered: 0,
                            questionLive: false,
                            gameid: data.id,
                            question: 1,
                        });
                        var game = games.getGame(socket.id);
                        socket.join(game.pin);
                        console.log('Game Created with pin:', game.pin);
                        socket.emit('showGamePin', {
                            pin: game.pin,
                        });
                    } else {
                        socket.emit('noGameFound');
                    }
                    db.close();
                });
        });
    });

    socket.on('host-join-game', (data) => {
        console.log('on: host-join-game', data)
        var oldHostId = data.id;
        var game = games.getGame(oldHostId);
        if (game) {
            game.hostId = socket.id;
            socket.join(game.pin);
            var playerData = players.getPlayers(oldHostId);
            for (var i = 0; i < Object.keys(players.players).length; i++) {
                if (players.players[i].hostId == oldHostId) {
                    players.players[i].hostId = socket.id;
                }
            }
            var gameid = game.gameData['gameid'];
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;

                var dbo = db.db('kahootDB');
                var query = { id: parseInt(gameid) };
                dbo.collection('kahootGames')
                    .find(query)
                    .toArray(function (err, res) {
                        if (err) throw err;

                        var question = res[0].questions[0].question;
                        var answer1 = res[0].questions[0].answers[0];
                        var answer2 = res[0].questions[0].answers[1];
                        var answer3 = res[0].questions[0].answers[2];
                        var answer4 = res[0].questions[0].answers[3];
                        var correctAnswer = res[0].questions[0].correct;

                        socket.emit('gameQuestions', {
                            q1: question,
                            a1: answer1,
                            a2: answer2,
                            a3: answer3,
                            a4: answer4,
                            correct: correctAnswer,
                            playersInGame: playerData.length,
                            questionNum: 1,
                            questionLen: res[0].questions.length,
                        });
                        db.close();
                    });
            });

            io.to(game.pin).emit('gameStartedPlayer');
            game.gameData.questionLive = true;
        } else {
            socket.emit('noGameFound');
        }
    });

    socket.on('player-join', (params) => {
        console.log('on: player-join', params)
        var gameFound = false;

        for (var i = 0; i < games.games.length; i++) {
            if (params.pin == games.games[i].pin) {
                console.log('Player connected to game');

                var hostId = games.games[i].hostId;

                players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0 });

                socket.join(params.pin);

                var playersInGame = players.getPlayers(hostId);

                io.to(params.pin).emit('updatePlayerLobby', playersInGame);
                gameFound = true;
            }
        }

        if (gameFound == false) {
            socket.emit('noGameFound');
        }
    });

    socket.on('player-join-game', (data) => {
        console.log('on: player-join-game', data)
        var player = players.getPlayer(data.id);
        if (player) {
            var game = games.getGame(player.hostId);
            socket.join(game.pin);
            player.playerId = socket.id;

            var playerData = players.getPlayers(game.hostId);
            socket.emit('playerGameData', playerData);
        } else {
            socket.emit('noGameFound');
        }
    });

    socket.on('disconnect', () => {
        console.log('on: disconnect')
        var game = games.getGame(socket.id);
        if (game) {
            if (game.gameLive == false) {
                games.removeGame(socket.id);
                console.log('Game ended with pin:', game.pin);

                var playersToRemove = players.getPlayers(game.hostId);

                for (var i = 0; i < playersToRemove.length; i++) {
                    players.removePlayer(playersToRemove[i].playerId);
                }

                io.to(game.pin).emit('hostDisconnect');
                socket.leave(game.pin);
            }
        } else {
            var player = players.getPlayer(socket.id);

            if (player) {
                var hostId = player.hostId;
                var game = games.getGame(hostId);
                var pin = game.pin;

                if (game.gameLive == false) {
                    players.removePlayer(socket.id);
                    var playersInGame = players.getPlayers(hostId);

                    io.to(pin).emit('updatePlayerLobby', playersInGame);
                    socket.leave(pin);
                }
            }
        }
    });

    socket.on('playerAnswer', function (num) {
        console.log('on: playerAnswer', num)
        var player = players.getPlayer(socket.id);
        var hostId = player.hostId;
        var playerNum = players.getPlayers(hostId);
        var game = games.getGame(hostId);
        if (game.gameData.questionLive == true) {
            player.gameData.answer = num;
            game.gameData.playersAnswered += 1;

            var gameQuestion = game.gameData.question;
            var gameid = game.gameData.gameid;

            MongoClient.connect(url, function (err, db) {
                if (err) throw err;

                var dbo = db.db('kahootDB');
                var query = { id: parseInt(gameid) };
                dbo.collection('kahootGames')
                    .find(query)
                    .toArray(function (err, res) {
                        if (err) throw err;
                        var correctAnswer = res[0].questions[gameQuestion - 1].correct;

                        if (num == correctAnswer) {
                            player.gameData.score += 100;
                            io.to(game.pin).emit('getTime', socket.id);
                            socket.emit('answerResult', true);
                        }

                        if (game.gameData.playersAnswered == playerNum.length) {
                            game.gameData.questionLive = false;
                            var playerData = players.getPlayers(game.hostId);
                            io.to(game.pin).emit('questionOver', playerData, correctAnswer);
                        } else {
                            io.to(game.pin).emit('updatePlayersAnswered', {
                                playersInGame: playerNum.length,
                                playersAnswered: game.gameData.playersAnswered,
                            });
                        }

                        db.close();
                    });
            });
        }
    });

    socket.on('getScore', function () {
        console.log('on: getScore')
        var player = players.getPlayer(socket.id);
        socket.emit('newScore', player.gameData.score);
    });

    socket.on('time', function (data) {
        console.log('on: time', data)
        var time = data.time / 20;
        time = time * 100;
        var playerid = data.player;
        var player = players.getPlayer(playerid);
        player.gameData.score += time;
    });

    socket.on('timeUp', function () {
        console.log('on: timeUp')
        var game = games.getGame(socket.id);
        game.gameData.questionLive = false;
        var playerData = players.getPlayers(game.hostId);

        var gameQuestion = game.gameData.question;
        var gameid = game.gameData.gameid;

        MongoClient.connect(url, function (err, db) {
            if (err) throw err;

            var dbo = db.db('kahootDB');
            var query = { id: parseInt(gameid) };
            dbo.collection('kahootGames')
                .find(query)
                .toArray(function (err, res) {
                    if (err) throw err;
                    var correctAnswer = res[0].questions[gameQuestion - 1].correct;
                    io.to(game.pin).emit('questionOver', playerData, correctAnswer);

                    db.close();
                });
        });
    });

    socket.on('nextQuestion', function () {
        console.log('on: nextQuestion')
        var playerData = players.getPlayers(socket.id);

        for (var i = 0; i < Object.keys(players.players).length; i++) {
            if (players.players[i].hostId == socket.id) {
                players.players[i].gameData.answer = 0;
            }
        }

        var game = games.getGame(socket.id);
        game.gameData.playersAnswered = 0;
        game.gameData.questionLive = true;
        game.gameData.question += 1;
        var gameid = game.gameData.gameid;

        MongoClient.connect(url, function (err, db) {
            if (err) throw err;

            var dbo = db.db('kahootDB');
            var query = { id: parseInt(gameid) };
            dbo.collection('kahootGames')
                .find(query)
                .toArray(function (err, res) {
                    if (err) throw err;

                    if (res[0].questions.length >= game.gameData.question) {
                        var questionNum = game.gameData.question;
                        questionNum = questionNum - 1;
                        var question = res[0].questions[questionNum].question;
                        var answer1 = res[0].questions[questionNum].answers[0];
                        var answer2 = res[0].questions[questionNum].answers[1];
                        var answer3 = res[0].questions[questionNum].answers[2];
                        var answer4 = res[0].questions[questionNum].answers[3];
                        var correctAnswer = res[0].questions[questionNum].correct;

                        socket.emit('gameQuestions', {
                            q1: question,
                            a1: answer1,
                            a2: answer2,
                            a3: answer3,
                            a4: answer4,
                            correct: correctAnswer,
                            playersInGame: playerData.length,
                            questionNum: questionNum + 1,
                            questionLen: res[0].questions.length,
                        });
                        db.close();
                    } else {
                        var playersInGame = players.getPlayers(game.hostId);
                        var first = { name: '', score: 0 };
                        var second = { name: '', score: 0 };
                        var third = { name: '', score: 0 };
                        var fourth = { name: '', score: 0 };
                        var fifth = { name: '', score: 0 };

                        for (var i = 0; i < playersInGame.length; i++) {
                            console.log(playersInGame[i].gameData.score);
                            if (playersInGame[i].gameData.score > fifth.score) {
                                if (playersInGame[i].gameData.score > fourth.score) {
                                    if (playersInGame[i].gameData.score > third.score) {
                                        if (playersInGame[i].gameData.score > second.score) {
                                            if (playersInGame[i].gameData.score > first.score) {
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
                                            } else {
                                                fifth.name = fourth.name;
                                                fifth.score = fourth.score;

                                                fourth.name = third.name;
                                                fourth.score = third.score;

                                                third.name = second.name;
                                                third.score = second.score;

                                                second.name = playersInGame[i].name;
                                                second.score = playersInGame[i].gameData.score;
                                            }
                                        } else {
                                            fifth.name = fourth.name;
                                            fifth.score = fourth.score;

                                            fourth.name = third.name;
                                            fourth.score = third.score;

                                            third.name = playersInGame[i].name;
                                            third.score = playersInGame[i].gameData.score;
                                        }
                                    } else {
                                        fifth.name = fourth.name;
                                        fifth.score = fourth.score;

                                        fourth.name = playersInGame[i].name;
                                        fourth.score = playersInGame[i].gameData.score;
                                    }
                                } else {
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
                            num5: fifth.name,
                        });
                    }
                });
        });

        io.to(game.pin).emit('nextQuestionPlayer');
    });

    socket.on('startGame', () => {
        console.log('on: startGame')
        var game = games.getGame(socket.id);
        game.gameLive = true;
        socket.emit('gameStarted', game.hostId);
    });

    socket.on('requestDbNames', function () {
        console.log('on: requestDbNames')
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;

            var dbo = db.db('kahootDB');
            dbo.collection('kahootGames')
                .find()
                .toArray(function (err, res) {
                    if (err) throw err;
                    socket.emit('gameNamesData', res);
                    db.close();
                });
        });
    });

    socket.on('newQuiz', function (data) {
        console.log('on: newQuiz', data)

        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db('kahootDB');
            dbo.collection('kahootGames')
                .find({})
                .toArray(function (err, result) {
                    if (err) throw err;
                    var num = Object.keys(result).length;
                    if (num == 0) {
                        data.id = 1;
                        num = 1;
                    } else {
                        data.id = result[num - 1].id + 1;
                    }
                    var game = data;
                    dbo.collection('kahootGames').insertOne(game, function (err, res) {
                        if (err) throw err;
                        db.close();
                    });
                    db.close();
                    socket.emit('startGameFromCreator', num);
                });
        });
    });
});
