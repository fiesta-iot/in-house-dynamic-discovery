// Show only those nodes that are visible within the map bounds (more efficient)
function showNodes() {

    bounds = leafletMap.getBounds();

    // // Issue with GeoJson files
    // devices_layer.eachLayer(function(marker) {
    devices_cluster.eachLayer(function(marker) {

        // console.log (marker.toGeoJSON());
        var aux = marker.toGeoJSON();

        // Special treatment for FeatureCollections
        if (aux.type === "FeatureCollection") {
            _.forEach(aux.features, function(item) {
                // Needs to be fixed
                if (bounds.contains(L.latLng(item.geometry.coordinates[1], item.geometry.coordinates[0]))) {
                    // item.addTo(devices_layer);
                    leafletMap.addLayer(item);
                } else {
                    leafletMap.removeLayer(item);
                }
            });

        }
        // Process only markers, thus avoiding feature collections
        else if (aux.type === "Feature") {
            if (bounds.contains(L.latLng(aux.geometry.coordinates[1], aux.geometry.coordinates[0]))) {
                marker.addTo(devices_layer);
            } else {
                leafletMap.removeLayer(marker);
            }
        }
    });

}

// Event handlers
function onMarkerClick(e) {    

    // Test
    e.target.bindPopup('<table id=\"popup\" class=\"display\"><thead><tr><th>Timestamp<\/th>\<th>QK<\/th><th>Value<\/th><th>Unit<\/th><\/tr><\/thead><\/table>', {
        'minWidth': 500,
        'maxWidth': 700
    }).openPopup();
    $('#popup').DataTable({
        'bPaginate': false,
        'bFilter': false,
        'bLengthChange': false,
        'retrieve': false,
        'ordering': false,
        'bInfo': false,
        'autoWidth': false,
        'columns': [{
            'orderable': false,
            'width': 120,
        }, {
            'orderable': false,
            'width': 200,
        }, {
            'orderable': false,
            'width': 60,
        }, {
            'orderable': false,
            'width': 120,
        }]
    });

    var counter = 0;

    _.forEach(e.target.options.alt.sensors, function(o) {
        
        getDataTable('#popup').row.add([
            '\<div id=\"timestamp_' + o.qk.split('#')[1] + '\"\> -- \<\/div\>',
            o.qk.split('#')[1],
            '\<b id=\"value_' + o.qk.split('#')[1] + '\"\> -- \<\/b\>',
            o.unit.split('#')[1]
        ]).draw().node();
        counter++;
    });
    // End test

    if ($('#last_value_options').find(":radio:checked").first().attr('id') === 'last_value_endpoint') {
        info = getLastObservation(e.target);
    } else {
        info = getLastObservationFromSparql(e.target);
    }
    
    e.target.unbindPopup(); 

};

function leafletDrawclicked(e) {
    // console.log ("Element clicked: " + JSON.stringify(e.layer.toGeoJSON()));
    console.log("Event");
};

function onMouseover(e) {
    tempLatitude = e.latlng.lat;
    tempLongitude = e.latlng.lng;
    console.log("Mouse over: [" + tempLatitude + ", " + tempLongitude + "]");
    // leafletMap.setView([tempLatitude, tempLongitude], testbedZoom);
};

function onMouseout(e) {
    tempLatitude = e.latlng.lat;
    tempLongitude = e.latlng.lng;
    console.log("Mouse out: [" + tempLatitude + ", " + tempLongitude);
    // leafletMap.setView([tempLatitude, tempLongitude], testbedZoom);
};

function onMoveend(e) {
    // Get map bounds
    // var aux = leafletMap.getBounds();
    // console.log("Movement finished: map corners " + aux.getNorthWest() + " / " + aux.getSouthWest() + " Map center " + leafletMap.getCenter());
    showNodes();
}

function onZoomend(e) {
    // Get map bounds
    var aux = leafletMap.getBounds();
    // console.log("Zoom movement finished: map corners " + aux.getNorthWest() + " / " + aux.getSouthWest() +
    //     "] -- Zoom value " + leafletMap.getZoom());
}

// Restore default view
function restoreView(e) {
    // setSystemState(initialState);
    leafletMap.setView([initialLatitude, initialLongitude], initialZoom);
    // leafletMap.fitWorld().zoomIn();
}

function showCoordinates(e) {
    console.log("Clicked coordinates: " + e.latlng);
    L.popup()
        .setLatLng(e.latlng)
        .setContent('(' + e.latlng.lat + ', ' + e.latlng.lng + ')')
        .openOn(leafletMap);
}

function centerMap(e) {
    leafletMap.panTo(e.latlng);
}

function zoomIn(e) {
    leafletMap.zoomIn();
}

function zoomOut(e) {
    leafletMap.zoomOut();
}

function flushLeafletObjectArray(e) {
    drawnItems.clearLayers();
    clearMarkers();
}