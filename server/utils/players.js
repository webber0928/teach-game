class Players {
    constructor () {
        this.players = [];
    }
    addPlayer(hostId, playerId, name, gameData, answerList){
        let emoji = ['🐭','🐵','🐶','🐷','🐺','🐤','🐧','🐔','🦊','🦄','🦁','🐻','🐯','🐱','🐰','🐴','🐼','🐹','🐸']
        var player = {
            hostId, 
            playerId, 
            name: emoji[Math.floor(Math.random()*emoji.length)] + name, 
            gameData,
            answerList
        };
        this.players.push(player);
        return player;
    }
    removePlayer(playerId){
        var player = this.getPlayer(playerId);
        
        if(player){
            this.players = this.players.filter((player) => player.playerId !== playerId);
        }
        return player;
    }
    getPlayer(playerId){
        return this.players.filter((player) => player.playerId === playerId)[0]
    }
    getPlayers(hostId){
        return this.players.filter((player) => player.hostId === hostId);
    }
}

module.exports = {Players};