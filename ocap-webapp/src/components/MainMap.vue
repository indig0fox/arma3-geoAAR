<template>
  <div id="map-window">
    <div id="app-body">
      <div id="map" ref="maplibre"></div>
      <!-- <div id="style-button-container"> -->
      <LayerControls v-if="mapReady" :mainMap="mainMap" />

      <!-- </div> -->
    </div>
  </div>
</template>

<script setup>
import {
  Map,
  addProtocol,
  addControl,
  NavigationControl,
  ScaleControl,
} from "maplibre-gl";
import * as pmtiles from "pmtiles";
import * as turf from "@turf/turf";
import proj4 from "proj4";
import { forward } from "mgrs";
</script>

<script>
import { mapState, mapWritableState } from "pinia";
import { useRecordingDataStore } from "@/stores/dataStore.js";
import { usePlaybackDataStore } from "@/stores/playbackStore.js";
import LayerControls from "@/components/LayerControls.vue";

export default {
  name: "MainMap",
  components: {
    LayerControls,
  },
  data() {
    return {};
  },
  unmounted() {
    this.mapReady = false;
    this.mainMap.remove();
  },
  mounted() {
    let protocol = new pmtiles.Protocol();
    addProtocol("pmtiles", protocol.tile);
    const map = new Map({
      container: this.$refs.maplibre,
      style: `https://styles.ocap2.com/${this.activeWorld.worldName}.json`,
      attributionControl: false,
      zoom: 14,
    });

    map.addControl(new NavigationControl());

    map.addControl(
      new ScaleControl({
        unit: "imperial",
      }),
      "bottom-right"
    );
    map.addControl(
      new ScaleControl({
        unit: "metric",
      }),
      "bottom-right"
    );

    this.mainMap = map;

    // this.mainMap.on('render', () => {
    //   this.centerOnMap()
    //   this.hideLayers()
    // })

    this.mainMap.once("data", () => {
      // this.mainMap.once('styledata', () => {
      this.centerOnMap();

      this.currentZoom = this.mainMap.getZoom().toFixed(2);
      this.currentPitch = this.mainMap.getPitch().toFixed(2);
      this.currentBearing = this.mainMap.getBearing().toFixed(2);
      var center = this.mainMap.getCenter();
      this.currentCenter = [center.lng, center.lat];
      this.updateMapHash();

      this.maplibreVersion = this.mainMap.version;

      // console.log(this.mainMap.transform._fov)
      // this.mainMap.transform._fov = 1

      // this.activeWorld = this.mainMap.getStyle().metadata

      this.mainMap.on("move", (e) => {
        this.viewBounds = e.target.getBounds();
      });

      this.mainMap.on("move", this.updateCurrentCenter);
      this.mainMap.on("moveend", this.updateMapHash);
      this.mainMap.on("zoom", this.updateCurrentZoom);
      this.mainMap.on("mousemove", this.updatemousePositionXY);
      this.mainMap.on("pitch", this.updatePitchAndBearing);
      this.mainMap.on("rotate", this.updatePitchAndBearing);

      // this.mainMap.on('load', () => {
      this.mainMap.addSource("entities-3d", {
        type: "geojson",
        // 'data': recordingData.framePositions[0].positions
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      this.mainMap.addLayer({
        id: "entities-3d",
        type: "fill-extrusion",
        source: "entities-3d",
        layout: {
          visibility: "visible",
        },
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": 2.7,
          // 'fill-extrusion-height': 20,
          "fill-extrusion-opacity": 1,
        },
      });

      this.mainMap.addSource("selected-unit-path", {
        type: "geojson",
        // 'data': recordingData.framePositions[0].positions
        data: this.selectedUnitPathGeoJSON,
      });

      this.mainMap.addLayer({
        id: "selected-unit-path",
        type: "line",
        source: "selected-unit-path",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#F00",
          "line-width": 2,
        },
      });

      setTimeout(() => {
        this.mainMap.resize();
        this.mainMap.setPaintProperty("background", "background-color", "#c0c0c0");
        this.generateGrids();
      }, 1000);
    });
    // })

    this.mapReady = true;
  },
  computed: {
    worldOrigin4326() {
      const meta = this.activeWorld;
      var originLat = meta.latitude;
      var originLon = meta.longitude;
      return [originLon, originLat];
    },
    worldOrigin3857() {
      if (!this.worldOrigin4326) return;
      return proj4("EPSG:4326", "EPSG:3857", this.worldOrigin4326);
    },
    ...mapWritableState(useRecordingDataStore, ["mainMap"]),
    ...mapState(useRecordingDataStore, [
      "recordingData",
      "availableWorlds",
      "activeWorld",
      "mapHash",
    ]),
    ...mapWritableState(useRecordingDataStore, [
      "viewBounds",
      "currentCenter",
      "currentZoom",
      "currentPitch",
      "currentBearing",
      "mousePositionXY",
      "mousePositionMGRS",
      "maplibreVersion",
      "mapReady",
    ]),
    ...mapWritableState(usePlaybackDataStore, [
      "selectedUnitId",
      "selectedUnitPathGeoJSON",
      "playbackCurrentFrame",
    ]),
    ...mapState(usePlaybackDataStore, ["showSelectedUnitPath", "followSelectedUnit"]),
  },

  watch: {
    playbackCurrentFrame(newVal, oldVal) {
      // skip if newVal is not a number
      if (isNaN(newVal)) return;
      this.updateMapHash();

      if (this.mainMap.getSource("entities-3d")) {
        this.mainMap
          .getSource("entities-3d")
          .setData(usePlaybackDataStore().getPlaybackEntitiesGeoJSON());
      }

      if (this.selectedUnitId) {
        if (this.showSelectedUnitPath) {
          this.updateSelectedUnitPath();
        }
        if (this.followSelectedUnit) {
          this.moveCameraToSelectedUnit();
        }
      }
    },
    selectedUnitId(newVal, oldVal) {
      if (newVal) {
        this.updateSelectedUnitPath();
        this.moveCameraToSelectedUnit();
      }
    },
    showSelectedUnitPath(newVal, oldVal) {
      if (!this.mainMap.getLayer("selected-unit-path")) return;
      if (newVal) {
        this.mainMap.setLayoutProperty("selected-unit-path", "visibility", "visible");
      } else {
        this.mainMap.setLayoutProperty("selected-unit-path", "visibility", "none");
      }
    },
  },

  methods: {
    moveCameraToSelectedUnit() {
      if (!this.selectedUnitId) return;
      this.mainMap.flyTo({
        center: usePlaybackDataStore().getUnitById(this.selectedUnitId).position,
      });
    },

    updateSelectedUnitPath() {
      if (!this.mainMap.getSource("selected-unit-path")) return;
      // get the last 30 frames of the unit's history
      const history = usePlaybackDataStore().getUnitHistory(this.selectedUnitId, 30);
      this.selectedUnitPathGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: history.map((frame) => frame.position),
            },
          },
        ],
      };
      this.mainMap.getSource("selected-unit-path").setData(this.selectedUnitPathGeoJSON);
    },
    async centerOnMap() {
      // console.log(this.activeWorld)
      const bounds = this.activeWorld.bounds;
      var poly = turf.bboxPolygon(bounds);
      if (!this.mainMap.getSource("boundary")) {
        this.mainMap.addSource("boundary", {
          type: "geojson",
          data: poly,
        });
        this.mainMap.addLayer({
          id: "boundary",
          type: "line",
          source: "boundary",
          layout: {},
          paint: {
            "line-color": "#000",
            "line-width": 2,
          },
        });
      } else {
        this.mainMap.getSource("boundary").setData(poly);
      }

      const polyBounds = turf.bbox(poly);
      this.worldBounds = polyBounds;
      // console.log(polyBounds);

      let customQuery = false;

      let customHash = this.$route.hash?.replace("#", "").split("/");
      // if all values are 0, then it's not a custom query
      if (customHash.length >= 5) {
        if (customHash.slice(0, 5).every((x) => x == 0)) {
          customQuery = false;
        } else {
          customQuery = true;
          // console.log(customHash);
          // customHash = customHash
          // var hashParts = customHash.split("/");
          this.mainMap.setZoom(customHash[0]);
          this.mainMap.setCenter([customHash[1], customHash[2]]);
          this.mainMap.setBearing(customHash[3]);
          this.mainMap.setPitch(customHash[4]);
        }
      }

      if (customQuery) {
        return;
      }

      var newCameraTransform = this.mainMap.cameraForBounds(polyBounds, {
        padding: { top: 15, bottom: 15, left: 15, right: 15 },
      });
      // console.log(newCameraTransform)
      this.mainMap.jumpTo(newCameraTransform);
    },
    async updateMapHash() {
      this.$router.replace({
        query: this.$route.query,
        hash: this.mapHash,
      });
      // history.replaceState(null, null, this.mapHash);
    },
    async updateCurrentZoom(e) {
      var zoom = e.target.getZoom();
      this.currentZoom = zoom.toFixed(2);
    },
    async updateCurrentCenter(e) {
      var center = e.target.getCenter();
      this.currentCenter = [center.lng, center.lat];
    },
    async updatePitchAndBearing(e) {
      var pitch = e.target.getPitch();
      this.currentPitch = pitch.toFixed(2);
      var bearing = e.target.getBearing();
      this.currentBearing = bearing.toFixed(2);
    },

    async updatemousePositionXY(e) {
      if (
        this.mainMap.isMoving() ||
        this.mainMap.isZooming() ||
        this.mainMap.isRotating()
      ) {
        return;
      }
      var coord_4326 = e.lngLat;
      var coord_3857 = proj4("EPSG:4326", "EPSG:3857", [coord_4326.lng, coord_4326.lat]);

      var mercatorStr = [
        Math.abs(coord_3857[0]).toFixed(0).toString().padStart(5, "0"),
        Math.abs(coord_3857[1]).toFixed(0).toString().padStart(5, "0"),
      ];

      // * add negative sign if needed
      coord_3857[0] < 0
        ? (mercatorStr[0] = "-" + mercatorStr[0])
        : (mercatorStr[0] = mercatorStr[0]);
      coord_3857[1] < 0
        ? (mercatorStr[1] = "-" + mercatorStr[1])
        : (mercatorStr[1] = mercatorStr[1]);

      this.mousePositionXY = mercatorStr[0] + " " + mercatorStr[1];

      // * calculate 8 digit MGRS grid from XY

      // * add origin pos of world from metadata to mercator
      // this is so Grid coords reflect 'real' position in world

      if (!this.worldOrigin3857) return;

      // console.log(originLat, originLon)
      var originPlus3857 = [
        coord_3857[0] + this.worldOrigin3857[0],
        coord_3857[1] + this.worldOrigin3857[1],
      ];

      // console.log(origin3857, originPlus3857)

      var originPlus4326 = proj4(proj4.defs("EPSG:3857"), proj4.defs("EPSG:4326"), [
        originPlus3857[0],
        originPlus3857[1],
      ]);

      // console.log(mercator, [originLat, originLon], originPlus3857, originPlus4326)

      // run through library
      var mgrsStr = this.latlonToMGRS(originPlus4326[0], originPlus4326[1], 4);

      this.mousePositionMGRS = mgrsStr;
    },
    latlonToMGRS(lon, lat, precision) {
      var mgrs = forward([lon, lat], precision);

      // for zone, take first 3 digits of the MGRS string
      var mgrsZone = mgrs.slice(0, 3);

      var mgrsGridZone = mgrs.slice(3, 5);

      // for numbers, take the last 8 digits of the MGRS string
      var mgrsGrid = mgrs.slice(-8);
      // split with space
      mgrsGrid = mgrsGrid.slice(0, 4) + " " + mgrsGrid.slice(4, 8);

      return mgrsZone + " " + mgrsGridZone + " " + mgrsGrid;
      return mgrs;
    },

    generateGrids: function () {
      // const gridOffsetX = this.map.getStyle().metadata.gridOffsetX;
      // const gridOffsetY = this.map.getStyle().metadata.gridOffsetY;
      const worldSize = this.mainMap.getStyle().metadata.worldSize;

      this.mainMap.getStyle().metadata.grids.forEach((grid) => {
        // create a new multi-line string feature for each grid
        const coords3857 = [];
        const labels3857 = [];
        // const linestrings3857 = [];

        // add each line string to the feature
        for (let x = 0; x <= worldSize; x += grid["stepX"]) {
          coords3857.push([
            [x, 0],
            [x, worldSize],
          ]);
          // todo: add a point at y=gridOffsetY indicating X value
          // label is length of formatX value
          var xlength = grid["formatX"].length;
          var xlabel = x / grid["stepX"];
          xlabel = xlabel.toString().slice(0, xlength);
          if (xlabel.length < xlength) {
            xlabel = "0" + xlabel;
          }

          labels3857.push(turf.point([x, worldSize], { label: xlabel }));
          labels3857.push(turf.point([x, 0], { label: xlabel }));
          // linestrings3857.push(turf.lineString([[x, gridOffsetX], [x, gridOffsetY]], { label: label }))
        }
        for (let y = 0; y <= worldSize; y += Math.abs(grid["stepY"])) {
          coords3857.push([
            [0, y],
            [worldSize, y],
          ]);
          // todo: add a point at x=gridOffsetX indicating Y value
          // label is length of formatY value
          var ylength = grid["formatY"].length;
          var ylabel = y / Math.abs(grid["stepY"]);
          ylabel = ylabel.toString().slice(0, ylength);
          if (ylabel.length < ylength) {
            ylabel = "0" + ylabel;
          }
          labels3857.push(turf.point([0, y], { label: ylabel }));
          labels3857.push(turf.point([worldSize, y], { label: ylabel }));
          // linestrings3857.push(turf.lineString([[gridOffsetX, y], [gridOffsetY, y]], { label: label }))
        }

        const coords4326 = coords3857.map((coord) => {
          return coord.map((c) => {
            return proj4(proj4.defs("EPSG:3857"), proj4.defs("EPSG:4326"), [c[0], c[1]]);
          });
        });
        const labels4326 = labels3857.map((label) => {
          return turf.point(
            proj4(proj4.defs("EPSG:3857"), proj4.defs("EPSG:4326"), [
              label.geometry.coordinates[0],
              label.geometry.coordinates[1],
            ]),
            label.properties
          );
        });
        // const linestrings4326 = linestrings3857.map(linestring => {
        //   return turf.lineString(linestring.geometry.coordinates.map(coord => {
        //     return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [coord[0], coord[1]])
        //   }), linestring.properties)
        // })

        // create a new geojson object
        let featureCollection = turf.featureCollection([]);

        // create the features
        const multiLineString = turf.multiLineString(coords4326);
        featureCollection.features.push(multiLineString);

        // add the labels
        labels4326.forEach((label) => {
          featureCollection.features.push(label);
        });

        // // add the linestrings
        // linestrings4326.forEach(linestring => {
        //   featureCollection.features.push(linestring)
        // })

        // add the feature to the source
        // add new geojson source to contain grid linestrings
        this.mainMap.addSource(`grid-${grid["stepX"]}`, {
          type: "geojson",
          data: featureCollection,
        });

        // get length of step
        var minZoom;
        var maxZoom = 22;
        var width = 1;
        if (grid["stepX"] == 100) {
          minZoom = 15;
          // maxZoom = 20
          width = 0.5;
        }
        if (grid["stepX"] == 1000) {
          minZoom = 12;
          // maxZoom = 16
          width = 1.5;
        }
        if (grid["stepX"] == 10000) {
          minZoom = 8;
          // maxZoom = 12
          width = 2.5;
        }

        // add a new lines layer for each grid
        this.mainMap.addLayer({
          id: `grid-${grid["stepX"]}`,
          type: "line",
          source: `grid-${grid["stepX"]}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          layout: {
            visibility: "none",
          },
          paint: {
            "line-color": "#000",
            "line-width": width,
          },
        });

        // add labels layer
        this.mainMap.addLayer({
          id: `grid-${grid["stepX"]}-labels`,
          type: "symbol",
          source: `grid-${grid["stepX"]}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          layout: {
            visibility: "none",
            "text-field": ["get", "label"],
            "text-size": 14,
            // 'text-allow-overlap': true,
            // 'text-ignore-placement': true,
            "text-font": ["Roboto Bold", "Arial Unicode MS Regular"],
            // 'symbol-placement': 'line',
            "text-pitch-alignment": "viewport",
            "text-rotation-alignment": "map",
            "text-anchor": "center",
            // 'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            // 'text-radial-offset': 0.5,
            // 'text-justify': 'auto',
            "text-keep-upright": true,
          },
          paint: {
            "text-color": "#fff",
            "text-halo-color": "#000",
            "text-halo-width": 1,
          },
        });
      });
    },
  },
};
</script>

<style scoped>
@import "maplibre-gl/dist/maplibre-gl.css";

#map-window {
  width: auto;
  height: 100%;
  position: relative;
}

#app-body {
  width: auto;
  height: 100%;
  position: relative;
}

#map {
  width: auto;
  height: 100%;
  position: relative;
  border: 1px solid #000000;
}
</style>
