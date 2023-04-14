function getMarkersAtFrame (frame) {
  const markers = recordingData.Markers.filter(function (marker) {
    if (marker[2] <= frame && frame <= marker[3]) {
      return true
    };
  });
  return markers;
};

function processMarkersAtFrame (frame) {
  var markers = getMarkersAtFrame(frame);

  const features = markers.map(function (marker) {
    let thisMarker = {
      "type": marker[0],
      "markerText": marker[1],
      "startFrame": marker[2],
      "endFrame": marker[3],
      "placedBy": marker[4],
      "color": marker[5],
      "placedBySide": marker[6],
      "positions": marker[7],
      "markerSize": marker[8],
      "markerShape": marker[9],
      "markerBrush": marker[10]
    };

    const thisMarkerFrame = thisMarker.positions.find(position => position[0] <= frame);
    if (!thisMarkerFrame) {
      return null;
    };

    var opacity = (thisMarkerFrame[3] == undefined) ? 1 : thisMarkerFrame[3];
    const placedBy = getUnitById(thisMarker.placedBy);
    const placedByName = (placedBy == -1) ? '[Editor]' : `[${placedBy.name}]`;
    const placedBySide = UnitSidesInt[thisMarker.placedBySide.toString()];
    const divCheckName = window.SideDivs[placedBySide]['mapmark_div'];
    if (document.getElementById(divCheckName).checked === false) {
      return null;
    };
    const sideColor = entityColors[placedBySide];


    switch (thisMarker.markerShape.toUpperCase()) {
      case 'RECTANGLE':
        opacity = Math.min(0.6, Math.max(0.2, opacity));
        var originX = thisMarkerFrame[1][0];
        var originY = thisMarkerFrame[1][1];
        var sizeX = thisMarker.markerSize[0];
        var sizeY = thisMarker.markerSize[1];
        var bearing = thisMarkerFrame[2];
        var coords = []

        if (Array.isArray(originX)) {
          return turf.lineString(
            thisMarkerFrame[1].map(coords => XY_to_LatLon(coords)),
            {
              "markerType": thisMarker.type,
              "color": "#" + thisMarker.color,
              "opacity": opacity,
              "markerText": thisMarker.markerText,
              "markerBrush": thisMarker.markerBrush,
              "placedBy": placedByName,
              "placedBySide": placedBySide
            }
          );
        };
        var feature = turf.bboxPolygon(
          [
            XY_to_LatLon([originX - sizeX, originY - sizeY])[0],
            XY_to_LatLon([originX - sizeX, originY - sizeY])[1],
            XY_to_LatLon([originX + sizeX, originY + sizeY])[0],
            XY_to_LatLon([originX + sizeX, originY + sizeY])[1]
          ],
          {
            'properties': {
              "markerType": thisMarker.type,
              "color": "#" + thisMarker.color,
              "opacity": opacity,
              "markerText": thisMarker.markerText,
              "markerBrush": thisMarker.markerBrush,
              "filled": (thisMarker.markerBrush.includes('Border') || thisMarker.markerBrush.includes("Diagonal")) ? false : true,
              "placedBy": placedByName,
              "placedBySide": placedBySide
            }
          }
        );
        return turf.transformRotate(
          feature,
          bearing,
          {
            pivot: XY_to_LatLon([originX, originY]),
            mutate: false
          }
        );
      case 'ELLIPSE':
        opacity = Math.min(0.6, Math.max(0.2, opacity));
        var originX = thisMarkerFrame[1][0];
        var originY = thisMarkerFrame[1][1];
        var sizeX = thisMarker.markerSize[0];
        var sizeY = thisMarker.markerSize[1];
        var bearing = thisMarkerFrame[2];
        return turf.ellipse(
          XY_to_LatLon([originX, originY]),
          sizeX,
          sizeY,
          {
            'properties': {
              "markerType": thisMarker.type,
              "color": "#" + thisMarker.color,
              "opacity": opacity,
              "markerText": thisMarker.markerText,
              "markerBrush": thisMarker.markerBrush,
              "placedBy": placedByName,
              "placedBySide": placedBySide
            },
            'angle': bearing,
            'units': 'meters',
            'steps': 64
          }
        );
      case 'POLYLINE':
        return turf.lineString(
          thisMarkerFrame[1].map(coords => XY_to_LatLon(coords)),
          {
            "markerType": thisMarker.type,
            "color": "#" + thisMarker.color,
            "opacity": opacity,
            "markerText": thisMarker.markerText,
            "markerBrush": thisMarker.markerBrush,
            "placedBy": placedByName,
            "placedBySide": placedBySide
          }
        );
      default: // POINT/ICON
        return (turf.point(
          XY_to_LatLon(thisMarkerFrame[1]),
          {
            "markerType": thisMarker.type,
            "color": "#" + thisMarker.color,
            "markerImage": `${thisMarker.type.replace("magIcons/", "")
              }_${thisMarker.color}`,
            "opacity": opacity,
            "markerText": thisMarker.markerText,
            "markerTextColor": "#" + sideColor,
            "markerBrush": thisMarker.markerBrush,
            "placedBy": placedByName,
            "placedBySide": placedBySide

          }

        ));
    };
  });

  const validFeatures = features.filter(feature => feature != null);
  console.log('processed markers on frame ' + frame)
  return turf.featureCollection(validFeatures);
};


function showMarkersAtFrame (frame) {
  const markers = processMarkersAtFrame(frame)
  // .then(function (markers) {
  if (map.getSource('markers') == undefined) {
    addMarkerLayers();
  };
  map.getSource('markers').setData(markers);
  // })
}

async function showUnitsAtFrame () {
  var xoffset = turf.lengthToDegrees(2, 'meters');
  var yoffset = turf.lengthToDegrees(3.5, 'meters');
  var geojson = turf.featureCollection([]);
  for (var i = 0; i < Object.keys(recordingData.playbackUnits).length; i++) {
    var unit = recordingData.playbackUnits[i];
    if (unit.position == undefined || unit.marker == undefined || unit.bearing == undefined) {
      continue
    };

    if (unit.type === "man" && (unit.inVehicle)) {
      continue;
    };

    var position = unit.position;
    var color = unit.colorHex;
    if (unit.type != "man") {
      var feature = turf.bboxPolygon(
        [
          position[0] - xoffset,
          position[1] - yoffset,
          position[0] + xoffset,
          position[1] + yoffset
        ],
        {
          'properties': {
            'color': '#' + color
          }
        }
      );
      feature = turf.transformRotate(feature, unit.bearing, { pivot: position, mutate: false });
      geojson.features.push(feature);
    } else {

      geojson.features.push(turf.circle(
        position,
        1,  // radius
        {
          'properties': {
            'color': '#' + color
          },
          'steps': 8,
          'units': 'meters'
        }
      ));
    };
  };
  if (map.getSource('units') == undefined) {
    await addMarkerLayers();
  };
  map.getSource('units').setData(geojson);
};



async function addMarkerLayers () {

  const layers = [
    'units-3d',
    'markers-polygon-fill',
    'markers-polygon-stroke',
    'markers-line',
    'markers-point'
  ]

  layers.forEach(layer => {
    if (map.getLayer(layer) != undefined) {
      map.removeLayer(layer);
    };
  });

  const sources = [
    'units',
    'markers'
  ];

  sources.forEach(source => {
    if (map.getSource(source) != undefined) {
      map.removeSource(source);
    };
  });


  // test polygons for unit positions
  map.addSource('units', {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': []
    }
  });

  map.addLayer({
    'id': 'units-3d',
    'type': 'fill-extrusion',
    'source': 'units',
    'layout': {
      'visibility': 'visible'
    },
    'paint': {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': 2.7,
      // 'fill-extrusion-height': 20,
      'fill-extrusion-opacity': 1
    }
  })

  map.addSource('markers', {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': []
    }
  });

  map.addLayer({
    'id': 'markers-polygon-fill',
    'type': 'fill',
    'source': 'markers',
    'layout': {},
    'paint': {

      'fill-color': ['get', 'color'],
      'fill-opacity': [
        "case",
        ["==", ["get", "filled"], true],
        0,
        ['get', 'opacity']
      ]
    },
    'filter': ['==', '$type', 'Polygon']
  });

  map.addLayer({
    'id': 'markers-polygon-stroke',
    'type': 'line',
    'source': 'markers',
    'layout': {},
    'paint': {
      'line-color': ['get', 'color'],
      'line-opacity': ['get', 'opacity'],
      'line-width': 2
    },
    'filter': ['==', '$type', 'Polygon']
  });

  map.addLayer({
    'id': 'markers-line',
    'type': 'line',
    'source': 'markers',
    'layout': {},
    'paint': {
      'line-color': ['get', 'color'],
      'line-opacity': ['get', 'opacity'],
      'line-width': 2
    },
    'filter': ['==', '$type', 'LineString']
  });

  map.addLayer({
    'id': 'markers-point',
    'type': 'symbol',
    'source': 'markers',
    'layout': {
      'icon-image': ['get', 'markerImage'],
      'icon-allow-overlap': true,
      'icon-rotation-alignment': 'map',
      'text-ignore-placement': true,
      'icon-size': 1,
      'text-field': ['case',
        ['==', ['get', 'markerText'], ''],
        '',
        ['concat', ['get', 'markerText'], ' (', ['get', 'placedBySide'], ')']
      ],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 2],
      'text-anchor': 'top',
      'text-size': 12,
      'text-optional': true,
      'text-rotation-alignment': 'map',
    },
    'paint': {
      'text-color': ['get', 'markerTextColor'],
      'text-opacity': ['get', 'opacity']
    },
    'filter': ['==', '$type', 'Point']
  });

  layers.forEach(layer => {
    map.moveLayer(layer, 'house');
  });

  return map.getSource('markers');
};