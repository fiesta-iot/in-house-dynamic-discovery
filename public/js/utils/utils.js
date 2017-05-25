var taxonomy_converter = {
    'qk': {
        'm3-lite:BatteryLevel': 'Battery',
        'm3-lite:AirTemperature': 'Temp.',
        'm3-lite:Illuminance': 'Light',
        'm3-lite:AtmosphericPressure': 'Atm. pres.',
        'm3-lite:RelativeHumidity': 'Hum.',
        'm3-lite:TemperatureAmbient': 'Temp.',
        'm3-lite:SoundPressureLevelAmbient': 'Sound',
        'm3-lite:SpeedInstantaneous': 'Speed (inst)',
        'm3-lite:ChemicalAgentConcentrationO3': 'O3',
        'm3-lite:ChemicalAgentConcentrationNO2': 'NO2',
        'm3-lite:ChemicalAgentConcentrationCO': 'CO',
        'm3-lite:ChemicalAgentConcentrationAirParticles': 'Air Particles',
        'm3-lite:MileageTotal': 'Mileage (tot)',
        'm3-lite:Altitude': 'Altitude',
        'm3-lite:PositionLongitude': 'Longitude',
        'm3-lite:PositionLatitude': 'Latitude',
        'm3-lite:DirectionAzimuth': 'Azimuth',
        'm3-lite:SoilMoistureTension': 'Humidity (soil)',
        'm3-lite:TemperatureSoil': 'Temp (soil)',
        'm3-lite:SolarRadiation': 'Sun radiation',
        'm3-lite:WindSpeed': 'Wind speed'
    },

    'unit': {
        'm3-lite:DegreeCelsius': 'ºC',
        'm3-lite:Percent': '%',
        'm3-lite:Lux': 'lux',
        'm3-lite:DecibelA': 'dB-A',
        'm3-lite:KilometrePerHour': 'km/h',
        'm3-lite:MilligramPerCubicMetre': 'mg/m^3',
        'm3-lite:MicrogramPerCubicMetre': 'ug/m^3',
        'm3-lite:DegreeAngle': 'º',
        'm3-lite:Metre': 'm',
        'm3-lite:MeterPerSecond': 'm/s',
        'm3-lite:WattPerSquareMetre': 'W/m^2',
        'm3-lite:Scale': '',
        'm3-lite:Index': '',
        'm3-lite:Bar': 'bar'
    },
    'sensor': {

    }
}

// GeoJSON styles
var geojson_nodes_style = {
    "color": "#ff7800",
    "marker-color": "#EE7600",
    "marker-size": "large",
    "marker-symbol": "city",
    "weight": 5,
    "opacity": 0.65
};

var getShapeType = function(layer) {

    if (layer instanceof L.Circle) {
        return 'circle';
    }

    if (layer instanceof L.Marker) {
        return 'marker';
    }

    if ((layer instanceof L.Polyline) && !(layer instanceof L.Polygon)) {
        return 'polyline';
    }

    if ((layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
        return 'polygon';
    }

    if (layer instanceof L.Rectangle) {
        return 'rectangle';
    }
};

function layerToGeoJSON(layer) {
    var features = [];
    layer.eachLayer(collect);

    function collect(l) {
        if ('toGeoJSON' in l) features.push(l.toGeoJSON());
    }
    return {
        type: 'FeatureCollection',
        features: features
    };
}

function geojsonToLayer(geojson, layer) {
    // layer.clearLayers();
    L.geoJson(geojson, {
        style: L.mapbox.simplestyle.style,
        pointToLayer: function(feature, latlon) {
            if (!feature.properties) feature.properties = {};
            return L.mapbox.marker.style(feature, latlon);
        }
        // 
        // onEachFeature: function
        // 
    }).eachLayer(add);

    function add(l) {
        bindPopup(l);
        l.addTo(layer);
    }
}


