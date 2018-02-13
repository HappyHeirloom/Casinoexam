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
const logger = require("../utils/logger");
const partials = require('../utils/partials')();
// Roulette
var active = false;
var pastResults = [];
var roulette_countdown;
var betArray = [];
var result;
var result_visible = false;
var gameID;
var round_payout = 0;
var roulette_maxbet = 3000;
var roulette_green_maxbet = 300;
var ioz;
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '@9&N6y%MKz$%My2t',
    database: 'gamblingsite'
});
exports = module.exports =
    function(io) {
      ioz = io;
      game_roulette(io);
        io.sockets.on('connection', function(socket) {
            sendgamestate();
            socket.on('active_bets', function(fn) {
                fn(betArray);
            });
            socket.on('signin', function(name, fn) {
                var username = name;
                connection.query(`SELECT * FROM users WHERE username=?`, [username],
                    function(err, response) {
                        if (err) {
                            logger.info(err);
                        } else {
                            if (response.length == 0) {
                                createUser(username, fn);
                            } else {
                                fn(response[0].UUID);
                            }
                        }
                    });
            });
            socket.on('placebet', function(data, fn) {
                logger.info("placebet");
                var bet_amount = data.betvalue;
                var bet_color = data.betcolor;
                var bet_placer = data.bet_placer;
                if((bet_color == 0 || bet_color == 1) && bet_amount > roulette_maxbet) {
                  return ioz.emit("error",{message:"exceeding maxbet"});
                }else if(bet_color == 2 && bet_amount > roulette_green_maxbet){
                  return ioz.emit("error",{message:"exceeding maxbet"});
                }
                if (bet_amount != undefined && bet_color != undefined && !active) {
                    // confirm bet user
                    connection.query(`SELECT * FROM users WHERE UUID=? AND coins >= ?`, [bet_placer, bet_amount],
                        function(err, response) {
                            if (err) {
                                logger.info("sum ting wong");
                            } else {
                                if (response.length == 0) {
                                    logger.info("invalid user");
                                } else {

                                    updateBetArray(bet_amount, bet_color, bet_placer, response[0].username);
                                    placebet(bet_amount, bet_color, bet_placer, response[0].username, fn);
                                }
                            }
                        });
                } // if end
            });
            socket.on('requestFunds', function(UUID, fn) {
                connection.query(`SELECT coins FROM users WHERE UUID=?`, [UUID],
                    function(err, response) {
                        if (err) {
                            logger.info(err);
                        } else {
                            if (response.length == 1)
                                fn(response[0].coins);
                        }
                    });
            });
            socket.on('getusername', function(UUID, fn) {
                connection.query(`SELECT username FROM users WHERE UUID=?`, [UUID],
                    function(err, response) {
                        if (err) {
                            logger.info(err);
                        } else {
                            if (response.length == 1)
                                fn(response[0].username);
                        }
                    });
            });
        });
    } // (io) end
function updateBetArray(amount, color, userUUID, username) {
    var resultFound = false;
    if (betArray.length == 0) {
        var array_entry = [amount, color, username, userUUID];
        betArray.push(array_entry);
    } else {
        for (var i = 0; i < betArray.length; i++) {
            if (color == betArray[i][1] && username == betArray[i][2]) {
                betArray[i][0] += amount;
                resultFound = true;
                break;
            }
        }
        if (!resultFound) {
            var array_entry = [amount, color, username, userUUID];
            betArray.push(array_entry);
        }
    }
}

function placebet(amount, color, userUUID, username, fn) {
    fn("mhm", {
        "amount": amount,
        "color": color,
        "user": username
    });
    ioz.emit("bet_valid", {
        "amount": amount,
        "color": color,
        "user": username
    });
    losemoney(amount, userUUID);
    logger.info(betArray);
}

function losemoney(amount, UUID) {
    connection.query(`UPDATE users SET coins=coins-? WHERE UUID=?`, [amount, UUID],
        function(err, response) {
            if (err)
                logger.info(err);
        });

}

function startRoulette() {
    active = true;
    result_visible = true;
    result = get_result();
    sendgamestate();
    logger.info("\n SPINNING ROULETTE \n  status: " + active + " \n result visible: " + result_visible);
    setTimeout(reveal_result, 7000);
}

function reveal_result() {
    var total_payout = 0;
    var total_deposited = 0;
    for (var i = 0; i < betArray.length; i++) {
        total_deposited += betArray[i][0];
        if (betArray[i][1] == result[0]) {
            if (result[0] == 2) {
                reward = betArray[i][0] * 14;
                total_payout += reward - betArray[i][0];
                payUser(reward, betArray[i][3]);
            } else {
                reward = betArray[i][0] * 2;
                total_payout += reward - betArray[i][0];
                payUser(reward, betArray[i][3]);
            }
        }
    }
    var house_profit = total_deposited - total_payout;
    var money = "bitches";
    logger.info("Total deposited: " + total_deposited + " - Total payout: " + total_payout + "\n PROFIT: " + house_profit);
    logResult(result[2], result[3], total_deposited, total_payout);
    setTimeout(game_roulette, 4000);
}

function payUser(reward, ID) {

    logger.info("paying " + ID + " " + reward);
    connection.query(`UPDATE users SET coins=coins+? WHERE UUID=?`, [reward, ID],
        function(err, response) {
            if (err) {
                logger.info(err);
            } else {
                round_payout += reward;
            }
        });

}

function get_result() {
    var shasum = crypto.createHash('sha256');
    var number = Math.random() * 14;
    shasum.update(number.toString());
    var hash = shasum.digest('hex');

    if (number < 1) {
        return [2, "#07ab54", 0, hash];
    }
    if (number > 0 && number < 8) {
        return [0, "#D83D42", number, hash];
    }
    if (number >= 8 && number <= 14) {
        return [1, "#000", number, hash];
    }
}

function game_roulette(io) {
    gameID = uuidV4();
    ioz.emit("clear_bets", true);
    result_visible = false;
    active = false;
    betArray = [];
    sendgamestate();
    logger.roulette("\n STARTING ROULETTE GAME \n active: " + active + " \n result visible: " + result_visible);

    // roulette values
    var countdown_time = 18000;
    var countdownInterval = 1000; // time between each countdown
    countdown(io,countdown_time, countdownInterval);

}


function logResult(number, hash, total_deposited, total_payout) {
    var game_name = "roulette";
    var current_time = Date.now();
    connection.query(`INSERT INTO log (gameUUID,game,number,total_deposited,total_payout,shasum,time_stamp) VALUES (?,?,?,?,?,?,?)`, [gameID, game_name, number, total_deposited, total_payout, hash, current_time],
        function(err, response) {
            if (err) {
                logger.info(err);
            } else {
                pastResults.push(result);
            }
        });
}

function countdown(io,ms, interval) {
    // logger.info("starting countdown for "+ms);
    var remaining_time = (ms / interval);
    roulette_countdown = setInterval(function() {
        remaining_time = remaining_time - 1;
        console.log(remaining_time);
        ioz.emit("progress", {
            "countdown": remaining_time
        });
        if (remaining_time == 0) {
            clearInterval(roulette_countdown);
            startRoulette(io);
        }
    }, interval);
}

function createUser(name, fn) {
    var UUID = uuidV4();
    connection.query(`INSERT INTO users (username,coins,UUID) VALUES (?,100,?)`, [name, UUID],
        function(err, response) {
            if (err) {
                logger.info(err);
            } else {
                var inserted_id = response.insertId;
                connection.query(`SELECT UUID FROM users WHERE ID=?`, [inserted_id],
                    function(err, response) {
                        if (err) {
                            logger.info(err);
                        } else {
                            fn(response[0].UUID);
                        }
                    });
            }
        });
}

function authenticated(io, res) {
    ioz.emit("authenticated", {
        "data": res
    });
}

function getusername(UUID, callback) {
    logger.info("get name from UUID " + UUID);
    connection.query(`SELECT username FROM users WHERE UUID=?`, [UUID],
        function(err, response) {
            if (err) {
                logger.info(err);
            } else {
                logger.info(response);
                return response[0].username;
            }
        });
}

function sendgamestate() {
    logger.roulette("SENDING GAME STATE");
    // only send latest 7 results (if there even is 7 XD)
    if (pastResults.length > 7) {
        var Past_array = pastResults.slice(Math.max(pastResults.length - 7, 1));
    } else {
        var Past_array = pastResults;
    }
    if (result_visible == false) {
        ioz.emit("gamestate", {
            "active": active,
            "pastResults": Past_array
        });
    } else {
        ioz.emit("gamestate", {
            "active": active,
            "result": result,
            "pastResults": Past_array
        });
    }

}
