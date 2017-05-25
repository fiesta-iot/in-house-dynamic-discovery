var globals = require('./globals.js');
var http = require('http');
var queries = require('./sparql-queries');
var rp = require('request-promise');
const endpoints = require('./endpoints');
const assert = require('assert');
var openam = require('./openam.js');
var io = require('socket.io');
var prettyHrtime = require('pretty-hrtime');
var _ = require('lodash');

// m3-lite:TemperatureAmbient should not be part of this
var default_phenomena_list = ['m3-lite:AmbientTemperature', 'm3-lite:AirTemperature', 'm3-lite:TemperatureSoil',
    'm3-lite:TemperatureAmbient',
    'm3-lite:Illuminance', 'm3-lite:AtmosphericPressure', 'm3-lite:RelativeHumidity',
    'm3-lite:WindSpeed', 'm3-lite:Sound', 'm3-lite:SoundPressureLevel', 'm3-lite:SoundPressureLevelAmbient', 'm3-lite:SolarRadiation',
    'm3-lite:ChemicalAgentAtmosphericConcentrationCO', 'm3-lite:chemicalAgentAtmosphericConcentrationO3'
];

var self = module.exports = {

    // Annotated observation document parsed
    parseObservation: function(document, time) {

        var raw = document['@graph']
        var output = [];
        var observations_array = _.filter(document['@graph'], {
            "@type": "ssn:Observation"
        });

        assert(observations_array.length);
        _.forEach(observations_array, function(o) {

            var temp = {}

            // Timestamp
            var aux = _.find(raw, {
                '@id': o['ssn:observationSamplingTime']['@id']
            });
            assert(aux != undefined, 'Timestamp not found in the observation');
            temp['timestamp'] = aux['time:inXSDDateTime']['@value']

            // QK
            aux = _.find(raw, {
                '@id': o['ssn:observedProperty']['@id']
            });
            assert(aux != undefined, 'QK not found in the observation');
            temp['qk'] = aux['@type'];

            // Unit and value
            aux = _.find(raw, {
                '@id': o['ssn:observationResult']['@id']
            });
            aux = _.find(raw, {
                '@id': aux['ssn:hasValue']['@id']
            })
            assert(aux != undefined, 'Value not found in the observation');
            temp['value'] = aux['dul:hasDataValue']['@value'];
            aux = _.find(raw, {
                '@id': aux['iot-lite:hasUnit']['@id']
            })
            assert(aux != undefined, 'Value not found in the observation');
            temp['unit'] = aux['@type'];

            // Location
            aux = _.find(raw, {
                '@id': o['geo:location']['@id']
            });
            assert(aux != undefined, 'Location not found in the observation');
            temp['location'] = [aux['geo:lat']['@value'], aux['geo:long']['@value']];
            temp['latency'] = time
            output.push(temp);
        })
        return output;
    },

    getLocation: function(object) {

        var query;
        query = queries.location_from_observation.replace('SSSSS', object.join(" "));

        var options = {
            method: 'POST',
            uri: endpoints.sparql_execute_endpoint_global,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain',
                'accept': 'application/json',
                'iPlanetDirectoryPro': globals.iPlanetDirectoryPro
            },
            body: query
        };

        var start = process.hrtime();
        rp(options)        
            .then(function(response) {
                var end = process.hrtime(start);                

               globals.socket.emit('location_from_observation_resp', JSON.parse(response.body));

            })
            .catch(function(err) {
                try {
                    JSON.parse(err.error)
                    console.log(JSON.parse(err.error).code)
                    switch (JSON.parse(err.error).code) {
                        case 401:
                            console.log('Get location from observation failed  --- ' + JSON.parse(err.error).code);                            
                            openam.getOpenAmToken (self.getLocation, object);
                            break;
                        default:
                            console.log('Get location from observation failed -- ' + JSON.parse(err.error));
                    }
                } catch (e) {
                    console.log('Get location from observation failed - ' + err);
                    openam.getOpenAmToken (self.getLocation, object);
                }
            });
        return 1;
    },

    observationLastValueFromEndpoint: function(object) {

        endpoint = object.value.split('^^')[0];

        var parsedObservations = [];
        var options = {
            method: 'GET',
            uri: endpoint,
            resolveWithFullResponse: true,
            headers: {
                'accept': 'application/ld+json',
                'iPlanetDirectoryPro': globals.iPlanetDirectoryPro
            },
            json: true // Automatically stringifies the body to JSON 
        };

        var start = process.hrtime();

        rp(options)
            .then(function(response) {
                var end = process.hrtime(start);
                var observations_array = self.parseObservation(response.body, prettyHrtime(end, {
                    precise: true
                }))

                globals.logger.log('info', 'Get Last Observation (Endpoint): Time %s # %d',
                    _.head(observations_array).latency, observations_array.length);

                _.forEach(observations_array, function(o) {
                    parsedObservations.push(o);
                });

                globals.socket.emit('observation_last_value_resp', parsedObservations);

            })
            .catch(function(err) {

                try {
                    JSON.parse(err.error)
                    console.log(JSON.parse(err.error).code)
                    switch (JSON.parse(err.error).code) {
                        case 401:
                            console.log('Observations from endpoint failure (401) --- ' + JSON.parse(err.error).code);
                            openam.getOpenAmToken (self.observationLastValueFromEndpoint, object);
                            break;
                        default:
                            console.log('Observations from endpoint failure (401) -- ' + err);
                    }
                } catch (e) {
                    console.log('--- Observations from endpoint failure (401) - ' + err);
                    openam.getOpenAmToken (self.observationLastValueFromEndpoint, object);
                }
            })

        return 1;
    },


    // Runs the SPARQL, parses the result and sends it to the client
    // Output format
    // { 
    //      "status": true/false,   --> True if success, false if empty
    //      "items": [{"val": xxx, "unit": xxx, "qk": xxx, "s": xxx, "tim": xxx}],
    //      "latency": xxx 
    // }
    observationLastValueSparql: function(object) {

        observations_array = {};
        var query;

        query = queries.last_observation_v2.replace('SSSSS', object.value.join(" "));

        var options = {
            method: 'POST',
            uri: endpoints.sparql_execute_endpoint_global,
            resolveWithFullResponse: true,
            headers: {
                'content-type': 'text/plain',
                'accept': 'application/json',
                'iPlanetDirectoryPro': globals.iPlanetDirectoryPro
            },
            body: query
        };

        var start = process.hrtime();
        rp(options)
            .then(function(response) {

                var output = {};
                var end = process.hrtime(start);
                var latency = prettyHrtime(end, {
                    precise: false
                });

                var temp = {};
                observations_array['items'] = [];
                temp = JSON.parse(response.body).items;

                _.forEach(temp, function(item) {

                    if (_.isEmpty(item)) {
                        observations_array['status'] = false;
                        observations_array['latency'] = latency;
                        if (object.type === 'marker') {
                            globals.socket.emit('observation_last_value_sparql_resp', observations_array);
                        } else {
                            globals.socket.emit('average_observation_resp', observations_array);
                        }
                        return -1;
                    } else {

                        observations_array['status'] = true;
                        observations_array['latency'] = latency;

                        var value_type = item.value.split('^^')[1];
                        item.value = item.value.split('^^')[0];

                        if (value_type.search("double")) {
                            item.value = parseFloat(item.value);
                        }

                        item.timestamp = item.timestamp.split('^^')[0];
                        item.qk = item.qk.replace('http://purl.org/iot/vocab/m3-lite#', 'm3-lite:');
                        item.unit = item.unit.replace('http://purl.org/iot/vocab/m3-lite#', 'm3-lite:');
                        observations_array['items'].push(item);
                    }
                })
                if (object.type === 'marker') {
                    globals.socket.emit('observation_last_value_sparql_resp', observations_array);
                } else {
                    globals.socket.emit('average_observation_resp', observations_array);
                }
                globals.logger.log('info', 'Get Last Observation (SPARQL): Time %s # 1', latency);
            })
            .catch(function(err) {
                try {
                    JSON.parse(err.error)
                    switch (JSON.parse(err.error).code) {
                        case 401:
                            console.log('Observations from SPARQL failure (401)');
                            openam.getOpenAmToken (self.observationLastValueSparql, object);
                            break;
                        default:
                            console.log("Cannot get the observation " + err);
                    }
                } catch (e) {
                    console.log("Cannot get the observation " + err);
                    openam.getOpenAmToken (self.observationLastValueSparql, object);
                }
            })
    }


};