var socketio = require('socket.io');
var globals = require('./globals');
var discovery = require('./resource-discovery');
var observations = require('./observations.js');
var _ = require('lodash');

module.exports = {

    startSocketIo: function(server) {

        var io = socketio.listen(server);

        io.sockets.on('connection', function(socket) {

            globals.socket = socket;

            console.log('New connection from ' + socket.request.connection.remoteAddress);

            // Raw resource discovery (no input parameters) or phenomena/location-based SPARQL queries
            socket.on('resource_discovery_req', function(data) {
                // No external parameters, no need for a new SPARQL and hence, we return the whole set of resources
                if (data === undefined) {
                    socket.emit('resource_discovery_resp', discovery.getAllResources());
                } else {                                        
                    discovery.sparqlDiscovery(data);
                }
            })

            socket.on('location_from_observation_req', function(object) {                                
                observations.getLocation(object);
            })

            socket.on('gather_stats_req', function(object) {                
                socket.emit('gather_stats_resp', discovery.getStats());
            })

            socket.on('resource_latency_req', function() {
                socket.emit('resource_latency_resp', _.last(globals.resource_discovery));
            })

            socket.on('mapbox_credentials_request', function() {
                socket.emit('mapbox_credentials_response', {
                    'style': globals.config.mapbox_style,
                    'token': globals.config.mapbox_access_token
                });
            })

            socket.on('observation_last_value_req', function(object) {
                observations.observationLastValueFromEndpoint(object);
            })

            socket.on('observation_last_value_sparql_req', function(object) {
                observations.observationLastValueSparql(object);
            })

            socket.on('clientLogging', function(msg) {
                globals.logger.log('info', new Date().toUTCString() + ' - ' + msg);
            })

        });
    }
};