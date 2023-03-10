async function showFirelines (frame) {
  var frameFireData = turf.featureCollection([]);
  for (var unitId in Object.keys(recordingData.playbackUnits)) {
    var unit = recordingData.playbackUnits[unitId];
    // iterate through recordingData.playbackUnits
    height = 5;
    var unitFrameFireData = unit.firedOnFrame(frame)
    unitFrameFireData.forEach(fireData => {
      var lineString = turf.lineString(
        [
          fireData[0],
          fireData[1]
        ],
        {
          'color': '#' + fireData[2],
          'height': height
        }
      );
      frameFireData.features.push(lineString);
    });
  };

  // buffer firelines to make them extruded polygons
  frameFireData = turf.buffer(frameFireData, 0.0002, { units: 'kilometers' });
  if (map.getSource('firelines') == undefined) {
    addFirelineLayers();
  };
  map.getSource('firelines').setData(frameFireData);
  // console.log('fireline data set, length: ' + frameFireData.length);
};


function addFirelineLayers () {

  const layers = [
    'firelines-extrusion',
    'firelines-lines'
  ];

  layers.forEach(layer => {
    if (map.getLayer(layer) != undefined) {
      map.removeLayer(layer);
    };
  });

  const sources = [
    'firelines'
  ];

  sources.forEach(source => {
    if (map.getSource(source) != undefined) {
      map.removeSource(source);
    };
  });

  map.addSource('firelines', {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': []
    }
  });

  map.addLayer({
    'id': 'firelines-extrusion',
    'type': 'fill-extrusion',
    'source': 'firelines',
    'layout': {},
    'paint': {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-opacity': 0.2
    }
  });

  map.addLayer({
    'id': 'firelines-lines',
    'type': 'line',
    'source': 'firelines',
    'layout': {
      'line-join': 'round',
      'line-cap': 'round'
    },
    'paint': {
      'line-color': ['get', 'color'],
      'line-width': 1,
      'line-opacity': 0.5
    }
  });

  layers.forEach(layer => {
    map.moveLayer(layer, 'house');
  });
};


function parseFiredFrames (id, framesFired) {
  for (var i = 0; i < framesFired.length; i++) {
    var thisFrame = framesFired[i][0];
    var toPosition = framesFired[i][1];
    // find unit position in frame
    var fromPosition = recordingData.framePositions[thisFrame].find(x => x.id == id).position;

    var toPositionCoords = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [toPosition[0], toPosition[1] - worldsize]);
    var fromPositionCoords = fromPosition;
    // add record to recordingData.firelines
    recordingData.firelines[thisFrame].push({
      'coordinates': [
        [fromPositionCoords[0], fromPositionCoords[1]],
        [toPositionCoords[0], toPositionCoords[1]]
      ]
    });
  };
};

async function plotFirelinePaths () {
  document.getElementById('frame').textContent = "Plotting firelines..."
  // iterate through recordingData.firelines and add to map
  for (var i = 0; i < recordingData.firelines.length; i++) {
    document.getElementById('frame').textContent = "Plotting firelines: frame " + i + " of " + recordingData.firelines.length
    const thisFrameData = GeoJSON.parse(
      recordingData.firelines[i],
      { LineString: 'coordinates' }
    );

    // iterate through firelineFeatures and plot animated routes
    var frameFeatures = thisFrameData.features;
    if (frameFeatures.length == 0) { continue; }
    for (var k = 0; k < frameFeatures.length; k++) {
      const thisFeature = frameFeatures[k];

      const lineDistance = turf.length(thisFeature);
      const steps = 5;
      const arc = [];
      for (var d = 0; d < lineDistance; d += lineDistance / steps) {
        const segment = turf.along(thisFeature, d);
        arc.push(segment.geometry.coordinates);
      };
      thisFeature.geometry.coordinates = arc;

      const el = document.createElement('div');
      const width = 10;
      const height = 10;
      el.className = 'marker';
      el.style.backgroundImage = `url(${hostedPrefix}/markers/unknown/unknown.png)`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.backgroundSize = '100%';
      thisFeature.properties.marker = new maplibregl.Marker(el, {
        color: 'white',
        rotationAlignment: "viewport",
      })
        .setLngLat(thisFeature.geometry.coordinates[0])
        .addTo(map);
      thisFeature.properties.marker.getElement().style.visibility = 'hidden';
    };

    thisFrameData.features = frameFeatures;
    recordingData.firelines[i] = thisFrameData;

  };

  console.log('Fireline paths plotted.')
};


async function animateBullets () {
  const thisFrame = parseInt(document.getElementById('slider').value, 10);
  const thisFrameData = recordingData.firelines[thisFrame].features;
  if (!thisFrameData) { return; }
  const steps = 5

  // iterate through firelineFeatures and plot animated routes
  for (var i = 0; i < thisFrameData.length; i++) {
    const thisFeature = thisFrameData[i];

    setIntervalX(function () {
      const feature = recordingData.firelines[thisFrame].features[i];
      if (feature.geometry.coordinates.length < 2) {
        thisFeature.properties.marker.remove();
        return;
      } else {
        const start = thisFeature.geometry.coordinates[0];
        const end = thisFeature.geometry.coordinates[1];
        const pointCoords = thisFeature.geometry.coordinates[firelineAnimationCounter];
        const bearing = turf.bearing(
          turf.point(start),
          turf.point(end)
        );

        var el = thisFeature.properties.marker.getElement();
        if (el.style.visibility == 'hidden') {
          el.style.visibility = 'visible';
        };
        thisFeature.properties.marker
          .setLngLat(pointCoords)
          .setRotation(bearing - map.getBearing())
      };
    })
  };
  firelineAnimationCounter = firelineAnimationCounter + 1;
};

