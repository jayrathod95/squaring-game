var express = require('express');
var uuid = require('uuid/v4');
var fs = require('fs');

var app = express();
var router = express.Router();
var game = require('./../core/core');


router.get('/', function (req, res) {
    if (req.param('new') == 'true') {
        console.log('New Game Requested');
        req.session.destroy();
        res.redirect('/play')
    } else {
        session = req.session;
        if (session.playid && session.username) {
            res.render('main', {session: req.session});
        } else res.render('starter');
    }
});


router.post('/', function (req, res) {
    username = req.param('username');
    if (username)
        if (req.param('mode') == 'create') {
            game.createGame(2, 6, username);
            req.session.maxplayers = game.getMaxPlayers();
            req.session.username = username;
            req.session.playid = game.playid;
            res.render('main', {session: req.session});
        } else if (req.param('mode') == 'join' && req.param('playid')) {
            playid = req.param('playid');
            game.playid = playid;
            try {
                game.joinGame(username);
                req.session.username = username;
                req.session.playid = playid;
                req.session.opponents = game.getOpponentsFor(username);
                res.render('main', {session: req.session});
            } catch (e) {
                console.log(e);
                res.render('starter', {error: 'Invalid PlayId Provided'});
            }
            //else res.render('starter', {error: 'Invalid PlayId Provided'});
            //else res.render('starter', {error: 'Cannot join game. ' + Object.keys(obj.players).length + ' of ' + obj.maxplayers + ' players joined.'})
        }
    else res.render('starter', {error: 'Username Is Required'});
});


module.exports = router;