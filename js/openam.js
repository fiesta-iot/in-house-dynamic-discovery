var globals = require('./globals.js');
var endpoints = require('./endpoints.js');
var rp = require('request-promise');
var prettyHrtime = require('pretty-hrtime');

var max_attemps = 3;

var self = module.exports = {

    attempts: max_attemps,

    // Function to get the token from OpenAM; as a parameter (optional), it receives a pointer to a function that will 
    // be executed next to receiving the token itself
    getOpenAmToken: function(callback, parameters) {

        var options = {
            method: 'POST',
            uri: globals.config.openam_authentication_endpoint,
            // uri: endpoints.fiesta_testing_sparql_execute_endpoint,
            resolveWithFullResponse: true,
            headers: {
                'X-OpenAM-Username': globals.config.openam_user,                
                'X-OpenAM-Password': globals.config.openam_password,
                'Content-Type': 'application/json'
            }
        };

        var start = process.hrtime();
        rp(options)
            .then(function(response) {
                var end = process.hrtime(start);
                var latency = prettyHrtime(end, {
                    precise: false
                });

                globals.logger.log('info', 'Get OpenAM token: Time %s', latency);
                temp = JSON.parse(response.body);
                globals.iPlanetDirectoryPro = temp.tokenId;

                if(callback && typeof callback == "function"){
                    console.log (callback)
                    parameters === undefined ? callback() : callback(parameters);
                }
                else {
                    getOpenAmToken();
                }
            })
            .catch(function(err) {
                try {
                    JSON.parse(err.error)
                    switch (JSON.parse(err.error).code) {
                        case 401:
                            console.log('Open AM token retrieval error ')
                            self.attempts--;
                            if (self.attempts > 0) {
                                self.getOpenAmToken();
                            } else {
                                console.log("Cannot get OpenAM token... ");
                            }
                            break;
                        default:
                            console.log("Cannot retrieve the original ID " + err);
                    }
                } catch (e) {
                    console.log("Cannot retrieve the original ID " + err);
                }

            })
    }
}