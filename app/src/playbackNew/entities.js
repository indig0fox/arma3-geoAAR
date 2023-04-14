import { entityColors } from '@/arma3data/definitions.js'
import { XY_to_LatLon } from '@/playbackNew/utils.js';
import proj4 from 'proj4'
import { Marker as MaplibreMarker, Popup as MaplibrePopup } from 'maplibre-gl';
import { useRecordingDataStore } from '@/stores/dataStore';
import { usePlaybackDataStore } from '@/stores/playbackStore.js';


export class Unit {
  constructor(id, name, side, type, role, positions, framesFired, startFrameNum) {
    this.id = id;
    this.name = name;
    this.side = side;
    this.type = type;
    // make side lowercase
    this.stateColor = this.side.toLowerCase();
    this.colorHex = entityColors[this.side];
    this.role = role;

    this.positions = positions;

    this.startFrameNum = startFrameNum;

    // functionalized
    // this.precachePositions(positions);

    this.framesFired = framesFired;
    this.hasFrame = false;

    this.lifestate = 1;
  }

  async precachePositions () {

    if (!this.positions) { throw new Error('No positions on entity', this) }
    // * cache positions into a map
    // cache positions array into a map for faster lookup
    // offset the frame number by the startFrameNum
    // web workers considered but conversion to transferable objects is not trivial

    // console.log('Saving', positions.length, ' positions for entity ' + id + '...');

    // console.log(positions)


    const positionsMap = new Map()
    for (let i = 0; i < this.positions.length; i++) {
      const translated_pos = XY_to_LatLon(
        this.positions[i][0]
      );
      const newPosFrame = this.positions[i];
      newPosFrame[0] = translated_pos;
      positionsMap.set(i + this.startFrameNum, newPosFrame);
    }
    this.positions = positionsMap;
    this.positionsReady = true;

    return Promise.resolve()
  }

  getPosAtFrame (frameNum) {

    // console.log(this.positions)

    // ! moved from Array to Map, comments deprecated with precache step
    // console.log(this.id, frameNum, this.positions.get(frameNum))
    const thisFrame = this.positions.get(frameNum);
    this.position = thisFrame.position;
    this.bearing = thisFrame.direction;
    this.lifestate = thisFrame.alive;
    this.inVehicle = thisFrame.isInVehicle;
    this.name = thisFrame.name;
    this.isPlayer = thisFrame.isPlayer;
    this.role = thisFrame.role;
  };

  updateAtFrame (frameNum) {
    // if (frameNum < this.startFrameNum) {
    //   this.remove()
    //   return
    // };

    this.getPosAtFrame(frameNum);

    this.setColor(this.lifestate);

    this.updateMarker(frameNum)

  };

  setColor (lifestate) {
    if (!this.marker) return;
    var entityColor = this.side.toLowerCase();
    switch (lifestate) {
      case 0:
        entityColor = "dead"
        break;
      case 2:
        entityColor = "incapacitated"
        break;
    };
    this.stateColor = entityColor;
    // if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
    this.colorHex = entityColors[entityColor.toUpperCase()];
    // };
  };

  addMarker () {
    if (this.marker) return

    if (!this.markerElement) {
      // Create a DOM element for each marker.
      const el = document.createElement('div');
      this.markerElement = el;
      const width = 14;
      const height = 14;
      el.className = 'unit-marker';
      el.style.backgroundImage = `url(entityMarkers/${this.type}/${this.stateColor}.png)`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.backgroundSize = '100%';
    }

    this.marker = new MaplibreMarker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .setPopup(
        new MaplibrePopup({
          anchor: "bottom",
          className: "unit-popup",
          closeButton: false,
          closeOnClick: false
        })
          .setHTML(`<p>${this.name} (${this.role})</p>`)
      )
      .addTo(useRecordingDataStore().mainMap)
      .togglePopup();

    // remove onclick event
    this.markerElement.onclick = null;
  };

  updateMarkerPos () {
    this.marker
      .setLngLat(this.position)
      .setRotation(this.bearing - useRecordingDataStore().currentBearing);
  };

  updateMarker () {
    this.addMarker();
    this.showMarker();

    this.updateMarkerPos();

    var markerElement = this.marker.getElement();
    var popup = this.marker.getPopup();


    // if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
    var bgImage = `url(entityMarkers/${this.type}/${this.stateColor}.png)`;
    if (markerElement.style.backgroundImage != bgImage) {
      // console.log(markerElement.style.backgroundImage)
      markerElement.style.backgroundImage = bgImage;
    };
    popup.setHTML(`<p>${this.name} (${this.role})</p>`);


    // if (this.lifestate == 0) {
    //   if (markerElement.style.opacity != 0.5) {
    //     markerElement.style.opacity = 0.5;
    //   }
    // } else {
    //   if (markerElement.style.opacity != 1) {
    //     markerElement.style.opacity = 1;
    //   }
    // };
    // };


    if (usePlaybackDataStore().showUnitMarkers) {
      if (this.inVehicle) {
        this.hideMarker();
      } else {
        this.showMarker();
      };
    } else {
      this.hideMarker();
    };

    if (usePlaybackDataStore().showUnitLabels) {
      if (this.isPlayer) {
        if (this.inVehicle) {
          this.hidePopup();
        } else {
          this.showPopup();
        };
      } else {
        if (usePlaybackDataStore().showAILabels) {
          if (this.inVehicle) {
            this.hidePopup();
          } else {
            this.showPopup();
          };
        } else {
          this.hidePopup();
        }
      }
    } else {
      this.hidePopup();
    };


  };

  hideMarker () {
    this.markerElement.style.visibility = "hidden";
    try {
      if (this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  showMarker () {
    if (this.marker == undefined) {
      this.addMarker();
    };
    this.markerElement.style.visibility = "visible";
  };

  hidePopup () {
    try {
      if (this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  showPopup () {
    try {
      if (!this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  firedOnFrame (frameNum) {
    var fireData = this.framesFired.filter(row => {
      if (row[0] == frameNum) return true;
    });
    if (fireData.length == 0) return [];
    var fireDataOut = [];
    fireData.forEach(row => {
      var coords = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [row[1][0], row[1][1]]);
      fireDataOut.push([this.position, coords, this.colorHex])
    });
    return fireDataOut;
  };

  remove () {
    if (this.marker == undefined) return;
    this.marker.remove();
    this.marker = undefined
  };
};












export class Vehicle {
  constructor(id, name, vehicleClass, type, positions, framesFired, startFrameNum, hasCondensedPositions) {
    this.id = id;
    this.name = name;
    this.vehicleClass = vehicleClass;
    this.type = type;

    this.startFrameNum = startFrameNum;
    this.hasCondensedPositions = hasCondensedPositions;

    this.positions = positions;

    // console.log('positions', positions)
    if (positions.size > 0) {
      this.position = positions.get(0).position;
      this.bearing = positions.get(0).bearing;
    }


    // functionalized
    // this.precachePositions(positions);

    this.framesFired = framesFired;

    this.lifestate = 1;
    this.crew = [];
    this.crewTag = "";

    this.side = "UNKNOWN";
    this.stateColor = "unknown";

  }

  async precachePositions () {

    if (!this.positions) { throw new Error('No positions on entity', this) }

    // * cache positions into a map
    // cache positions array into a map for faster lookup
    // offset the frame number by the startFrameNum
    // web workers considered but conversion to transferable objects is not trivial

    const positionsMap = new Map()

    if (this.hasCondensedPositions) {
      for (let i = 0; i < useRecordingDataStore().activeRecordingData.endFrame; i++) {
        // console.log('entity', this.id, 'frame', i)

        var thisUnitFrame = this.positions.find(positionFrame => {
          if (
            positionFrame[4][0] <= i + this.startFrameNum &&
            positionFrame[4][1] >= i + this.startFrameNum
          ) {
            return true;
          }
        });
        if (thisUnitFrame == undefined) {
          console.log('no frame found for', i)
          continue;
        }
        const translated_pos = XY_to_LatLon(
          thisUnitFrame[0]
        );
        const newPosFrame = thisUnitFrame;
        newPosFrame[0] = translated_pos;
        positionsMap.set(i, newPosFrame);
      }
    } else {
      for (let i = 0; i < this.positions.length; i++) {
        const translated_pos = XY_to_LatLon(
          this.positions[i][0]
        );
        // if (positions[0][0][2] !== undefined) {
        //   translated_pos[2] = positions[0][0][2];
        // }
        const newPosFrame = this.positions[i];
        newPosFrame[0] = translated_pos;
        positionsMap.set(i + this.startFrameNum, newPosFrame);
      }
    }
    this.positions = positionsMap;
    this.positionsReady = true;



    return Promise.resolve()
  }

  getPosAtFrame (frameNum) {

    // if (this.hasCondensedPositions) {
    // ! moved from Array to Map, comments deprecated with precache step

    var hasFrame = (this.positions.get(frameNum)).hasOwnProperty('position');
    if (!hasFrame) {
      return
    }
    var thisFrame = this.positions.get(frameNum);

    this.position = thisFrame.position;
    this.bearing = thisFrame.direction;
    this.lifestate = thisFrame.alive;
    this.crew = thisFrame.crew.map((crewMember) => {
      var unit = usePlaybackDataStore().getUnitById(crewMember);
      if (unit instanceof Unit) {
        return unit
      } else {
        return null
      }
    }).filter((unit) => {
      if (unit !== null) {
        return true
      }
    });
    return
    // };

    // if (!this.hasCondensedPositions) {
    // ! moved from Array to Map, comments deprecated with precache step

    thisUnitFrame = this.positions.get(frameNum);

    this.position = thisFrame.position;
    this.bearing = thisFrame.direction;
    this.lifestate = thisFrame.alive;
    this.crew = thisFrame.crew.map((crewMember) => {
      var unit = this.getUnitById(crewMember);
      if (unit instanceof Unit) {
        return unit
      };
    });
    // };
  };

  updateAtFrame (frameNum) {
    // if (frameNum < this.startFrameNum) {
    //   this.remove()
    //   return
    // };

    this.getPosAtFrame(frameNum);

    if (!this.marker) {
      this.addMarker();
    };

    if (this.crew.length > 0) {
      this.crewTag = `(${this.crew.length}):<br/>`;
      // iterate through crew members and add number to name
      for (var i = 0; i < this.crew.length; i++) {
        var crewMember = this.crew[i];
        if (crewMember == undefined) continue;
        if (crewMember.name == undefined) continue;
        this.crewTag += `  ${i + 1}: ${this.crew[i].name}<br/>`;
      };
    } else {
      this.crewTag = "";
    }

    this.setColor(this.lifestate);
    this.updateMarker();
  };

  setColor (lifestate) {
    // if (this.type != "apc") { this.type = "apc" };
    var entityColor
    if (this.crew.length > 0) {
      entityColor = this.crew[0].side.toLowerCase();
    } else {
      entityColor = "unknown";
    };

    switch (lifestate) {
      case 0:
        entityColor = "dead"
        break;
      case 2:
        entityColor = "incapacitated"
        break;
    };

    this.stateColor = entityColor;
    // if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
    this.colorHex = entityColors[entityColor.toUpperCase()];
    // };
  };


  addMarker () {
    if (!this.position) return;
    if (!this.markerElement) {
      // Create a DOM element for each marker.
      const el = document.createElement('div');
      this.markerElement = el;
      var width = 25;
      var height = 25;
      if (this.type == "unknown") {
        width = 10;
        height = 10;
      };
      el.className = 'vehicle-marker';
      el.style.backgroundImage = `url(entityMarkers/${this.type}/${this.stateColor}.png)`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.backgroundSize = '100%';
    }

    this.marker = new MaplibreMarker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .addTo(useRecordingDataStore().mainMap);
    this.marker.setPopup(new MaplibrePopup({
      anchor: "bottom",
      className: "vehicle-popup",
      closeButton: false,
      closeOnClick: false
    }).setHTML(`<p>${this.name}<p>`)).togglePopup();
  };

  updateMarker () {
    if (!this.position) return;
    if (this.marker == undefined) {
      this.addMarker();
    };

    this.marker
      .setLngLat(this.position)
      .setRotation(this.bearing - useRecordingDataStore().currentBearing);

    var markerElement = this.marker.getElement();
    var popup = this.marker.getPopup();

    if (['parachute', 'heli', 'plane'].includes(this.type)) {
      popup.setHTML(`<p>${this.name}<br/>(${Math.floor(this.position[2])}m ASL)${this.crewTag}</p>`);
    } else {
      popup.setHTML(`<p>${this.name} ${this.crewTag}</p>`);
    };

    // if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
    var bgImage = `url(entityMarkers/${this.type}/${this.stateColor}.png)`;
    if (markerElement.style.backgroundImage != bgImage) {
      // console.log(markerElement.style.backgroundImage)
      markerElement.style.backgroundImage = bgImage;
    };
    if (!usePlaybackDataStore().showVehicleMarkers && markerElement.style.visibility == "visible") {
      this.hideMarker()
    };
    if (usePlaybackDataStore().showVehicleMarkers && markerElement.style.visibility == "hidden") {
      this.showMarker()
    };

    if (usePlaybackDataStore().showVehicleLabels) {
      this.showPopup();

    } else {
      this.hidePopup();
    };
    // };
  };

  firedOnFrame (frameNum) {
    var fireData = this.framesFired.filter(row => {
      if (row[0] == frameNum) return true;
    });
    if (fireData.length == 0) return [];
    var fireDataOut = [];
    fireData.forEach(row => {
      var coords = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [row[1][0], row[1][1]]);
      fireDataOut.push([this.position, coords, this.colorHex])
    });
    return fireDataOut;
  };

  hideMarker () {
    this.markerElement.style.visibility = "hidden";
    try {
      if (this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  showMarker () {
    if (this.marker == undefined) {
      this.addMarker();
    };
    this.markerElement.style.visibility = "visible";
  };

  hidePopup () {
    try {
      if (this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  showPopup () {
    try {
      if (!this.marker.getPopup().isOpen()) {
        this.marker.togglePopup();
      };
    } catch { }
  };

  remove () {
    if (this.marker == undefined) return;
    this.marker.remove();
  };
};