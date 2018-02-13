var app = require('express')();
const express = require("express");
var http = require('http').Server(app);
var io = require('socket.io')(http);
const uuidV4 = require('uuid/v4');
var mysql = require('mysql');
var crypto = require('crypto');
const locale = require("locale");
const path = require("path");
const fs = require("fs");
const logger = require("./utils/logger");
const partials = require('./utils/partials')();
var connectionCount = 0;
var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '@9&N6y%MKz$%My2t',
  database : 'gamblingsite'
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/signin', function(req, res){
  res.sendFile(__dirname + '/public/name.html');
});
app.get('/roulette', function(req, res){
  res.sendFile(__dirname + '/public/games/roulette.html');
});
app.get('/dice', function(req, res){
  res.sendFile(__dirname + '/public/games/dice.html');
});
app.get('/rockpaperscissors', function(req, res){
  res.sendFile(__dirname + '/public/games/rockpaperscissors.html');
});
app.get('/tradeup', function(req,res) {
	res.sendFile(__dirname + '/public/games/tradeup.html');
});
app.get('/admin', function(req, res){
  res.sendFile(__dirname + '/public/admin.html');
});
app.use("/assets", express.static(path.join(__dirname, "/public/assets")));
//DF117DAAC43741DC20BA663CCB071D0A
var roulette = require('./games/roulette')(io);
http.listen(80, function(){
  logger.info('listening on *:80');
});




io.on('connection', function(socket){
  // on connection:


}); // io.on end


