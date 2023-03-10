function parse_replay_positions () {

  // append frames from 0 to endFrame to framePositions
  document.getElementById('frame').textContent = "Populating frame data..."

  for (var i = 0; i < recordingData.entities.length; i++) {
    var entity = {};
    if (recordingData.entities[i].type == "unit") {
      entity = {
        "id": -1,
        "name": "",
        "side": "",
        "type": "",
        "role": "",
        "positions": [],
        "framesFired": [],
        "startFrameNum": 0,
      };
      entity = Object.assign(entity, recordingData.entities[i]);
      entity.type = getType(entity.type);
      recordingData.playbackUnits[entity.id] = new Unit(entity.id, entity.name, entity.side, entity.type, entity.role, entity.positions, entity.framesFired, entity.startFrameNum);

    } else {
      entity = {
        "id": -1,
        "name": "",
        "class": "",
        "type": "",
        "positions": [],
        "framesFired": [],
        "startFrameNum": 0
      };
      entity = Object.assign(entity, recordingData.entities[i]);
      entity.type = getType(entity.class);

      var hasCondensedFrames = true;
      if (entity.positions[0].length < 4) {
        hasCondensedFrames = false;
      };

      if (entity.positions.length > 0) {
        recordingData.playbackUnits[entity.id] = new Vehicle(entity.id, entity.name, entity.class, entity.type, entity.positions, entity.framesFired, entity.startFrameNum, hasCondensedFrames);
      };
    };
  };
};

window.lastFrame = 0; // timestamp of the last render() call
window.heavyProcessDelay = 1.5; // delay in seconds for deferred procesing
window.lastFrameFirelines = 0;
window.firelinesProcessDelay = 0.1; // delay in seconds for firelines rendering

function renderFrame (now) {
  // console.log(`Playing frame: ${frame}`);

  // Set the label
  frame = Math.floor(window.currentPlaybackFrame);
  document.getElementById('frame').textContent = `Frame ${frame} / ${recordingData.endFrame - 1}`;


  // iterate through playbackUnits and update
  for (var unitId in Object.keys(recordingData.playbackUnits)) {
    var unit = recordingData.playbackUnits[unitId];
    unit.updateAtFrame(frame, now);
  };


  // deferred rendering

  if (!window.lastFrameFirelines || now - window.lastFrameFirelines >= window.firelinesProcessDelay * 1000) {
    window.lastFrameFirelines = now;
    if (map.isStyleLoaded()) {
      showFirelines(frame)
    };
  };

  if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
    window.lastFrame = now;

    // if (map.isStyleLoaded()) {
    showMarkersAtFrame(frame);
    // showUnitsAtFrame(frame);
    // };

    // iterate through sides and update value with numbers of units
    Object.keys(SideDivs).forEach(side => {
      var obj = SideDivs[side];
      // var sideUnits = Object.values(recordingData.framePositions[window.currentPlaybackFrame]).filter(unit =>
      var sideUnits = Object.values(recordingData.playbackUnits).filter(unit =>
        unit.side == side &&
        unit.type == 'man' &&
        unit.startFrameNum <= frame
      );
      var sideUnitsAlive = sideUnits.filter(unit => [1, 2].includes(unit.lifestate));
      document.getElementById(obj.div).textContent = `${obj.sideName} (${sideUnitsAlive.length} / ${sideUnits.length})`;
    });
  };


  requestAnimationFrame(renderFrame);
};

function unloadRecording () {
  if (window.renderFrame != undefined) {
    cancelAnimationFrame(renderFrame);
  };
  if (window.recordingData == undefined) {
    return;
  };
  for (var unitId in Object.keys(recordingData.playbackUnits)) {
    var unit = recordingData.playbackUnits[unitId];
    unit.remove();
  };
  window.recordingData = {};
  window.currentPlaybackFrame = 0;
  document.getElementById('frame').textContent = "No recording loaded";
  document.getElementById('blufor-status-text').textContent = "Blufor (0 / 0)";
  document.getElementById('opfor-status-text').textContent = "Opfor (0 / 0)";
  document.getElementById('indfor-status-text').textContent = "Indfor (0 / 0)";
  document.getElementById('civilian-status-text').textContent = "Civ (0 / 0)";

};


function loadRecording (url) {
  console.log(url);
  unloadRecording();

  window.recordingData = {
    "worldName": "",
    "missionName": "",
    "missionAuthor": "",
    "captureDelay": 0,
    "endFrame": 0,
    "extensionBuild": "",
    "extensionVersion": "",
    "addonVersion": "",
    "tags": [],
    "entities": [],
    "Markers": [],
    "times": [],
    // "framePositions": {
    //   "type": "FeatureCollection",
    //   "features": []
    // }
    "framePositions": [],
    "playbackUnits": {},
    "firelines": []
  };

  fetch(url)
    .then(response => {
      // if url is .json.gz, unpack it
      if (url.endsWith(".gz")) {
        data = loadCompressedASCIIFile(url)
        return JSON.parse(data)
      } else {
        return response.json()
      }
    })
    .then(data => {
      // map main fields of JSON to recordingData
      window.recordingData = Object.assign(window.recordingData, data);
      return window.recordingData;
    })
    .then(data => {
      console.log("loading recording " + url)
      window.worldName = data.worldName.toLowerCase();
      console.log(window.worldName);
      return Promise.resolve(data)
    })
    .then((data) => {




      window.worldsize = 0
      window.playbackRunning = false
      window.playbackWasRunning = false
      window.playbackSpeed = 1
      window.playbackLoop = null
      window.currentPlaybackFrame = 0
      window.showUnitMarkers = true
      window.showUnits3d = false
      window.showUnitNames = true

      window.entityColors = {
        "WEST": "00F",
        "EAST": "F00",
        "GUER": "0F0",
        "CIV": "F0F",
        "UNKNOWN": "cccc33", // #cccc33
        "INCAPACITATED": "ff9900", // #ff9900
        "DEAD": "000" // #000
      };


      document.getElementById('frame').textContent = `Loading data...`;
      // wait until worldsize is loaded

      // fetch(hostedPrefix + `/styles/${worldName}-${mapStyle}/style.json`)
      fetch(hostedPrefix + `/styles/${worldName}/style.json`)
        .then(res => res.json())
        .then(data => {
          console.log("Got worldsize: " + data.metadata.worldSize)
          window.worldsize = data.metadata.worldSize;
        })
        .then(() => {

          parse_replay_positions()

          console.log('Data loaded');
          document.getElementById('frame').textContent = `Frame 0 / ${recordingData.endFrame - 1}`;

          document.getElementById('slider').setAttribute('max', recordingData.endFrame - 1);

          // get bbox of all unit positions on frame 0 and fit map to it
          var selectFrom = Object.values(recordingData.playbackUnits);
          var points = selectFrom.
            map(unit => unit.position).
            map(position => {
              return turf.point([position[0], position[1]]);
            });
          var bbox = turf.bbox(turf.featureCollection(points));

          map.setPitch(10);
          map.fitBounds(bbox, { padding: 150 });
          changeMapStyle(mapStyle);
          // renderFrame(0);

        })
    })
    .catch(error => {
      console.error('Error:', error);
      unloadRecording();
    });
};


map.on('load', () => {

  unloadRecording();


  // map.on('movestart', function () {
  //   if (playbackRunning) {
  //     document.getElementById('playback').click();
  //     playbackWasRunning = true
  //   };
  // });

  // map.on('moveend', function () {
  //   if (playbackWasRunning) {
  //     document.getElementById('playback').click();
  //   };
  // });


  // MAKE MARKERS CLICKABLE
  map.on('click', 'markers-line', function (e) {
    // get coordinates in the middle of the line
    var coordinates = e.features[0].geometry.coordinates[Math.floor(e.features[0].geometry.coordinates.length / 2)];
    var placedBy = e.features[0].properties.placedBy;
    var placedBySide = e.features[0].properties.placedBySide;

    var description = `<span style="color: #${entityColors[placedBySide]}">${placedBy} (${placedBySide})</span>`;

    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  map.on('click', 'markers-point', function (e) {
    // get coordinates in the middle of the line
    var coordinates = e.features[0].geometry.coordinates.slice();
    var markerType = e.features[0].properties.markerType;
    var markerText = e.features[0].properties.markerText;
    var placedBy = e.features[0].properties.placedBy;
    var placedBySide = e.features[0].properties.placedBySide;

    var description = `<b>${markerText}</b><br>${markerType}<br>Placed by <span style="color: #${entityColors[placedBySide]}">${placedBy} (${placedBySide})</span>`;

    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  var clickableLayers = [
    'markers-line',
    'markers-point'
  ]

  clickableLayers.forEach(layer => {
    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', layer, function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', layer, function () {
      map.getCanvas().style.cursor = '';
    });
  });




  // PLAYBACK AND LEGEND
  document.getElementById('slider').addEventListener('input', (e) => {
    const frame = parseInt(e.target.value, 10);
    window.currentPlaybackFrame = frame;
  });

  document.getElementById('legend').addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
    setLayerLegend();
  });
  document.getElementById('playback').addEventListener('click', () => {
    playbackRunning = !playbackRunning;
    document.getElementById('playback').innerHTML = playbackRunning ? 'Pause' : 'Play';

    if (playbackRunning) {
      requestAnimationFrame(renderFrame);
      playbackLoop = window.setInterval(() => {
        if (playbackRunning) {
          // console.log(playbackRunning)
          if (window.currentPlaybackFrame < recordingData.endFrame - 1) {
            window.currentPlaybackFrame = window.currentPlaybackFrame + 1;
            document.getElementById('slider').value = window.currentPlaybackFrame;
          }
        }
      }, (recordingData.captureDelay * 1000) / playbackSpeed);
      playbackWasRunning = true;
    } else {
      clearInterval(playbackLoop);
      cancelAnimationFrame(renderFrame);
      playbackWasRunning = false;
    };
  });
  document.getElementById('show-unit-markers').addEventListener('click', () => {
    window.showUnitMarkers = !window.showUnitMarkers;
  });
  // document.getElementById('show-units-3d').addEventListener('click', () => {
  //   window.showUnits3d = !window.showUnits3d;
  //   map.getLayer('units-3d').setLayoutProperty('visibility', window.showUnits3d ? 'visible' : 'none');
  // });
  document.getElementById('show-unit-names').addEventListener('click', () => {
    window.showUnitNames = !window.showUnitNames;
  });
  document.getElementById('onexspeed').addEventListener('click', () => {
    playbackSpeed = 1;
    document.getElementById('currentspeed').innerHTML = 'Current speed: 1x';
    // click play/pause button twice to reset the interval
    document.getElementById('playback').click();
    document.getElementById('playback').click();
  });
  document.getElementById('fivexspeed').addEventListener('click', () => {
    playbackSpeed = 5;
    document.getElementById('currentspeed').innerHTML = 'Current speed: 5x';
    // click play/pause button twice to reset the interval
    document.getElementById('playback').click();
    document.getElementById('playback').click();
  });
  document.getElementById('tenxspeed').addEventListener('click', () => {
    playbackSpeed = 10;
    document.getElementById('currentspeed').innerHTML = 'Current speed: 10x';
    // click play/pause button twice to reset the interval
    document.getElementById('playback').click();
    document.getElementById('playback').click();
  });
  document.getElementById('twentyxspeed').addEventListener('click', () => {
    playbackSpeed = 20;
    document.getElementById('currentspeed').innerHTML = 'Current speed: 20x';
    // click play/pause button twice to reset the interval
    document.getElementById('playback').click();
    document.getElementById('playback').click();
  });
});


function loadCompressedASCIIFile (request_url) {

  var req = new XMLHttpRequest();

  // You gotta trick it into downloading binary.
  req.open('GET', request_url, false);
  req.overrideMimeType('text\/plain; charset=x-user-defined');
  req.send(null);

  // Check for any error....
  if (req.status != 200) {
    return '';
  }

  // Here's our raw binary.
  var rawfile = req.responseText;

  // Ok you gotta walk all the characters here
  // this is to remove the high-order values.

  // Create a byte array.
  var bytes = [];

  // Walk through each character in the stream.
  for (var fileidx = 0; fileidx < rawfile.length; fileidx++) {
    var abyte = rawfile.charCodeAt(fileidx) & 0xff;
    bytes.push(abyte);
  }

  // Instantiate our zlib object, and gunzip it.    
  // Requires: http://goo.gl/PIqhbC [github]
  // (remove the map instruction at the very end.)
  var gunzip = new Zlib.Gunzip(bytes);
  var plain = gunzip.decompress();

  // Now go ahead and create an ascii string from all those bytes.
  var asciistring = "";
  for (var i = 0; i < plain.length; i++) {
    asciistring += String.fromCharCode(plain[i]);
  }

  return asciistring;

}