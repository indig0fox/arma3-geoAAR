
function filterBy (frame) {
  const filters = ['==', 'frame', frame];
  map.setFilter('entity-positions', filters);

  // Set the label
  document.getElementById('frame').textContent = `Frame ${frame} / ${recordingData.endFrame - 1}`;
  document.getElementById('slider').value = frame;
}


async function parse_replay_positions (filename) {
  data = await fetch(filename).then(response => response.json());

  // map main fields of JSON to recordingData
  recordingData = await Object.assign(recordingData, data);

  // append frames from 0 to endFrame to framePositions
  // for (var i = 0; i < recordingData.endFrame; i++) {
  //   recordingData.framePositions.push({
  //     type: 'FeatureCollection',
  //     properties: {
  //       frame: i,
  //     },
  //     features: []
  //   });
  // };


  // parse entities
  GeoJSON.defaults = { Point: 'position' };

  for (var i = 0; i < data.entities.length; i++) {
    var entity = {
      "id": -1,
      "name": "",
      "type": "",
      "positions": [],
      "framesFired": [],
      "startFrameNum": 0,
      "role": "",
      "side": "",
    }
    entity = Object.assign(entity, data.entities[i]);

    entityType = "unknown";
    entitySide = "unknown";
    switch (entity.type) {
      case "unit":
        entityType = "man";
      case "vehicle":
        entityType = "vehicle";
    };
    switch (entity.side) {
      case "WEST":
        entitySide = "BLUFOR";
      case "EAST":
        entitySide = "OPFOR";
      case "GUER":
        entitySide = "INDFOR";
      case "CIV":
        entitySide = "CIV";
    };


    for (var j = 0; j < entity.positions.length; j++) {
      var thisFrame = entity.startFrameNum + j;
      if (thisFrame > recordingData.endFrame) { break; };
      if (entity.positions[j].length == 0) { continue; };

      var position = entity.positions[j][0];
      var bearing = entity.positions[j][1];
      var lifestate = entity.positions[j][2];
      var inVehicle = entity.positions[j][3];
      var name = entity.positions[j][4];
      var isPlayer = entity.positions[j][5];
      var role = entity.positions[j][6];

      if (position) {

        posCoords = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [position[0], position[1] - worldsize, position[2]]);
        // console.log(posCoords);

        var entityColor = entityColors[entity.side];
        switch (lifestate) {
          case 0:
            entityColor = "#000000"
            break;
          case 2:
            entityColor = "#FFFF00"
            break;
        };


        // recordingData.framePositions[thisFrame].features.push(GeoJSON.parse({
        recordingData.framePositions.features.push(GeoJSON.parse({
          "frame": thisFrame,
          "id": entity.id,
          // "icon": entityType,
          "icon": "shop-15",
          "color": entityColor,
          "name": entity.name,
          "type": entity.type,
          "position": posCoords,
          "bearing": bearing,
          "lifestate": lifestate,
          "inVehicle": inVehicle,
          "role": role,
          "side": entity.side,
        }));
      };
    };
  };
};

map.addSource('entity-positions', {
  'type': 'geojson',
  // 'data': recordingData.framePositions[0].positions
  'data': recordingData.framePositions
});


map.addLayer({
  'id': 'entity-positions',
  'type': 'symbol',
  'source': 'entity-positions',
  'layout': {
    'icon-image': ['get', 'icon'],
    'icon-pitch-alignment': 'map',
    'icon-rotate': ['get', 'bearing'],
    'icon-rotation-alignment': 'map',
    'icon-size': 1,
    'symbol-placement': 'point',
    'icon-ignore-placement': true,
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'text-anchor': 'bottom',
    'text-ignore-placement': true,
    'text-keep-upright': true,
    'text-pitch-alignment': 'viewport',
    'text-size': 12,
    'text-field': ['concat', ['get', 'name'], ' (', ['get', 'role'], ')'],
  },
  'paint': {
    'text-color': '#FFF',
    'text-halo-color': '#000',
    'text-halo-width': 0.5,
    'icon-color': ['get', 'color'],
  }
});


map.on('load', async () => {

  placement = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [8000, -8000]);
  // map.setCenter(placement);
  new maplibregl.Marker({
    draggable: true
  })
    .setLngLat(placement)
    .setPopup(new maplibregl.Popup().setHTML("<h1>Marker</h1>"))
    .addTo(map)

  // Create a DOM element for each marker.
  // const el = document.createElement('div');
  // const width = 30;
  // const height = 30;
  // el.className = 'marker';
  // el.style.backgroundImage = `url(http://server.242nightstalkers.com:5000/images/markers/man/blufor.svg)`;
  // el.style.width = `${width}px`;
  // el.style.height = `${height}px`;
  // el.style.backgroundSize = '100%';

  // Add markers to the map.
  // new maplibregl.Marker(el)
  //   .setLngLat(proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [8020, -8020]))
  //   .setRotation(45)
  //   .setRotationAlignment('map')
  //   .addTo(map);


  await fetch(hostedPrefix + tileServerPrefix + `/styles/${layerId}/style.json`)
    .then(res => res.json())
    .then(data => {
      worldsize = data.worldsize
    })


  await parse_replay_positions('http://indigoweb.site.nfoservers.com/2022_10_29__17_47_242CO12-FourFingerFistV110.json');


  // entityIcons = [
  //   'apc',
  //   'car',
  //   'heli',
  //   'man',
  //   'parachute',
  //   'plane',
  //   'ship',
  //   'tank',
  //   'truck',
  //   'unknown'
  // ];

  // for (var i = 0; i < entityIcons.length; i++) {
  //   await map.loadImage(`${hostedPrefix}/markers/${entityIcons[i]}.svg`, function (error, image) {
  //     if (error) throw error;
  //     map.addImage(entityIcons[i], image, {
  //       sdf: true
  //     });
  //   });
  // }

  await map.loadImage(`${hostedPrefix}/markers/shop-15.png`, function (error, image) {
    if (error) throw error;
    map.addImage('shop-15', image, {
      sdf: true
    });
  });


  // autoplay
  // var currentFrame = 0;
  // const Timer = setInterval(() => {
  //   if (currentFrame >= recordingData.endFrame) {
  //     clearInterval(Timer);
  //     return;
  //   }
  //   console.log(`Current frame: ${currentFrame}`)
  //   map.getSource('entityPositions').setData(recordingData.framePositions[currentFrame]);
  //   currentFrame++
  // }, 750);



  // Use input slider
  // Set filter to first month of the year
  // 0 = January
  filterBy(0);

  document.getElementById('slider').setAttribute('max', recordingData.endFrame - 1);

  document.getElementById('slider').addEventListener('input', (e) => {
    const frame = parseInt(e.target.value, 10);
    filterBy(frame);
  });

  map.on('movestart', function () {
    if (playbackRunning) {
      document.getElementById('playback').click();
      playbackWasRunning = true
    };
  });

  map.on('moveend', function () {
    if (playbackWasRunning) {
      document.getElementById('playback').click();
    };
  });

  document.getElementById('playback').addEventListener('click', () => {
    playbackRunning = !playbackRunning;
    document.getElementById('playback').innerHTML = playbackRunning ? 'Pause' : 'Play';

    if (playbackRunning) {
      playbackLoop = window.setInterval(() => {
        if (playbackRunning) {
          // console.log(playbackRunning)
          const frame = parseInt(document.getElementById('slider').value, 10);
          if (frame < recordingData.endFrame - 1) {
            filterBy(frame + 1);
          }
        }
      }, 1000 / playbackSpeed);
      playbackWasRunning = true;
    } else {
      clearInterval(playbackLoop);
      playbackWasRunning = false;
    };
  });
  document.getElementById('fivexspeed').addEventListener('click', () => {
    // if already 5x, reset to 1x
    if (playbackSpeed >= 5) {
      playbackSpeed = 1;
      document.getElementById('currentspeed').innerHTML = 'Current speed: 1x';
    } else {
      playbackSpeed = 5;
      document.getElementById('currentspeed').innerHTML = 'Current speed: 5x';
    };

    // click play/pause button twice to reset the interval
    document.getElementById('playback').click();
    document.getElementById('playback').click();
  });
});

