var toggle_to_phenomena = {
    'temperature_toggle': ['m3-lite:AmbientTemperature', 'm3-lite:AirTemperature', 'm3-lite:TemperatureSoil',
        'm3-lite:TemperatureAmbient', 'm3-lite:BuildingTemperature'
    ],
    'illuminance_toggle': ['m3-lite:Illuminance'],
    'atm_toggle': ['m3-lite:AtmosphericPressure'],
    'humidity_toggle': ['m3-lite:RelativeHumidity'],
    'windspeed_toggle': ['m3-lite:WindSpeed'],
    'sound_toggle': ['m3-lite:Sound', 'm3-lite:SoundPressureLevel', 'm3-lite:SoundPressureLevelAmbient'],
    'sun_toggle': ['m3-lite:SolarRadiation'],
    'o3_toggle': ['m3-lite:ChemicalAgentAtmosphericConcentrationCO'],
    'co_toggle': ['m3-lite:chemicalAgentAtmosphericConcentrationO3']
}


function jqueryHandlerInit() {

    // Bootstrap toogle handlers
    $('.phenomena-toggle-group').each(function(index, item) {
        var element = {};
        element['key'] = $(this).attr('id');
        element['value'] = $(this).prop('checked');
        element['taxonomy'] = [];

        _.forEach(toggle_to_phenomena[$(this).attr('id')], function(value) {
            element['taxonomy'].push(value)
        });
        phenomena_toggle_group.push(element);
        $("#" + $(this).attr('id')).change(function() {
            hit = _.find(phenomena_toggle_group, {
                'key': $(this).attr('id')
            });
            hit['value'] = $(this).prop('checked');
        });

    });

    // "Send query" button event handler: 
    // Local discovery --> Loop and filter the resources 
    // Remote discovery --> Will take the enabled phenomena in the toggle group and will generate a new SPARQL
    // Future: Add coordinates to the object
    $('#send_discovery_query').on('click', function(e) {

        var query_parameters = {};
        query_parameters['phenomena'] = [];
        query_parameters['location'] = {}; //Todo

        _.forEach(_.filter(phenomena_toggle_group, {
            'value': true
        }), function(value) {
            _.forEach(value['taxonomy'], function(phenomenon) {
                query_parameters['phenomena'].push(phenomenon);
            })
        })

        if ($('#discovery_options').find(":radio:checked").first().attr('id') === 'discovery_local') {
            discovery('local', query_parameters);
        } else if  ($('#discovery_options').find(":radio:checked").first().attr('id') === 'discovery_sparql') {
            discovery('remote', query_parameters);
        } else {
            console.log ('Global resource discovery');
            discovery('global');
        }

    });

    // $(".phenomena-toggle-group").contextmenu(function() {
    //     alert("Handler for .contextmenu() called.");
    // });

    //  $("#temperature_toggle").contextmenu(function() {
    //     alert("Handler for .contextmenu() called.");
    // });

}


function getDataTable(table, options) {
    
    if ($.fn.dataTable.isDataTable(table)) {    
        return $(table).DataTable();
    } else {    
        return $(table).DataTable(options === undefined ? 
            {'bpaginate': true, 'bFilter': true, 'bLengthChange': false, 'pageLength': 8, 'retrieve': true } : options);
    }
};