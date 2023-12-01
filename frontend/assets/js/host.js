var socket = io();
var params = jQuery.deparam(window.location.search);

socket.on('connect', function () {
    document.getElementById('players').value = '';
    socket.emit('host-join', params);
});

socket.on('showGamePin', function (data) {
    document.getElementById('gamePinText').innerHTML = data.pin;
});

socket.on('updatePlayerLobby', function (data) {
    document.getElementById('players').value = '';

    for (let i = 0; i < data.length; i++) {
        document.getElementById('players').value += data[i].name + ', ';
    }
});

function startGame() {
    socket.emit('startGame');
}
function endGame() {
    window.location.href = '/';
}

socket.on('gameStarted', function (id) {
    console.log('Game Started!');
    window.location.href = '/host/game/' + '?id=' + id;
});

socket.on('noGameFound', function () {
    window.location.href = '../../';
});
