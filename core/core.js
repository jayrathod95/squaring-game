var fs = require('fs');
var uuid = require('uuid/v4');
var assert = require('assert');

var game = {
    playid: undefined,
    gameObj: undefined,
    socket: undefined,
    wsserver: undefined,
    whoseTurnIsIt:function(){
        username = Object.keys(this.getJoinedPlayers())[this.gameObj.whoseTurnIsIt];
        //console.log(username); 
        return username;
    },
    createGame: function (maxplayers, gridDimension, username) {
        this.playid = uuid();
        this.gameObj = {
            playid: this.playid,
            maxplayers: maxplayers,
            griddimension: gridDimension,
            players: {},
            progress: {},
            squaresFormed:{},
            whoseTurnIsIt: 0
        };
        this.addPlayer(username, true);
        this.updateGameObj();
    },
    joinGame : function (username) {
        this.initGameObj();
        this.addPlayer(username,false);
        this.updateGameObj();
    },
    addPlayer: function (username, isCreator) {
        this.initGameObj();
        if (Object.keys(this.getJoinedPlayers()).length < this.getMaxPlayers()) {
            this.gameObj.players[username] = {creator: isCreator};
            this.updateGameObj();
        } else throw new Error('Max Players Reached.');
    },
    initGameObj: function () {
        if (!this.gameObj) {
            this.playidCheck();
            this.gameObj = JSON.parse(fs.readFileSync(playid + '.json'))
        }
    },
    updateGameObj: function () {
        fs.writeFileSync(this.playid + '.json', JSON.stringify(this.gameObj))
    },
    getMaxPlayers: function () {
        this.initGameObj();
        return this.gameObj.maxplayers;
    },
    getJoinedPlayers: function () {
        //this.initGameObj();
        return this.gameObj.players;
    },
    getPlayerByUsername: function (username) {
        return this.getJoinedPlayers()[username];
    },
    setWsid: function (username, wsid) {
        this.initGameObj();
        this.gameObj.players[username].wsid = wsid;
        this.updateGameObj();
    },
    getWsid: function (username) {
        this.initGameObj();
        return this.gameObj.players[username].wsid;
    },
    markEdge: function (username, edgeid) {
        //this.initGameObj();
        this.gameObj.progress[edgeid] = true;
        this.toggleTurn(username);
        this.runSpider(username,edgeid)
        //this.updateGameObj();
    },
    playidCheck: function () {
        if (!this.playid) throw new Error('playid not provided');
    },
    getEdgeMarkings: function () {
        this.initGameObj();
        return this.gameObj.progress;
    },
    getOpponentsFor : function(username){
        players = JSON.parse(JSON.stringify(this.getJoinedPlayers()));
        if(players)
        delete players[username];
        return players;
    },
    pingPlayers : function(event,data){
        if(!this.socket)throw new Error('ws connection object is undefined')
        players = this.getJoinedPlayers();
        console.log('Pinging event '+event+' to players '+JSON.stringify(players));
        for(player in players)
            this.wsserver.of('/').to(players[player].wsid).emit(event,data);
    },
    pingOpponents : function(opponentsFor, socket, event, data){
        if(!socket)throw new Error('ws connection object is undefined')
        oppo = this.getOpponentsFor(opponentsFor);
        for(key in oppo)
            socket.to(oppo[key].wsid).emit(event,data);
    },
    toggleTurn : function(username){
        //console.log((this.gameObj.whoseTurnIsIt+1)%(Object.keys(this.getJoinedPlayers()).length));
        this.gameObj.whoseTurnIsIt = (this.gameObj.whoseTurnIsIt+1)%(Object.keys(this.getJoinedPlayers()).length);
    },
    runSpider : function(username,edgeid){
        dim = this.gameObj.griddimension;
        edge = {
            id:edgeid,
            x1:parseInt(edgeid.split('-')[0]),
            y1:parseInt(edgeid.split('-')[1]),
            x2:parseInt(edgeid.split('-')[2]),
            y2:parseInt(edgeid.split('-')[3]),
            getOrientation: function(){
                return (this.x1==this.x2)?'H':'V';
            },
            getAdjacentSquares : function(){
                var squares = new Array();
                x1=this.x1;
                x2=this.x2;
                y1=this.y1;
                y2=this.y2;
                switch(this.getOrientation()){
                    case 'H':
                        switch(x1){
                            case 0:
                                square = {
                                    id: this.x1+'_'+this.y1,
                                    edges: [x1+'-'+y1+'-'+x2+'-'+y2,(x1+1)+'-'+y1+'-'+(x2+1)+'-'+y2,x1+'-'+y1+'-'+(x2+1)+'-'+(y2-1),x1+'-'+(y1+1)+'-'+(x2+1)+'-'+y2]
                                }
                                squares.push(square);
                                return squares;

                            case dim-1:
                                square = {
                                    id: (this.x1-1)+'_'+this.y1,
                                    edges:[(x1-1)+'-'+y1+'-'+(x2-1)+'-'+y2,x1+'-'+y1+'-'+x2+'-'+y2,(x1-1)+'-'+y1+'-'+(x2)+'-'+(y2-1),(x1-1)+'-'+(y1+1)+'-'+x2+'-'+y2]
                                }
                                squares.push(square);
                                return squares;
                            default:
                                //upper one
                                square1 = {
                                    id:(this.x1-1)+'_'+this.y1,
                                    edges:[(this.x1-1)+'-'+this.y1+'-'+(this.x2-1)+'-'+this.y2,this.x1+'-'+this.y1+'-'+this.x2+'-'+this.y2,(this.x1-1)+'-'+this.y1+'-'+this.x2+'-'+(this.y2-1),(this.x1-1)+'-'+(this.y1+1)+'-'+this.x2+'-'+this.y2]
                                };
                                //lower one
                                square2 = {
                                    id: this.x1+'_'+this.y1,
                                    edges:[this.x1+'-'+this.y1+'-'+this.x2+'-'+this.y2,(this.x1+1)+'-'+this.y1+'-'+(this.x2+1)+'-'+this.y2,this.x1+'-'+this.y1+'-'+(this.x2+1)+'-'+(this.y2-1),this.x1+'-'+(this.y1+1)+'-'+(this.x2+1)+'-'+this.y2]
                                }

                                squares.push(square1);
                                squares.push(square2);
                        }
                    break;
                    case 'V':
                        switch(y1){
                            case 0 :
                                square = {
                                    id: x1+'_'+y1,
                                    edges:[x1+'-'+y1+'-'+(x2-1)+'-'+(y2+1),(x1+1)+'-'+y1+'-'+x2+'-'+(y2+1),x1+'-'+y1+'-'+x2+'-'+y2,x1+'-'+(y1+1)+'-'+x2+'-'+(y2+1)]
                                }
                                squares.push(square)
                                break;
                            case dim-1:
                                square = {
                                    id:x1+'_'+(y1-1),
                                    edges:[x1+'-'+(y1-1)+'-'+(x2-1)+'-'+y2,(x1+1)+'-'+(y1-1)+'-'+x2+'-'+y2,x1+'-'+(y1-1)+'-'+x2+'-'+(y2-1),x1+'-'+y1+'-'+x2+'-'+y2]
                                }
                                squares.push(square)
                                break;
                            default:
                                square1={
                                    id: x1+'_'+(y1-1),
                                    edges: [x1+'-'+(y1-1)+'-'+(x2-1)+'-'+y2,(x1+1)+'-'+(y1-1)+'-'+x2+'-'+y2,x1+'-'+(y1-1)+'-'+x2+'-'+(y2-1),x1+'-'+y1+'-'+x2+'-'+y2] 

                                }
                                square2={
                                    id: x1+'_'+y1,
                                    edges: [x1+'-'+y1+'-'+(x2-1)+'-'+(y2+1),(x1+1)+'-'+y1+'-'+x2+'-'+(y2+1),x1+'-'+y1+'-'+x2+'-'+y2,x1+'-'+(y1+1)+'-'+x2+'-'+(y2+1)]
                                }
                                squares.push(square1);
                                squares.push(square2);
                        }
                    break;
                };
                return squares;
            }
        };
        //console.log(edge.orientation + '-'+edge.x1+''+edge.y1+''+edge.x2+''+edge.y2+''+JSON.stringify(edge.getAdjacentSquares()));
        debugger;
        squares = edge.getAdjacentSquares();
        //console.log('edgeid: '+edgeid)
        //console.log(squares);
        progress = this.gameObj.progress;
        for(square in squares){
            var formsSquare= false;
            edges = squares[square].edges;
            for(edge in edges)
                if(!(formsSquare=(edges[edge] in progress)))break;
            if(formsSquare){
                //console.log('formsSquare - '+squares[square].id+', markedBy: '+username);
                this.gameObj.squaresFormed[squares[square].id] = username;
                this.pingPlayers('markSquare',{squareid:squares[square].id,markedBy:username});
            }
        }
    },

};

module.exports = game;