const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const { LiveGames } = require('./utils/liveGames');
const { Players } = require('./utils/players');

const frontendPath = path.join(__dirname, '../frontend');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const SqliteDB = require('./db.js').SqliteDB;
const file = './data/db/CALL_DB.db';
const sqliteDB = new SqliteDB(file);
sqliteDB.createTable('CREATE TABLE IF NOT EXISTS GameInfo (id INTEGER, name TEXT, questions TEXT)');

const games = new LiveGames();
const players = new Players();

app.use(express.static(frontendPath));
server.listen(3000, () => {
    console.log('Server started on port 3000');
});

function logger (event) {
    console.log(`socket event: ${event}`);
}

io.on('connection', (socket) => {
    logger('connection');
    //當主機第一次連線時
    socket.on('host-join', (data) => {
        logger('host-join');

        const querySql = `select * from GameInfo where id = ${parseInt(data.id)}`;
        sqliteDB.queryData(querySql, (result) => {
            for (let i = 0; i < result.length; ++i) {
                if (result[0] !== undefined) {
                    let gamePin = Math.floor(Math.random() * 90000) + 10000;
                    // let gamePin = 9000; //new pin for game

                    console.log(gamePin, socket.id)

                    games.addGame(gamePin, socket.id, false, {
                        playersAnswered: 0,
                        questionLive: false,
                        gameid: data.id,
                        question: 1,
                    }); //Creates a game with pin and host id

                    let game = games.getGame(socket.id); //Gets the game data
                    socket.join(game.pin); //The host is joining a room based on the pin
                    console.log('Game Created with pin:', game.pin);
                    //Sending game pin to host so they can display it for players to join
                    socket.emit('showGamePin', {
                        pin: game.pin,
                    });
                } else {
                    socket.emit('noGameFound');
                }
                // sqliteDB.close();
            }
        });
    });

    //當主機從遊戲視圖連線時
    socket.on('host-join-game', (data) => {
        logger('host-join-game');

        let oldHostId = data.id;
        let game = games.getGame(oldHostId); //Gets game with old host id
        if (game) {
            game.hostId = socket.id; //Changes the game host id to new host id
            socket.join(game.pin);
            let playerData = players.getPlayers(oldHostId); //Gets player in game
            for (let i = 0; i < Object.keys(players.players).length; i++) {
                if (players.players[i].hostId == oldHostId) {
                    players.players[i].hostId = socket.id;
                }
            }
            let gameid = game.gameData['gameid'];

            const querySql = `select * from GameInfo where id = ${parseInt(gameid)};`;
            sqliteDB.queryData(querySql, (result) => {
                for (let i = 0; i < result.length; ++i) {
                    result[0].questions[0] = JSON.parse(questions[0])
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
                    });
                    // sqliteDB.close();
                }
            });

            io.to(game.pin).emit('gameStartedPlayer');
            game.gameData.questionLive = true;
        } else {
            socket.emit('noGameFound'); //No game was found, redirect user
        }
    });

    //當玩家第一次連線時
    socket.on('player-join', (params) => {
        logger('player-join');

        let gameFound = false; //If a game is found with pin provided by player

        //For each game in the Games class
        for (let i = 0; i < games.games.length; i++) {
            //If the pin is equal to one of the game's pin
            if (params.pin == games.games[i].pin) {
                console.log('Player connected to game');

                let hostId = games.games[i].hostId; //Get the id of host of game
                players.addPlayer(hostId, socket.id, params.name, { score: 0, answer: 0 }); //add player to game
                socket.join(params.pin); //Player is joining room based on pin
                let playersInGame = players.getPlayers(hostId); //Getting all players in game
                io.to(params.pin).emit('updatePlayerLobby', playersInGame); //Sending host player data to display
                gameFound = true; //Game has been found
            }
        }

        //If the game has not been found
        if (gameFound == false) {
            socket.emit('noGameFound'); //Player is sent back to 'join' page because game was not found with pin
        }
    });

    //當玩家從遊戲視圖連線時
    socket.on('player-join-game', (data) => {
        logger('player-join-game');

        let player = players.getPlayer(data.id);
        if (player) {
            let game = games.getGame(player.hostId);
            socket.join(game.pin);
            player.playerId = socket.id; //Update player id with socket id

            let playerData = players.getPlayers(game.hostId);
            socket.emit('playerGameData', playerData);
        } else {
            socket.emit('noGameFound'); //No player found
        }
    });

    //當主持人或玩家離開網站時
    socket.on('disconnect', () => {
        logger('disconnect');

        let game = games.getGame(socket.id); //Finding game with socket.id
        //If a game hosted by that id is found, the socket disconnected is a host
        if (game) {
            //Checking to see if host was disconnected or was sent to game view
            if (game.gameLive == false) {
                games.removeGame(socket.id); //Remove the game from games class
                console.log('Game ended with pin:', game.pin);

                let playersToRemove = players.getPlayers(game.hostId); //Getting all players in the game

                //For each player in the game
                for (let i = 0; i < playersToRemove.length; i++) {
                    players.removePlayer(playersToRemove[i].playerId); //Removing each player from player class
                }

                io.to(game.pin).emit('hostDisconnect'); //Send player back to 'join' screen
                socket.leave(game.pin); //Socket is leaving room
            }
        } else {
            //No game has been found, so it is a player socket that has disconnected
            let player = players.getPlayer(socket.id); //Getting player with socket.id
            //If a player has been found with that id
            if (player) {
                let hostId = player.hostId; //Gets id of host of the game
                let game = games.getGame(hostId); //Gets game data with hostId
                let pin = game.pin; //Gets the pin of the game

                if (game.gameLive == false) {
                    players.removePlayer(socket.id); //Removes player from players class
                    let playersInGame = players.getPlayers(hostId); //Gets remaining players in game

                    io.to(pin).emit('updatePlayerLobby', playersInGame); //Sends data to host to update screen
                    socket.leave(pin); //Player is leaving the room
                }
            }
        }
    });

    //設定玩家類別中的資料以供玩家回答
    socket.on('playerAnswer', function (num) {
        logger('playerAnswer');

        let player = players.getPlayer(socket.id);
        let hostId = player.hostId;
        let playerNum = players.getPlayers(hostId);
        let game = games.getGame(hostId);
        if (game.gameData.questionLive == true) {
            //有問題繼續
            player.gameData.answer = num;
            game.gameData.playersAnswered += 1;

            let gameQuestion = game.gameData.question;
            let gameid = game.gameData.gameid;

            const querySql = `select * from GameInfo where id = ${parseInt(gameid)}`;
            sqliteDB.queryData(querySql, (res) => {
                for (let i = 0; i < res.length; ++i) {
                    let correctAnswer = res[0].questions[gameQuestion - 1].correct;
                    // 檢查玩家的答案是否正確
                    if (num == correctAnswer) {
                        player.gameData.score += 100;
                        io.to(game.pin).emit('getTime', socket.id);
                        socket.emit('answerResult', true);
                    }

                    // 檢查是否所有玩家都回答了
                    if (game.gameData.playersAnswered == playerNum.length) {
                        game.gameData.questionLive = false; // 問題已經結束，因為玩家都在規定時間內回答了
                        let playerData = players.getPlayers(game.hostId);
                        io.to(game.pin).emit('questionOver', playerData, correctAnswer); // 告訴大家問題結束了
                    } else {
                        // 更新已回答玩家數的主機螢幕
                        io.to(game.pin).emit('updatePlayersAnswered', {
                            playersInGame: playerNum.length,
                            playersAnswered: game.gameData.playersAnswered,
                        });
                    }
                    // sqliteDB.close();
                }
            });
        }
    });

    socket.on('getScore', function () {
        logger('getScore');

        let player = players.getPlayer(socket.id);
        socket.emit('newScore', player.gameData.score);
    });

    socket.on('time', function (data) {
        logger('time');

        let time = data.time / 20;
        time = time * 100;
        let playerId = data.player;
        let player = players.getPlayer(playerId);
        player.gameData.score += time;
    });

    socket.on('timeUp', function () {
        logger('timeUp');

        let game = games.getGame(socket.id);
        game.gameData.questionLive = false;
        let playerData = players.getPlayers(game.hostId);

        let gameQuestion = game.gameData.question;
        let gameid = game.gameData.gameid;

        const querySql = `select * from GameInfo where id = ${parseInt(gameid)}`;
        sqliteDB.queryData(querySql, (res) => {
            for (let i = 0; i < res.length; ++i) {
                let correctAnswer = res[0].questions[gameQuestion - 1].correct;
                io.to(game.pin).emit('questionOver', playerData, correctAnswer);
                // sqliteDB.close();
            }
        });
    });

    socket.on('nextQuestion', function () {
        logger('nextQuestion');

        let playerData = players.getPlayers(socket.id);
        for (let i = 0; i < Object.keys(players.players).length; i++) {
            if (players.players[i].hostId == socket.id) {
                players.players[i].gameData.answer = 0;
            }
        }

        let game = games.getGame(socket.id);
        game.gameData.playersAnswered = 0;
        game.gameData.questionLive = true;
        game.gameData.question += 1;
        let gameid = game.gameData.gameid;

        const querySql = `select * from GameInfo where id = ${parseInt(gameid)}`;
        sqliteDB.queryData(querySql, (res) => {
            for (let i = 0; i < res.length; ++i) {
                if (res[0].questions.length >= game.gameData.question) {
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
                    });
                    // db.close();
                } else {
                    let playersInGame = players.getPlayers(game.hostId);
                    let first = { name: '', score: 0 };
                    let second = { name: '', score: 0 };
                    let third = { name: '', score: 0 };
                    let fourth = { name: '', score: 0 };
                    let fifth = { name: '', score: 0 };

                    for (let i = 0; i < playersInGame.length; i++) {
                        console.log(playersInGame[i].gameData.score);
                        if (playersInGame[i].gameData.score > fifth.score) {
                            if (playersInGame[i].gameData.score > fourth.score) {
                                if (playersInGame[i].gameData.score > third.score) {
                                    if (playersInGame[i].gameData.score > second.score) {
                                        if (playersInGame[i].gameData.score > first.score) {
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
                                        } else {
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
                                    } else {
                                        //Third Place
                                        fifth.name = fourth.name;
                                        fifth.score = fourth.score;

                                        fourth.name = third.name;
                                        fourth.score = third.score;

                                        third.name = playersInGame[i].name;
                                        third.score = playersInGame[i].gameData.score;
                                    }
                                } else {
                                    //Fourth Place
                                    fifth.name = fourth.name;
                                    fifth.score = fourth.score;

                                    fourth.name = playersInGame[i].name;
                                    fourth.score = playersInGame[i].gameData.score;
                                }
                            } else {
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
                        num5: fifth.name,
                    });
                }
                // sqliteDB.close();
            }
        });

        io.to(game.pin).emit('nextQuestionPlayer');
    });

    //當主機開始遊戲時
    socket.on('startGame', () => {
        logger('startGame');

        let game = games.getGame(socket.id);
        game.gameLive = true;
        socket.emit('gameStarted', game.hostId);
    });

    //為用戶提供遊戲名稱數據
    socket.on('requestDbNames', function () {
        logger('requestDbNames');

        const querySql = `select * from GameInfo;`;
        sqliteDB.queryData(querySql, (res) => {
            socket.emit('gameNamesData', res);
            // sqliteDB.close();
        });
    });

    socket.on('newQuiz', function (data) {
        logger('newQuiz');

        const querySql = `select * from GameInfo`;
        sqliteDB.queryData(querySql, (res) => {
            let num = Object.keys(res).length;
            if (num == 0) {
                data.id = 1;
                num = 1;
            } else {
                data.id = res[num - 1].id + 1;
            }
            data.questions = JSON.stringify(data.questions);
            sqliteDB.insertData(`insert into GameInfo(id, name, questions) values(?, ?, ?)`, [
                [data.id, data.name, data.questions],
            ]);

            socket.emit('startGameFromCreator', num);
            // sqliteDB.close();
        });
    });
});
