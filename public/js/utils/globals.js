// Global variables 
var leafletMap;
var serverEndpoint = 'http://localhost:3000'

// Map handlers
var mapInstance;
var initialLatitude = 48;
var initialLongitude = 40;
var initialZoom = 2;

// Array that holds all assets info
var devices_array = [];

// Active overlay indicators, displaying whether these layers are active or not
var active_clusters_overlay = true;
var active_nodes_overlay = false;

// Stats
var total_nodes = 0
var selected_nodes = 0

// Layer arrays
// var selected_markers_array = [];
var phenomena_dictionary = [""];

var default_markers_json = {
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    // iconUrl: 'images/icons/raw/roadOccupancy.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}

var selected_markers_json = {
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    // iconUrl: 'images/icons/raw/roadOccupancy.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}

// Socket.io connector
var socket = io.connect(serverEndpoint);

// Popup options
var popup_options = {
    // 'maxWidth': 'auto'
    'maxWidth': 600,
    'closeOnClick': true
}

// Phenomena toggle buttons
var phenomena_toggle_group = []


