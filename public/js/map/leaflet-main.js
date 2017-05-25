// Icon configuration
var blueIcon = new L.icon(default_markers_json);
var redIcon = new L.Icon(selected_markers_json);

// var last_marker = {};

// Array & layer to display the nodes 
var devices_layer = new L.layerGroup();
var devices_cluster = new L.MarkerClusterGroup({
    // showCoverageOnHover: true,
    // disableClusteringAtZoom: 18,
    maxClusterRadius: 30,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true
});

function initMap() {

    // set up the map
    leafletMap = L.map('mapid', {
        center: [initialLatitude, initialLongitude],
        zoom: initialZoom,
        maxZoom: 18,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false,
        worldCopyJump: true,
        keyboard: true,
        keyboardZoomOffset: true,

        // Context menu options
        contextmenu: true,
        contextmenuWidth: 150,
        contextmenuItems: [{
                text: 'Show coordinates',
                icon: '../../images/icons/coordinates.png',
                callback: showCoordinates
            }, {
                text: 'Center map',
                icon: '../../images/icons/bullseye.png',
                callback: centerMap
            },
            '-', {
                text: 'Zoom in',
                icon: '../../images/icons/zoom-in.png',
                callback: zoomIn
            }, {
                text: 'Zoom out',
                icon: '../../images/icons/zoom-out.png',
                callback: zoomOut
            },
            '-', {
                text: 'Clean all',
                icon: '../../images/icons/trash.png',
                callback: flushLeafletObjectArray
            }
        ]
    });

    // Basic Map Style
    L.mapbox.accessToken = mapbox_access_token;
    var baseMap = L.tileLayer('https://api.mapbox.com/styles/v1/' + mapbox_style + '/tiles/{z}/{x}/{y}?access_token=' +
            L.mapbox.accessToken, {
                noWrap: false,
                // tileLayer: {format: 'jpg70'},   //Low bandwidth map
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
        .addTo(leafletMap);

    // Base control layers (updated with Styled layer control)
    var baseLayers = {
        "Base map": baseMap
    };

    var overlays = {
        "Clusters": devices_cluster,
        "Nodes": devices_layer
    };

    // Legacy layer control 
    L.control.layers(baseLayers, overlays).addTo(leafletMap);

    // Leaflet easy button
    L.easyButton('fa-refresh', function() {
        console.log('Manual resource discovery');
        // discovery('global');
        discovery('global');
    }).addTo(leafletMap);

    // Draw Control initialization function
    drawControl();

    //Resource discovery phase
    discovery('global');

    // Default events (loaded at map initialization)
    leafletMap.on('click', function(e) {
        tempLatitude = e.latlng.lat;
        tempLongitude = e.latlng.lng;
        // console.log("Clicked location: [" + tempLatitude + ", " + tempLongitude + "]");        
    });

    leafletMap.on('dblclick', restoreView);

    // Event on 'move' end. Alternatively, run it to 'move' (and optimize the deep iteration method)
    leafletMap.on('moveend', onMoveend);
    leafletMap.on('zoomend', onZoomend);

    // Control layers handlers 
    leafletMap.on('overlayadd', function(event) {
        if (event.name === 'Clusters') {
            active_clusters_overlay = true;
            devices_cluster.addTo(leafletMap)
        } else if (event.name === "Nodes") {
            active_nodes_overlay = true;
            devices_layer.addTo(leafletMap)
        }
    })

    leafletMap.on('overlayremove', function(event) {
        if (event.name === 'Clusters') {
            active_clusters_overlay = false;
            leafletMap.removeLayer(devices_cluster);
        } else if (event.name === "Nodes") {
            active_nodes_overlay = false;
            leafletMap.removeLayer(devices_layer);
        }
    })

    // Scale marker
    L.control.scale().setPosition('bottomleft').addTo(leafletMap);

    // By default, we will load the cluster option
    devices_cluster.addTo(leafletMap);

};

// Initial resource discovery. Parameters:
// type: global/local/remote
// query_parameters: { 'phenomena': [],
//         'location': { 'type': 'rectangle',
//                     'values': []
//        }
// }
// Todo: the location based discovery will be left for a future version

function discovery(type, query_parameters) {

    if (type === 'global') {
        devices_array = [];
        devices_cluster.clearLayers();
        devices_layer.clearLayers();
        socket.emit('resource_discovery_req');
        socket.emit('gather_stats_req');
    } else if (type === 'local') {
        localResourceDiscovery(query_parameters)
    } else { //SPARQL query
        devices_array = [];
        devices_cluster.clearLayers();
        devices_layer.clearLayers();
        socket.emit('resource_discovery_req', query_parameters);
        socket.emit('gather_stats_req');
    }
};

function localResourceDiscovery(query_parameters) {

    // Create a deep copy
    var copy = [];

    _.forEach(devices_array, function(o) {
        copy.push(JSON.parse(JSON.stringify(o.marker.options.alt)));
    });

    var start = performance.now();
    // Clear layers    
    devices_cluster.clearLayers();
    devices_layer.clearLayers();
 

    var output_array = _.filter(copy, function(device) {
        _.remove(device.sensors, function(o) {
            var aux = o.qk.replace('http://purl.org/iot/vocab/m3-lite#', 'm3-lite:');
            // console.log ();
            return _.indexOf(query_parameters.phenomena, aux) < 0;
        });
        
        return device.sensors.length > 0;
    });

    _.forEach(output_array, function(device) {        
        var marker = L.marker(device.location, {
                riseOnHover: false,
                dragging: false,
                title: '', //Trick to add a name to the marker (I)                         
                alt: device,
                contextmenu: true,
                contextmenuItems: [{
                    text: 'Toggle selection',
                    icon: '../../images/icons/toggle.png',
                    callback: toggleMarkerColor,
                    index: 0
                }, {
                    text: 'Node info',
                    icon: '../../images/icons/info.png',
                    callback: showNodeInfo,
                    index: 1
                }, {
                    separator: true,
                    index: 2
                }]
            }).on('click', onMarkerClick)
            .addTo(devices_cluster)
            .addTo(devices_layer)
    });    
    var stop = performance.now()

    getDataTable('#table_messages').row.add([new Date().toISOString(),
        'Resource discovery phenomena-based filter (local)',
        output_array.length + ' resources (' + String(stop - start) + 'ms)'
    ]).draw().node();

};


// Parse the resource discovery options
function parseResourceDiscoveryData(data) {
    var hit;
    var mobile = [];

    _.forEach(data.items, function(o) {
        hit = _.find(devices_array, {
            // 'device': o.dev
            'location': [o.lat.split('^^')[0], o.long.split('^^')[0]]
        })

        if (hit === undefined) {            

            if (_.isEqual([parseFloat(o.lat), parseFloat(o.long)], [0.0E0, 0.0E0])) {
                mobile.push('<' + o.sensor + '>');
            } else {

                var marker = L.marker([o.lat, o.long], {
                        riseOnHover: false,
                        dragging: false,
                        title: o.id, //Trick to add a name to the marker (I)                         
                        alt: {},
                        contextmenu: true,
                        contextmenuItems: [{
                            text: 'Toggle selection',
                            icon: '../../images/icons/toggle.png',
                            callback: toggleMarkerColor,
                            index: 0
                        }, {
                            text: 'Node info',
                            icon: '../../images/icons/info.png',
                            callback: showNodeInfo,
                            index: 1
                        }, {
                            separator: true,
                            index: 2
                        }]
                    }).on('click', onMarkerClick)
                    .addTo(devices_cluster)
                    .addTo(devices_layer)
                    // .bindPopup(popup_text, popup_options);

                var aux = {};
                // aux['device'] = o.dev;
                aux['location'] = [parseFloat(o.lat.split('^^')[0]), parseFloat(o.long.split('^^')[0])]
                aux['sensors'] = [];
                aux['selected'] = false;
                aux['visible'] = true;

                var aux2 = {};

                aux2['id'] = o.sensor;

                if (_.has(o, 'endp')) {
                    aux2['endpoint'] = o.endp;
                }

                aux2['qk'] = o.qk;
                aux2['unit'] = o.unit;
                aux['sensors'].push(aux2);


                marker.options.alt = aux;
                devices_array.push({
                    // 'device': o.dev,
                    'location': [o.lat.split('^^')[0], o.long.split('^^')[0]],
                    'marker': marker
                });
            }


        } else {
            var aux = {};
            aux['id'] = o.sensor;
            if (_.has(o, 'endp')) {
                aux['endpoint'] = o.endp;
            }
            aux['qk'] = o.qk;
            aux['unit'] = o.unit;
            hit.marker.options.alt.sensors.push(aux);
        }
    });

    if (active_clusters_overlay === true) {
        devices_cluster.addTo(leafletMap);
    }
    if (active_nodes_overlay === true) {
        devices_layer.addTo(leafletMap)
    }

    // Handle mobiity
    if (mobile.length > 0) {
        socket.emit('location_from_observation_req', mobile);
    }

    total_nodes = devices_array.length;

    $("#log").append(new Date().toISOString() + " - Resources discovered: " + total_nodes + "<br \>");
    $("#stats_resources_total").html(String(total_nodes));
    $("#stats_resources_filter").html(String(total_nodes));
};

// Read the marker info and get the last observation values (if the sensor has an endpoint)
// Note: A query per SensingDevice registered will be sent
// @David: Include Datatables instead of raw text
function getLastObservation(marker) {

    // last_marker = marker;

    _.forEach(marker.options.alt.sensors, function(item) {

        if (_.has(item, 'endpoint')) {
            socket.emit('observation_last_value_req', {
                'type': 'marker',
                'value': item.endpoint
            });
            $("#log").append(new Date().toISOString() + " - Observation request (endpoint) sent " + "<br \>");
        } else {
            $('#timestamp_' + item.qk.split('#')[1]).html('\<img src=\"..\/..\/images\/icons\/error.png\" alt=\"No endpoint available!\" style=\"width:20px;height:20px;\"\>');
            $('#value_' + item.qk.split('#')[1]).html('\<img src=\"..\/..\/images\/icons\/error.png\" alt=\"No endpoint available!\" style=\"width:20px;height:20px;\"\>');
        }
    });

};

// Two input parameters:
// 1- Leaflet marker
// 2- Array
function getLastObservationFromSparql(marker) {

    // popup_text = '<b><font color=blue size=3> Node ' + marker._leaflet_id + '</font></b><br>';
    // marker.setPopupContent(popup_text)
    // last_marker = marker;
    sensors_array = [];

    _.forEach(marker.options.alt.sensors, function(item) {
        sensors_array.push('<' + item.id + '>');
        $("#log").append(new Date().toISOString() + " - Observation request (SPARQL) sent" + "<br \>");
    });

    console.log(sensors_array)

    socket.emit('observation_last_value_sparql_req', {
        'type': 'marker',
        'value': sensors_array
    });
};


function TaxonomyConverter(dictionary, value) {
    return taxonomy_converter[dictionary][value] != undefined ? taxonomy_converter[dictionary][value] : value;
};

function showNodeInfo(event) {

    event.relatedTarget.bindPopup('<table id=\"test\" class=\"display\"><thead><tr><th>#<\/th>\<th>QK<\/th><th>Unit<\/th><th>Endpoint<\/th><\/tr><\/thead><\/table>', {
        'minWidth': 400,
        'maxWidth': 600
    }).openPopup();
    $('#test').DataTable({
        'bPaginate': false,
        'bFilter': false,
        'bLengthChange': false,
        'retrieve': false,
        'ordering': false,
        'bInfo': false,
        'autoWidth': false,
        'columns': [{
            'orderable': false,
            'width': 10,
        }, {
            'orderable': false,
            'width': 140,
        }, {
            'orderable': false,
            'width': 140,
        }, {
            'orderable': false,
            'width': 30,
        }]
    });

    var counter = 0;

    _.forEach(event.relatedTarget.options.alt.sensors, function(o) {
        getDataTable('#test').row.add(['\<a href=\"' + o.id + '\" target=\"_blank\"\>' + counter + '\<\/\a>',
            o.qk.split('#')[1],
            o.unit.split('#')[1],
            _.has(o, 'endpoint') ? '\<a href=\"' + o.endpoint.split('^^')[0] + '\" target=\"_blank\"\> Endpoint \<\/\a>' : '--'
        ]).draw().node();
        counter++;
    });

    event.relatedTarget.unbindPopup();
}


function WeatherStationAverage(data) {

    var weather_station = {};

    var start = performance.now();
    _.forEach(data.items, function(o) {
        if (!_.has(weather_station, o['qk'])) {
            weather_station[o['qk']] = []
        }
        weather_station[o['qk']].push(o.value);
    });

    _.forEach(_.keys(weather_station), function(o) {
        $('#weather_' + o.split(':')[1]).html(math.mean(weather_station[o]).toFixed(3))
    });
    var stop = performance.now()
    getDataTable('#table_messages').row.add([new Date().toISOString(),
        '(Weather station) - Average calculated',
        data.items.length + ' sensors (' + String((stop - start).toFixed(3)) + ' ms)'
    ]).draw().node();
    $("#log").append(new Date().toISOString() + " - (Weather station) - Average calculated " + "<br \>");

}