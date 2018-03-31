var fs = require('fs');
var game = require('./core/core');



var onmarkedge = function(socket,data,callback){
    console.log(Date.now());
    game.playid = data.playid;
    game.socket = socket;
    game.initGameObj();
    console.log(Date.now());
    game.markEdge(data.username,data.edgeid)
    console.log(Date.now());
    game.pingOpponents(data.username,socket,'markedge',{edgeid: data.edgeid, markedBy: data.username,whoseTurnIsIt:game.whoseTurnIsIt()})
    console.log(Date.now());
    data.whoseTurnIsIt = game.whoseTurnIsIt();
    console.log(Date.now());
    game.updateGameObj();
    console.log(Date.now());
    callback(data);
    console.log(Date.now());
};
var test = function(){

}



var websocket = {
    server : undefined,
    onconnection : function(socket){
        playid = socket.handshake.query.playid;
        username = socket.handshake.query.username;
        console.log(playid + '-' + username);
        game.playid = playid;
        game.wsserver = this.server;
        game.setWsid(username,socket.id);
        socket.emit('ack', 'Websocket Connection Successful');
        socket.on('markedge',function(data,callback){onmarkedge(socket,data,callback)});
        socket.on('test',test)
        game.pingOpponents(username,socket,'peerjoin',{username:username})   
    },
}

module.exports = websocket;
