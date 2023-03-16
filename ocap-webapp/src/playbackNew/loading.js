import { Unit, Vehicle } from './entities.js';
import { getType } from './utils.js';

export function loadEntityData (entities) {
  const playbackUnits = {};
  for (var i = 0; i < entities.length; i++) {
    var entity = {};
    if (entities[i].type == "unit") {
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
      entity = Object.assign(entity, entities[i]);
      entity.type = getType(entity.type);
      playbackUnits[entity.id] = new Unit(entity.id, entity.name, entity.side, entity.type, entity.role, entity.positions, entity.framesFired, entity.startFrameNum);

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
      entity = Object.assign(entity, entities[i]);
      entity.type = getType(entity.class);

      var hasCondensedFrames = true;
      if (entity.positions[0].length < 4) {
        hasCondensedFrames = false;
      };

      if (entity.positions.length > 0) {
        playbackUnits[entity.id] = new Vehicle(entity.id, entity.name, entity.class, entity.type, entity.positions, entity.framesFired, entity.startFrameNum, hasCondensedFrames);
      };
    };
  };
  return playbackUnits;
}

import { entityColors } from '@/arma3data/definitions.js'
import { Popup } from 'maplibre-gl'
export function showMarkerInfoOnClick (map) {
  // MAKE MARKERS CLICKABLE
  map.on('click', 'markers-line', function (e) {
    // get coordinates in the middle of the line
    var coordinates = e.features[0].geometry.coordinates[Math.floor(e.features[0].geometry.coordinates.length / 2)];
    var placedBy = e.features[0].properties.placedBy;
    var placedBySide = e.features[0].properties.placedBySide;

    var description = `<span style="color: #${entityColors[placedBySide]}">${placedBy} (${placedBySide})</span>`;

    new Popup()
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

    new Popup()
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
}