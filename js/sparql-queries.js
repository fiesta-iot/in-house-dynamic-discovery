var discovery = require('./resource-discovery')

module.exports = {

    resources_global: 'PREFIX iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#>' +
        'PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>' +
        'PREFIX geo:  <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'PREFIX m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'PREFIX xsd:  <http://www.w3.org/2001/XMLSchema#>' +
        'SELECT ?dev ?sensor ?qk ?unit ?endp ?lat ?long ' +
        'WHERE {' +
        '?dev a ssn:Device .' +
        '?dev ssn:onPlatform ?platform .' +
        '?platform geo:location ?point .' +
        '?point geo:lat ?lat .' +
        '?point geo:long ?long .' +
        '?dev ssn:hasSubSystem ?sensor .' +
        // '?sensor a ssn:SensingDevice .' +
        '?sensor iot-lite:exposedBy ?serv .' +
        '?sensor iot-lite:hasQuantityKind ?qkr .' +
        '?qkr rdf:type ?qk .' +
        '?sensor iot-lite:hasUnit ?unitr .' +
        '?unitr rdf:type ?unit .' +
        '?serv iot-lite:endpoint ?endp .' +
        'VALUES ?qk {VVVVV}.' +
        // 'FILTER ((xsd:double(?lat) >= "AAAAA"^^xsd:double) ' +
        // '&& (xsd:double(?lat) <= "BBBBB"^^xsd:double) ' +
        // '&& ( xsd:double(?long) >= "CCCCC"^^xsd:double) ' +
        // '&& ( xsd:double(?long) <= "DDDDD"^^xsd:double)) ' +
        '}order by asc(UCASE(str(?dev))) ',

    resources_v2: 'PREFIX m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'PREFIX iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#>' +
        'PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>' +
        'PREFIX geo:  <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        // 'SELECT ?qk ?unit ?endp ?lat ?long  ?system ?sub' +
        'SELECT ?qk ?unit ?endp ?lat ?long ?sub' +
        'WHERE {' +
        '?system rdf:type/rdfs:subClassOf ssn:System .' +
        '?system ssn:hasDeployment ?testbed .' +
        '?system ssn:onPlatform ?platform .' +
        '?platform geo:location ?point .' +
        '?point geo:lat ?lat .' +
        '?point geo:long ?long .' +
        // '{' +
        '?system ssn:hasSubSystem ?sub .' +
        '?sub iot-lite:hasQuantityKind ?qkr .' +
        '?qkr rdf:type ?qk .' +
        '?sub iot-lite:hasUnit ?unitr .' +
        '?unitr rdf:type ?unit .' +
        'OPTIONAL {' +
        '?sub iot-lite:exposedBy ?serv .' +
        '?serv iot-lite:endpoint ?endp . ' +
        'VALUES ?qk {VVVVV}.' +
        '}' +
        // '}' +
        // 'UNION' +
        // '{' +
        //     '?system iot-lite:hasQuantityKind ?qkr .' +
        //     '?qkr rdf:type ?qk .' +
        //     '?system iot-lite:hasUnit ?unitr .' +
        //     '?unitr rdf:type ?unit .' +
        // '}' +
        // 'OPTIONAL {' +
        //     '?system iot-lite:exposedBy ?serv .' +
        //     '?serv iot-lite:endpoint ?endp . ' +
        // '}' +
        // 'VALUES ?qk {VVVVV}.' +
        '} ',

    resources_v3: 'PREFIX m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'PREFIX iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#>' +
        'PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>' +
        'PREFIX geo:  <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +

        'SELECT ?sensor ?type ?qk ?unit ?endp ?lat ?long ?system  ' +
        'WHERE {' +
        // #Device as the basis
        '{' +
            '?dev rdf:type/rdfs:subClassOf ssn:Device .' +
            '?dev rdf:type ?type .' +
            '?dev ssn:onPlatform ?platform .' +
            '?platform geo:location ?point .' +
            '?point geo:lat ?lat .' +
            '?point geo:long ?long .' +
            '?dev ssn:hasSubSystem ?sensor .' +
            '?sensor iot-lite:hasQuantityKind ?qkr .' +
            '?qkr rdf:type ?qk .' +
            '?sensor iot-lite:hasUnit ?unitr .' +
            '?unitr rdf:type ?unit .' +
            'OPTIONAL {' +
                '?sensor iot-lite:exposedBy ?serv .' +
                '?serv iot-lite:endpoint ?endp . ' +
            '}' +
        '}' +
        'UNION' +
        // #SensingDevice as the basis
        '{' +
            '?sensor rdf:type/rdfs:subClassOf ssn:SensingDevice .' +
            '?sensor ssn:onPlatform ?platform .' +
            '?platform geo:location ?point .' +
            '?point geo:lat ?lat .' +
            '?point geo:long ?long .' +
            '?sensor iot-lite:hasQuantityKind ?qkr .' +
            '?qkr rdf:type ?qk .' +
            '?sensor iot-lite:hasUnit ?unitr .' +
            '?unitr rdf:type ?unit .' +
            'OPTIONAL {' +
                '?sensor iot-lite:exposedBy ?serv .' +
                '?serv iot-lite:endpoint ?endp . ' +
            '}' +
            '}' +
            'VALUES ?qk {VVVVV}.' +
        '} ',


    raw_observations: 'Prefix ssn: <http://purl.oclc.org/NET/ssnx/ssn#> ' +
        'Prefix iotlite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'Prefix dul: <http://www.loa.istc.cnr.it/ontologies/DUL.owl#>' +
        'Prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'Prefix time: <http://www.w3.org/2006/time#>' +
        'Prefix m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'Prefix xsd: <http://www.w3.org/2001/XMLSchema#>' +
        'select ?s (max(?ti) as ?tim) ?val ?lat ?long ' +
        'where { ' +
        '?o a ssn:Observation.' +
        '?o ssn:observedBy ?s.' +
        // '?o ssn:observedBy {SSSSS}.' +
        '?o ssn:observedProperty ?qk.' +
        '?o ssn:observationSamplingTime ?t. ' +
        '?o geo:location ?point. ' +
        '?point geo:lat ?lat. ' +
        '?point geo:long ?long. ' +
        '?t time:inXSDDateTime ?ti.' +
        '?o ssn:observationResult ?or.' +
        '?or  ssn:hasValue ?v. ' +
        '?v dul:hasDataValue ?val.' +
        '{ ' +
        'select  (max(?dt)as ?ti) ?s ' +
        'where { ' +
        '?o a ssn:Observation.' +
        '?o ssn:observedBy ?s. ' +
        '?o ssn:observedProperty ?qk.' +
        '?o ssn:observationSamplingTime ?t. ' +
        '?t time:inXSDDateTime ?dt. ' +
        '}group by (?s) ' +
        '} ' +
        '} group by (?s) ?tim ?val ?lat ?long ',

    last_observation: 'Prefix ssn: <http://purl.oclc.org/NET/ssnx/ssn#> ' +
        'PREFIX iotlite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#> ' +
        'PREFIX dul: <http://www.loa.istc.cnr.it/ontologies/DUL.owl#> ' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'PREFIX time: <http://www.w3.org/2006/time#>' +
        'PREFIX m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        'PREFIX iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#>' +
        'SELECT (max(?ti) as ?timestamp) ?s ?qk  ?value ?unit ' +
        'WHERE { ' +
        '?o a ssn:Observation.' +
        '?o ssn:observedBy ?s .' +
        'VALUES ?s {SSSSS} .' +
        '?o ssn:observedProperty ?qkr.' +
        '?qkr rdf:type ?qk.' +
        '?o ssn:observationSamplingTime ?t.' +
        '?t time:inXSDDateTime ?ti.' +
        '?o ssn:observationResult ?or.' +
        '?or  ssn:hasValue ?v. ' +
        '?v dul:hasDataValue ?value.' +
        '?v iot-lite:hasUnit ?u.' +
        '?u rdf:type ?unit .' +
        '} group by (?s) ?timestamp ?value ?lat ?long ?qk ?unit',

    last_observation_v2: 'Prefix ssn: <http://purl.oclc.org/NET/ssnx/ssn#> ' +
        'Prefix iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#> ' +
        'Prefix dul: <http://www.loa.istc.cnr.it/ontologies/DUL.owl#> ' +
        'Prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
        'Prefix time: <http://www.w3.org/2006/time#>' +
        'Prefix m3-lite: <http://purl.org/iot/vocab/m3-lite#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'Prefix xsd: <http://www.w3.org/2001/XMLSchema#>' +
        'select ?s (max(?ti) as ?timestamp) ?value ?lat ?long ?qk ?unit ' +
        'where { ' +
            '?o a ssn:Observation.' +
            '?o ssn:observedBy ?s.' +
            'VALUES ?s {SSSSS} . ' +         
            '?o ssn:observationSamplingTime ?t. ' +
            '?o geo:location ?point. ' +
            '?point geo:lat ?lat. ' +
            '?point geo:long ?long.  ' +
            '?t time:inXSDDateTime ?ti. ' +
            '?o ssn:observationResult ?or. ' +
            '?or  ssn:hasValue ?v. ' +
            '?v dul:hasDataValue ?value. ' +
            '{ ' +
                'select  (max(?dt)as ?ti) ?s ?qk ?unit ' +
                'where { ' +
                    '?o a ssn:Observation.' +
                    '?o ssn:observedBy ?s. '   +
                    '?o ssn:observedProperty ?qkr.' +
                    '?qkr rdf:type ?qk.' +
                    '?s iot-lite:hasUnit ?unitr.' +
                    '?unitr rdf:type ?unit .' +
                    '?o ssn:observationSamplingTime ?t. ' +
                    '?t time:inXSDDateTime ?dt. ' +
                '}group by (?s) ?qk ?unit' +
            '} ' +
        '} group by (?s) ?timestamp ?value ?lat ?long ?qk ?unit',

    location_from_observation: 'Prefix ssn: <http://purl.oclc.org/NET/ssnx/ssn#> ' +
            'Prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            'Prefix time: <http://www.w3.org/2006/time#>' +
            'Prefix xsd: <http://www.w3.org/2001/XMLSchema#>' +
            'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
            'Prefix iot-lite: <http://purl.oclc.org/NET/UNIS/fiware/iot-lite#> ' +
            'select ?sensor (max(?ti) as ?timestamp) ?lat ?long ?type ?qk ?unit ' +
            'where { ' +
                '?o a ssn:Observation.' +
                '?o ssn:observedBy ?sensor .' +
                '?sensor rdf:type ?type .' +
                'VALUES ?sensor {SSSSS} . '  +               
                '?o ssn:observationSamplingTime ?t. ' +
                '?o geo:location ?point. ' +
                '?point geo:lat ?lat. ' +
                '?point geo:long ?long.'  +
                '?t time:inXSDDateTime ?ti. ' +
                '?o ssn:observedProperty ?qkr.' +
                '?qkr rdf:type ?qk .' +     
                '?sensor iot-lite:hasUnit ?unitr.' +
                '?unitr rdf:type ?unit .' +
                '{ ' +
                    'select  (max(?dt)as ?ti) ?sensor '  +
                    'where { ' + 
                        '?o a ssn:Observation.' +
                        '?o ssn:observedBy ?sensor.   ' +
                        '?o ssn:observationSamplingTime ?t. ' +
                        '?t time:inXSDDateTime ?dt. ' +
                    '}group by (?sensor) ' +
                '} ' +
            '} group by (?sensor) ?timestamp  ?lat ?long ?type ?qk ?unit',


    tally: 'PREFIX ssn: <http://purl.oclc.org/NET/ssnx/ssn#>' +
        'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
        'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
        'SELECT  (COUNT(DISTINCT ?dep) AS ?deployments)' +
        '(COUNT(DISTINCT ?dev) AS ?devices) ' +
        '(COUNT(DISTINCT ?sens) AS ?sensors) ' +
        '(COUNT(DISTINCT ?obs) AS ?observations) ' +
        'WHERE { ' +
        '{?dep a ssn:Deployment}' +
        'UNION' +
        '{?dev a ssn:Device}' +
        'UNION' +
        '{?sens rdf:type/rdfs:subClassOf ssn:SensingDevice}' +
        'UNION' +
        '{?obs a ssn:Observation}' +
        '}'
};