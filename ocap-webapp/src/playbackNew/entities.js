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
    this.position = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [positions[0][0][0], positions[0][0][1]]);
    this.framesFired = framesFired;
    this.startFrameNum = startFrameNum;
    this.hasFrame = false;

    this.lifestate = 1;

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

  getUnitById (unitId) {
    if (unitId in usePlaybackDataStore().playbackEntities) {
      return usePlaybackDataStore().playbackEntities[unitId]
    } else {
      return -1
    }
  }

  getPosAtFrame (frameNum) {

    const hasFrame = this.positions.length - 1 >= (frameNum - this.startFrameNum) &&
      (this.startFrameNum <= frameNum)
    let thisUnitFrame
    if (hasFrame) {
      thisUnitFrame = this.positions[frameNum - this.startFrameNum];
      this.hasFrame = true;
    } else {
      if (this.startFrameNum <= frameNum) {
        thisUnitFrame = this.positions.slice(-1);
        this.hasFrame = false;
      } else {
        this.hasFrame = false;
        return
      }
    }

    var position = thisUnitFrame[0];
    // get first two indexes
    if (position.length > 3) {
      this.position = XY_to_LatLon(position[0].slice(0, 2));
    } else {
      this.position = XY_to_LatLon(position.slice(0, 2));
    }

    this.bearing = thisUnitFrame[1];
    this.lifestate = this.hasFrame ? thisUnitFrame[2] : 0;
    this.inVehicle = thisUnitFrame[3] == 1 ? true : false;
    // this.name = thisUnitFrame[4];
    this.isPlayer = thisUnitFrame[5];
    this.role = thisUnitFrame[6];
  };

  updateAtFrame (frameNum) {
    // if (frameNum < this.startFrameNum) {
    //   this.remove()
    //   return
    // };

    this.getPosAtFrame(frameNum);

    this.setColor(this.lifestate);
    if (this.hasFrame) {
      this.updateMarker(frameNum)
    }
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
    this.marker = new MaplibreMarker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .setPopup(
        new MaplibrePopup({
          anchor: "bottom",
          className: "entity-popup",
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
    this.positions = positions;
    this.position = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [positions[0][0][0], positions[0][0][1]]);
    this.framesFired = framesFired;
    this.startFrameNum = startFrameNum;

    this.hasCondensedPositions = hasCondensedPositions;

    this.lifestate = 1;
    this.crew = [];
    this.crewTag = "";

    this.side = "UNKNOWN";
    this.stateColor = "unknown";

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

  getUnitById (unitId) {
    if (unitId in usePlaybackDataStore().playbackEntities) {
      return usePlaybackDataStore().playbackEntities[unitId]
    } else {
      return -1
    }
  }

  getPosAtFrame (frameNum) {
    var thisUnitFrame = null;

    if (this.hasCondensedPositions) {
      thisUnitFrame = this.positions.find(positionFrame => {
        if (
          positionFrame[4][0] <= frameNum &&
          positionFrame[4][1] >= frameNum
        ) {
          return true;
        }
      });

      if (!thisUnitFrame) {
        if (this.startFrameNum <= frameNum) {
          this.showMarker()
          this.lifestate = 0;
        } else {
          this.remove()
        }
        return
      };

      var position = thisUnitFrame[0];
      this.position = XY_to_LatLon(position);

      this.bearing = thisUnitFrame[1];
      this.lifestate = thisUnitFrame[2];
      this.crew = thisUnitFrame[3].map((crewMember) => {
        var unit = this.getUnitById(crewMember);
        if (unit instanceof Unit) {
          return unit
        };
      });
      return
    };

    if (!this.hasCondensedPositions) {
      var thisUnitFrame = this.positions[frameNum - this.startFrameNum];
      if (!thisUnitFrame) {
        if (this.startFrameNum <= frameNum) {
          this.showMarker()
          this.lifestate = 0;
        } else {
          this.remove()
        }
        return
      };

      var position = thisUnitFrame[0];
      // if (position.length > 2) {
      //   this.position = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [position[0], position[1] - worldsize, position[2]]);
      // } else {
      this.position = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [position[0], position[1]]);
      // };

      this.bearing = thisUnitFrame[1];
      this.lifestate = thisUnitFrame[2];
      this.crew = thisUnitFrame[3].map((crewMember) => {
        var unit = this.getUnitById(crewMember);
        if (unit instanceof Unit) {
          return unit
        };
      });
    };
  };

  updateAtFrame (frameNum) {
    if (frameNum < this.startFrameNum) {
      this.remove()
      return
    };

    this.getPosAtFrame(frameNum);

    if (this.marker == undefined) {
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
    var entityColor = this.side.toLowerCase();
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
    this.marker = new MaplibreMarker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .addTo(useRecordingDataStore().mainMap);
    this.marker.setPopup(new MaplibrePopup({
      anchor: "bottom",
      className: "entity-popup",
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

    this.marker.getPopup().setHTML(`<p>${this.name} ${this.crewTag}</p>`);
    this.setColor(this.lifestate);

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