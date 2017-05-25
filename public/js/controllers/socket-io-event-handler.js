  // All the socket-io communication between client and server will be handled in this file.

  socket.on('mapbox_credentials_response', function(data) {
      mapbox_style = data.style;
      mapbox_access_token = data.token;
      initMap();
  })

  // Get the registered nodes from the server   ()     
  socket.on('resource_discovery_resp', function(data) {

      if (!_.isEmpty(data)) {
          parseResourceDiscoveryData(data);
          socket.emit('resource_latency_req');
      } else {
          alert('Resources array empty. Try later')
      }

  });


  socket.on('location_from_observation_resp', function(object) {      
      parseResourceDiscoveryData (object);
  })

  // Print out the message received from the server with its performance output
  socket.on('resource_latency_resp', function(data) {
      getDataTable('#table_messages').row.add([data.date,
          'Resource discovery (SPARQL)', data.resources + " resources (" + data.latency + ")"
      ]).draw().node();
  });


  socket.on('gather_stats_resp', function(data) {

      if (!_.isEmpty(data)) {

          var log_message = new Date().toISOString() + " - Statistics retrieved (SPARQL) : ";
          _.forEach(_.keys(data), function(o) {
              $('#' + o).html(String(data[o]));
              log_message += o + "  (" + data[o] + "), ";
          });

          $("#log").append(log_message);
          getDataTable('#table_messages').row.add([new Date().toISOString(),
              "Gather statistics (SPARQL)", "(" + data.latency + ")"
          ]).draw().node();

      } else {

      }
  });

  // Get last observation (from endpoint)
  socket.on('observation_last_value_resp', function(data) {

      _.forEach(data, function(o) {
          $('#timestamp_' + o.qk.split(':')[1]).html(o['timestamp']);
          $('#value_' + o.qk.split(':')[1]).html(o['value']);

          getDataTable('#table_messages').row.add([new Date().toISOString(),
              'Get observation (endpoint)',
              '1 observation (' + o['latency'] + ')'
          ]).draw().node();

          $("#log").append(new Date().toISOString() + " - Observation : " +
              TaxonomyConverter('qk', o['qk']) + " " + String(o['value']) + "<br \>");
      })

      // calculateAverageValues();

      return 1;
  });

  socket.on('observation_last_value_sparql_resp', function(data) {

      _.forEach(data.items, function(o) {

          $('#timestamp_' + o.qk.split(':')[1]).html(o['timestamp']);
          $('#value_' + o.qk.split(':')[1]).html(o['value']);

          $("#log").append(new Date().toISOString() + " - Observation : " +
              TaxonomyConverter('qk', o['qk']) + " " + String(o['value']) + "<br \>");
      })

      getDataTable('#table_messages').row.add([new Date().toISOString(),
          'Get observation (SPARQL) ', String(data.items.length) +
          ((data.items.length > 1) ? " observations " : " observation ") +
          "  (" + data.latency + ")"
      ]).draw().node();

      // calculateAverageValues();
      return 1;
  });

  // Two phases: 1- Update the weather station; 2- Feed the violin plot
  socket.on('average_observation_resp', function(data) {

      getDataTable('#table_messages').row.add([new Date().toISOString(),
          'Get observation (SPARQL) ', String(data.items.length) +
          ((data.items.length > 1) ? " observations " : " observation ") +
          "  (" + data.latency + ")"
      ]).draw().node();

      WeatherStationAverage(data);

      // Display the violin plot
      ViolinPlot(data);
  });


  // Populate the message table (DataTable)
  // Table format (Timestamp, type, info)
  socket.on('message_table_input', function(data) {

      getDataTable('#table_messages').row.add([data.timestamp,
          data.type,
          data.info
      ]).draw().node();


  });