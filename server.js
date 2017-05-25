// Server and Socket.io legacy initialization
var exp = require('express')
var express = exp();
var app = require('http').Server(express);

// var mongoose = require('mongoose'); 				// mongoose for mongodb
// var database = require('./config/database'); 		// load the database config
var morgan = require('morgan');
var winston = require('winston');
var bodyParser = require('body-parser');
// var methodOverride = require('method-override');
var favicon = require('serve-favicon');
// var _ = require('lodash');
var io = require('socket.io');

// Internal packages
var globals = require('./js/globals');
var io = require('./js/sockets.js');
var openam = require ('./js/openam.js');
var discovery = require('./js/resource-discovery');

// configuration =======
// mongoose.connect(database.localUrl); 	// Connect to local MongoDB instance. A remoteUrl is also available (modulus.io)

express.use(exp.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
express.use('/bower_components', exp.static(__dirname + '/bower_components'));
express.use('/node_modules', exp.static(__dirname + '/node_modules'));
express.use(morgan('dev')); // log every request to the console

express.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
express.use(bodyParser.json()); // parse application/json
express.use(favicon(__dirname + '/public/images/favicon.ico'));

// routes =======
// require('./app/routes.js')(app);


// listen (start app with node server.js) ======
var server = express.listen(globals.port);

express.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

// First resource discovery (fix for production mode)
globals.IsHttps() ? openam.getOpenAmToken(discovery.sparqlDiscovery) : discovery.sparqlDiscovery();


//  ------- SOCKET.IO HANDLING -------
io.startSocketIo(server);

// var intervalID = setInterval(function(){console.log("Interval reached " + new Date().toUTCString());}, 1000);



//  ------- LOGGING (WINSTON) -------
globals.logger.log('info', new Date().toUTCString() + ' - Server started (Port ' + globals.port + ')');