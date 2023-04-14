class Unit {
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
    const width = 20;
    const height = 20;
    el.className = 'unit-marker';
    el.style.backgroundImage = `url(${hostedPrefix}/markers/${this.type}/${this.stateColor}.png)`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.backgroundSize = '100%';
  }

  getPosAtFrame (frameNum) {

    var thisUnit = recordingData.entities.find(entity => entity.id == this.id);
    const hasFrame = thisUnit.positions.length - 1 >= (frameNum - this.startFrameNum) &&
      (this.startFrameNum <= frameNum)
    let thisUnitFrame
    if (hasFrame) {
      thisUnitFrame = thisUnit.positions[frameNum - this.startFrameNum];
      this.hasFrame = true;
    } else {
      if (this.startFrameNum <= frameNum) {
        thisUnitFrame = thisUnit.positions.slice(-1);
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

  updateAtFrame (frameNum, now) {
    // if (frameNum < this.startFrameNum) {
    //   this.remove()
    //   return
    // };

    this.getPosAtFrame(frameNum);
    this.setColor(this.lifestate, now);
    if (this.hasFrame) {
      this.updateMarker(now)
    }
  };

  setColor (lifestate, now) {
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
    if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
      this.colorHex = entityColors[entityColor.toUpperCase()];
    };
  };

  addMarker () {
    if (this.marker) return
    this.marker = new maplibregl.Marker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .setPopup(
        new maplibregl.Popup({
          anchor: "bottom",
          className: "entity-popup",
          closeButton: false,
          closeOnClick: false
        })
          .setHTML(`<p>${this.name} (${this.role})</p>`)
      )
      .addTo(map)
      .togglePopup();
  };


  updateMarker (now) {
    this.addMarker();
    this.showMarker();


    this.marker
      .setLngLat(this.position)
      .setRotation(this.bearing - map.getBearing());

    var markerElement = this.marker.getElement();
    var popup = this.marker.getPopup();


    if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
      var bgImage = `url(${hostedPrefix}/markers/${this.type}/${this.stateColor}.png)`;
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
    };





    if (window.showUnitMarkers) {
      if (this.inVehicle) {
        this.hideMarker();
      } else {
        this.showMarker();
      };
    } else {
      this.hideMarker();
    };

    if (window.showUnitNames) {
      if (this.isPlayer) {
        if (this.inVehicle) {
          this.hidePopup();
        } else {
          this.showPopup();
        };
      } else {
        this.hidePopup();
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