var express = require('express'),
    steam   = require('steam-login');

var app = express();

app.use(require('express-session')({ resave: false, saveUninitialized: false, secret: 'DF117DAAC43741DC20BA663CCB071D0A' }));
app.use(steam.middleware({
	realm: 'http://localhost:3000/', 
	verify: 'http://localhost:3000/verify',
	apiKey: 'DF117DAAC43741DC20BA663CCB071D0A'}
));

app.get('/', function(req, res) {
	res.send(req.user == null ? 'not logged in' : 'hello ' + req.user.username).end();
});

app.get('/authenticate', steam.authenticate(), function(req, res) {
	res.redirect('/');
});

app.get('/verify', steam.verify(), function(req, res) {
	res.send(req.user).end();
});

app.get('/logout', steam.enforceLogin('/'), function(req, res) {
	req.logout();
	res.redirect('/');
});

app.listen(3000);
console.log('listening');
