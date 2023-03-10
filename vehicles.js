class Vehicle {
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
    var width = 35;
    var height = 35;
    if (this.type == "unknown") {
      width = 20;
      height = 20;
    };
    el.className = 'vehicle-marker';
    el.style.backgroundImage = `url(${hostedPrefix}/markers/${this.type}/${this.stateColor}.png)`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.style.backgroundSize = '100%';
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
        var unit = getUnitById(crewMember);
        if (unit instanceof Unit) {
          return unit
        };
      });
      return
    };

    if (!this.hasCondensedPositions) {
      var thisUnitFrame = thisUnit.positions[frameNum - this.startFrameNum];
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
        var unit = getUnitById(crewMember);
        if (unit instanceof Unit) {
          return unit
        };
      });
    };
  };

  updateAtFrame (frameNum, now) {
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
        this.crewTag += `  ${i + 1}: ${this.crew[i].name}<br/>`;
      };
    } else {
      this.crewTag = "";
    }

    this.setColor(this.lifestate, now);
    this.updateMarker(now);
  };

  setColor (lifestate, now) {
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
    if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
      this.colorHex = entityColors[entityColor.toUpperCase()];
    };
  };


  addMarker () {
    this.marker = new maplibregl.Marker(this.markerElement, {
      color: this.colorHex,
      rotationAlignment: "viewport",
    })
      .setLngLat(this.position)
      .addTo(map);
    this.marker.setPopup(new maplibregl.Popup({
      anchor: "bottom",
      className: "entity-popup",
      closeButton: false,
      closeOnClick: false
    }).setHTML(`<p>${this.name}<p>`)).togglePopup();
  };

  updateMarker (now) {
    if (!this.position) return;
    if (this.marker == undefined) {
      this.addMarker();
    };

    this.marker
      .setLngLat(this.position)
      .setRotation(this.bearing - map.getBearing());

    var markerElement = this.marker.getElement();
    var popup = this.marker.getPopup();

    this.marker.getPopup().setHTML(`<p>${this.name} ${this.crewTag}</p>`);
    this.setColor(this.lifestate, now);

    if (!window.lastFrame || now - window.lastFrame >= window.heavyProcessDelay * 1000) {
      var bgImage = `url(${hostedPrefix}/markers/${this.type}/${this.stateColor}.png)`;
      if (markerElement.style.backgroundImage != bgImage) {
        // console.log(markerElement.style.backgroundImage)
        markerElement.style.backgroundImage = bgImage;
      };
      if (!window.showUnitMarkers && markerElement.style.visibility == "visible") {
        this.hideMarker()
      };
      if (window.showUnitMarkers && markerElement.style.visibility == "hidden") {
        this.showMarker()
      };

      if (window.showUnitNames) {

        this.showPopup();

      } else {
        this.hidePopup();
      };
    };
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