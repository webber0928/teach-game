var socket = io();

var params = jQuery.deparam(window.location.search); //Gets the id from url

var timer;

let time = 20;

socket.on('connect', function() {
    socket.emit('host-join-game', params);
});

socket.on('noGameFound', function(){
    window.location.href = '../../';//Redirect user to 'join game' page
});

function imgHtml(ans) {
    let template = `<div> ${ans}</div><img style="height:250px;" src="/assets/img/Q1/${ans}.png" />"`
    return template
}

socket.on('gameQuestions', function(data){
    document.getElementById('question').innerHTML = data.q1;
    document.getElementById('answer1').innerHTML = imgHtml(data.a1);
    document.getElementById('answer2').innerHTML = imgHtml(data.a2);
    document.getElementById('answer3').innerHTML = imgHtml(data.a3);
    document.getElementById('answer4').innerHTML = imgHtml(data.a4);
    let correctAnswer = data.correct;
    document.getElementById('playersAnswered').innerHTML = "玩家回答 0 / " + data.playersInGame;
    document.getElementById('questionNum').innerHTML = `問題 ${data.questionNum} / ${data.questionLen}`;
    updateTimer();
});

socket.on('updatePlayersAnswered', function(data){
    document.getElementById('playersAnswered').innerHTML = "玩家回答 " + data.playersAnswered + " / " + data.playersInGame;
});

socket.on('questionOver', function(playerData, correct){
    clearInterval(timer);
    let answer1 = 0;
    let answer2 = 0;
    let answer3 = 0;
    let answer4 = 0;
    let total = 0;
    //Hide elements on page
    document.getElementById('playersAnswered').style.display = "none";
    document.getElementById('timerText').style.display = "none";
    document.getElementById('play-btn').style.display = "none";
    
    //Shows user correct answer with effects on elements
    if(correct == 1){
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        let current = document.getElementById('answer1').innerHTML;
        document.getElementById('answer1').innerHTML = current.replace("<div> ", "<div> &#10004 ");
    }else if(correct == 2){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        let current = document.getElementById('answer2').innerHTML;
        document.getElementById('answer2').innerHTML = current.replace("<div> ", "<div> &#10004 ");
    }else if(correct == 3){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer4').style.filter = "grayscale(50%)";
        let current = document.getElementById('answer3').innerHTML;
        document.getElementById('answer3').innerHTML = current.replace("<div> ", "<div> &#10004 ");
    }else if(correct == 4){
        document.getElementById('answer1').style.filter = "grayscale(50%)";
        document.getElementById('answer2').style.filter = "grayscale(50%)";
        document.getElementById('answer3').style.filter = "grayscale(50%)";
        let current = document.getElementById('answer4').innerHTML;
        document.getElementById('answer4').innerHTML = current.replace("<div> ", "<div> &#10004 ");
    }
    
    for(let i = 0; i < playerData.length; i++){
        if(playerData[i].gameData.answer == 1){
            answer1 += 1;
        }else if(playerData[i].gameData.answer == 2){
            answer2 += 1;
        }else if(playerData[i].gameData.answer == 3){
            answer3 += 1;
        }else if(playerData[i].gameData.answer == 4){
            answer4 += 1;
        }
        total += 1;
    }
    
    //Gets values for graph
    answer1 = answer1 / total * 100;
    answer2 = answer2 / total * 100;
    answer3 = answer3 / total * 100;
    answer4 = answer4 / total * 100;
    
    document.getElementById('square1').style.display = "inline-block";
    document.getElementById('square2').style.display = "inline-block";
    document.getElementById('square3').style.display = "inline-block";
    document.getElementById('square4').style.display = "inline-block";
    
    document.getElementById('square1').style.height = answer1 + "px";
    document.getElementById('square2').style.height = answer2 + "px";
    document.getElementById('square3').style.height = answer3 + "px";
    document.getElementById('square4').style.height = answer4 + "px";
    
    document.getElementById('nextQButton').style.display = "block";
    
});

function playQuestion () {
    // document.getElementById('trumpet').style.display = "block";
    let q = document.getElementById('question').textContent
    let audio = document.getElementById("tts-audio");
    audio.src=`https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${q}`;
    audio.playbackRate = 1;
    audio.play()
    // document.getElementById('trumpet').style.display = "none";
    // play-btn
}

function nextQuestion(){
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";
    
    document.getElementById('answer1').style.filter = "none";
    document.getElementById('answer2').style.filter = "none";
    document.getElementById('answer3').style.filter = "none";
    document.getElementById('answer4').style.filter = "none";
    
    document.getElementById('playersAnswered').style.display = "block";
    document.getElementById('play-btn').style.display = "block";
    document.getElementById('timerText').style.display = "block";
    document.getElementById('num').innerHTML = ` ${time}`;
    socket.emit('nextQuestion'); //Tell server to start new question
}

function updateTimer(){
    time = 20;
    timer = setInterval(function(){
        time -= 1;
        document.getElementById('num').textContent = " " + time;
        if(time == 0){
            socket.emit('timeUp');
        }
    }, 1000);
}
socket.on('GameOver', function(data){
    document.getElementById('nextQButton').style.display = "none";
    document.getElementById('square1').style.display = "none";
    document.getElementById('square2').style.display = "none";
    document.getElementById('square3').style.display = "none";
    document.getElementById('square4').style.display = "none";
    
    document.getElementById('answer1').style.display = "none";
    document.getElementById('answer2').style.display = "none";
    document.getElementById('answer3').style.display = "none";
    document.getElementById('answer4').style.display = "none";
    document.getElementById('timerText').innerHTML = "";
    document.getElementById('question').innerHTML = "GAME OVER";
    document.getElementById('playersAnswered').innerHTML = "";
    document.getElementById('play-btn').style.display = "none";
    
    
    
    document.getElementById('winner1').style.display = "block";
    document.getElementById('winner2').style.display = "block";
    document.getElementById('winner3').style.display = "block";
    document.getElementById('winner4').style.display = "block";
    document.getElementById('winner5').style.display = "block";
    document.getElementById('winnerTitle').style.display = "block";
    
    document.getElementById('winner1').innerHTML = "1. " + data.num1;
    document.getElementById('winner2').innerHTML = "2. " + data.num2;
    document.getElementById('winner3').innerHTML = "3. " + data.num3;
    document.getElementById('winner4').innerHTML = "4. " + data.num4; 
    document.getElementById('winner5').innerHTML = "5. " + data.num5;
});



socket.on('getTime', function(player){
    socket.emit('time', {
        player: player,
        time: time
    });
});




















