import { Unit, Vehicle } from './entities.js';
import { getType, XY_to_LatLon } from './utils.js';

export async function loadEntityData (entities, endFrame) {
  const playbackUnits = {};
  entities.forEach((entityJSON) => {

    const positions = new Map();
    let hasCondensedFrames = false;

    // * iterate through total frames and precache entity positions


    if (entityJSON.type == "unit") {
      for (var i = 0; i < endFrame; i++) {
        // unit
        const position = entityJSON.positions[i - entityJSON.startFrameNum]
        // console.log(position)
        if (position == null || position === []) {
          positions.set(i, positions.get(i - 1))
          return
        }

        const pos = position[0];
        const dir = position[1];
        const alive = position[2];

        const isInVehicle = position[3] == 1;
        const isPlayer = position[5] == 1;
        let name = position[4]
        if (name == "" && i > 0) {
          name = positions.get(i - 1).name
        } else if (name == "" && i == 0) {
          name = "Unknown"
        }

        let role = position.length >= 7 ? position[6] : "Man"

        positions.set(i, {
          position: XY_to_LatLon(pos),
          direction: dir,
          alive: alive,
          isInVehicle: isInVehicle,
          name: name,
          isPlayer: isPlayer,
          role: role
        })
      }
    } else {
      if (entityJSON.positions.length == 0) {
        return
      }

      let vehiclePositions = [];

      entityJSON.positions.forEach((position) => {
        const pos = position[0];
        const dir = position[1];
        const alive = position[2];

        const crew = position[3];
        const newVehiclePos = {
          position: XY_to_LatLon(pos),
          direction: dir,
          alive: alive,
          crew: crew,
        }
        if (position.length >= 5) {
          newVehiclePos.frames = position[4]
        }
        vehiclePositions.push(newVehiclePos)
      })

      const hasCondensedFrames = vehiclePositions.length > 0 && vehiclePositions[0].frames != null

      for (var i = 0; i < endFrame; i++) {
        // vehicle

        if (hasCondensedFrames) {
          const newVehiclePos = vehiclePositions.find((pos) => {
            return (
              i >= pos.frames[0] - entityJSON.startFrameNum &&
              i <= pos.frames[1] - entityJSON.startFrameNum
            )
          })
          if (!newVehiclePos) {
            positions.set(i, positions.get(i - 1))
            return
          } else {
            positions.set(i, newVehiclePos)
            continue
          }
        } else {
          const newVehiclePos = vehiclePositions[i - entityJSON.startFrameNum]
          if (!newVehiclePos) {
            positions.set(i, positions.get(i - 1))
            return
          }
          positions.set(i, newVehiclePos)
        }

      }
    }
    // console.log(positions)


    if (entityJSON.type == "unit") {
      playbackUnits[entityJSON.id] = new Unit(entityJSON.id, entityJSON.name, entityJSON.side, 'man', entityJSON.role, positions, entityJSON.framesFired, entityJSON.startFrameNum)
    } else {
      var vehicleType = getType(entityJSON.class)
      playbackUnits[entityJSON.id] = new Vehicle(entityJSON.id, entityJSON.name, entityJSON.class, vehicleType, positions, entityJSON.framesFired, entityJSON.startFrameNum, hasCondensedFrames)
    }

    // console.log(entityJSON.id, playbackUnits[entityJSON.id])

    return
  })


  return Promise.resolve(playbackUnits);
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