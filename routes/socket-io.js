var express = require('express');
var router = express.Router();
var io = require('socket.io')(8080);
var logger = require('../core/logger');
var path = require('path');


router.get('/',function(req,res){
    //logger('/socket-io accessed');
    console.log('aaa'+path.basename('/'));
    res.render('ws-client');
});




module.exports = router;
