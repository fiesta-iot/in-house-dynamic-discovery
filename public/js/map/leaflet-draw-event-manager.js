// Global variables
var drawnItems = new L.FeatureGroup();
// var selectedItems = new L.FeatureGroup();

// Draw control tools
function drawControl() {

    leafletMap.addLayer(drawnItems);

    var drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
            polyline: true,
            // polygon: true,
            polygon: {
                allowIntersection: true,
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>No intersection allowed!<strong>' // Message that will show when intersect
                },
                shapeOptions: {
                    // color: '#bada55'
                }
            },
            rectangle: true,
            circle: false,
            marker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    leafletMap.addControl(drawControl);

    leafletMap.on('draw:created', function(e) {
        // var type = e.layerType,
        //     layer = e.layer;
        // console.log ("Items : " + CircularJSON.stringify(drawnItems)); 

        console.log('Layer created');

        // Encapsulate into a feature group (to ease )
        var aux = new L.FeatureGroup();
        aux.addLayer(e.layer);

        calculateIntersections(aux);
        markerAreaSelection(aux, true);

        calculateAverageValues();
    });


    drawnItems.on('click', function(e) {

        console.log("Drawn -- " + JSON.stringify(e.layer.toGeoJSON()));
        // drawnItems.removeLayer (e.layer);
    });


    leafletMap.on('draw:edited', function(e) {
        var layers = e.layers;
        var countOfEditedLayers = 0;
        layers.eachLayer(function(layer) {
            countOfEditedLayers++;
            // console.log("Layer Edited: " + JSON.stringify(layer.toGeoJSON()) + " - " + layer.getRadius() + " m.");            
        });
        console.log("Edited: " + countOfEditedLayers + " layers");
        console.log("Edited: " + JSON.stringify(layers.toGeoJSON()));

        calculateIntersections(e.layers);
        markerAreaSelection(e.layers, true);
        calculateAverageValues();
    });

    drawnItems.on('contextmenu', function(e) {
        drawnItems.removeLayer(e.layer);
        calculateAverageValues();
    });

    //on Click event
    // function onClick(e) {

    //     drawnItems.addLayer(e.layer);
    // }

    leafletMap.on('draw:deleted', function(e) {
        console.log("Layer remove from Leaflet draw event " + typeof(e.layers));
        markerAreaSelection(e.layers, false);
        calculateAverageValues();
    });


    drawnItems.on('layerremove', function(e) {
        console.log("Layer removed " + e.layer.toGeoJSON());        
        markerAreaSelection(L.layerGroup().addLayer(e.layer), false);
        calculateAverageValues();
    });
}


// Merge rectangles/polygons in case they overlap (polylines and circles will pass through this method)
// TODO: Performance optimization
function calculateIntersections(inputLayer) {

    var layers = inputLayer.getLayers();
    var globals = drawnItems.getLayers();
    var i = 0;
    var intersecting = false;

    // Need to optimize 
    _.forEach(layers, function(inputElement) {

        if ((getShapeType(inputElement) == 'rectangle') || (getShapeType(inputElement) == 'polygon')) {
            // @David: Optimize performance!!
            // Nested loop, check intersections with already deployed ones (excluding themselves)
            // Needed methods: intersect + union
            for (var j = 0; j < globals.length; j++) {

                if ((getShapeType(globals[j]) == 'rectangle') || (getShapeType(globals[j]) == 'polygon')) {

                    if (!_.isEqual(inputElement, globals[j])) {
                        if (turf.intersect(inputElement.toGeoJSON(), globals[j].toGeoJSON()) != undefined) {

                            intersecting = true;
                            var union = new L.polygon(turf.flip(turf.union(inputElement.toGeoJSON(),
                                globals[j].toGeoJSON())).geometry.coordinates);
                            drawnItems.removeLayer(globals[j]);
                            drawnItems.addLayer(union);
                            console.log("New polygon created " + JSON.stringify(union.toGeoJSON()));
                            markerAreaSelection();
                        }

                    } else {
                        drawnItems.addLayer(inputElement);
                    }
                }
            }
            if (!intersecting) {
                drawnItems.addLayer(inputElement);
                intersecting = false;
            }
        } else {
            drawnItems.addLayer(inputElement);
        }
    });

    console.log("Total elements " + drawnItems.getLayers().length);
    $("#stats_areas").html(String(drawnItems.getLayers().length));
}

// When this function is invoked, depending on the dropbox menu at the right side of the map (recall, 
// the one that allows to either solve graphically or through the generation of SPARQL queries the resource discovery )
// NOTE: input MUST be an L.featureLayer object
// Parameters
// input: layer(s) to be checked
// added: true if comes from the creation/edition of a layer; false upon deletion
function markerAreaSelection(input, added = true) {

    var aux = 0;
    var elements;

    if (input != undefined) {
        elements = input;
    } else {
        elements = drawnItems;
    }

    var start = performance.now()

    // @David: Optimize performance!!
    elements.eachLayer(function(layer) {
        switch (getShapeType(layer)) {
            case 'polyline':
                var temp;
                var distance;
                devices_layer.eachLayer(function(marker) {
                    temp = turf.pointOnLine(layer.toGeoJSON(), marker.toGeoJSON());
                    distance = turf.distance(marker.toGeoJSON(), temp, 'kilometers');
                    if (distance <= 0.020) {
                        handleMarkerColor(marker, added);
                        aux++;
                    }
                });
                break;

            case 'circle':
                devices_layer.eachLayer(function(marker) {
                    if (turf.distance(turf.point([layer.getLatLng().lng, layer.getLatLng().lat]),
                            marker.toGeoJSON(), 'kilometers') < layer.getRadius() / 1000) {
                        handleMarkerColor(marker, added);
                        aux++;
                    }
                });
                break;

            case 'rectangle':
            case 'polygon':
                devices_layer.eachLayer(function(marker) {
                    if (marker.toGeoJSON().type === 'Feature') {
                        if (turf.inside(marker.toGeoJSON(), layer.toGeoJSON())) {
                            handleMarkerColor(marker, added);
                            aux++;
                        }
                    }
                });
        }
    });

    var stop = performance.now();

    selected_nodes += aux;


    // Printing out stats...
    var now = new Date().toISOString();
    $("#log").append(now + " - Elements in areas: " + aux + "<br \>");
    getDataTable('#table_messages').row.add([now,
        'Area selection (Turf.js)',
        added ? 'Caught ' + aux + ' nodes in ' + String((stop - start).toFixed(3)) + ' ms' : 'Released ' + aux + ' nodes in ' +
        String((stop - start).toFixed(3)) + ' ms'
    ]).draw().node();

    // Update stats section
    selectedMarkersTally();
    $("#stats_areas").html(String(drawnItems.getLayers().length));


}

function handleMarkerColor(marker, added) {
    if (added === true) {
        if (marker.options.alt.selected === false) {
            marker.options.alt.selected = true
            marker.setIcon(redIcon)
        }
    } else {
        if (marker.options.alt.selected === true) {
            marker.options.alt.selected = false
            marker.setIcon(blueIcon)
        }
    }
}

function toggleMarkerColor(event) {

    event.relatedTarget.options.alt.selected = !event.relatedTarget.options.alt.selected;
    event.relatedTarget.options.alt.selected === true ?
        event.relatedTarget.setIcon(redIcon) : event.relatedTarget.setIcon(blueIcon);

    var log = " - Marker ";
    log += event.relatedTarget.options.alt.selected === true ? " selected: " : " unselected: ";
    log += event.relatedTarget._leaflet_id;

    $("#log").append(new Date().toISOString() + log + "<br \>");
    selectedMarkersTally();

    calculateAverageValues();
}

function calculateAverageValues() {

    var values = [];
    var key = '';

    $('#last_value_options').find(":radio:checked").first().attr('id') === 'last_value_endpoint' ?
        key = 'endpoint' : key = 'id';

    _.forEach(getSelectedMarkers(), function(item) {
        // values.push(o[key]);
        _.forEach(item.marker.options.alt.sensors, function(o) {
            if (key === 'endpoint') {
                // if (_.has(o, 'endpoint')) {
                //     socket.emit('observation_last_value_req', {
                //         'type': 'group',
                //         'value': o.endpoint
                //     });
                // }
            } else {
                values.push('<' + o['id'] + '>');
            }
        })

    });

    if ($('#last_value_options').find(":radio:checked").first().attr('id') === 'last_value_sparql') {
        if (values.length > 0) {
            socket.emit('observation_last_value_sparql_req', {
                'type': 'group',
                'value': values
            });
        } else {            
            $('.weather_station_values').html('--');
            $("#violin-chart").html("");
        }
    }
}



// function markersTally() {
// console.log ("---" + JSON.stringify(devices_cluster));
// $("#stats_markers").html(String(_.filter(devices_cluster, function (marker) {

//     // console.log (JSON.stringify(marker))
//     // return marker.options.alt.selected;
//     return 1;
// }).length));
// }

function getVisibleMarkers() {
    return _.filter(devices_array, function(o) {
        return o.marker.options.alt.visible === true;
    });
}

function getSelectedMarkers() {
    return _.filter(getVisibleMarkers(), function(o) {
        return o.marker.options.alt.selected === true;
    });
}

function selectedMarkersTally() {
    $("#stats_markers").html(String(getSelectedMarkers().length));
}

function clearMarkers() {
    var array = getSelectedMarkers();

    _.forEach(array, function (o) {        
        o.marker.options.alt.selected = false
        o.marker.setIcon(blueIcon);
    });

    $("#violin-chart").html("");
}