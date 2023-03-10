// var hostedPrefix = "http://localhost:8080";
// var hostedPrefix = "http://74.91.121.221:8080";

// var hostedPrefix = "http://localhost"
// var hostedPrefix = "http://74.91.121.221"
var hostedPrefix = 'https://a3tiles.indigofox.dev'
// var imageResourcesPort = ":3000";

// var tileServerPort = ":3001";
// var tileServerPort = ":80";

var missionUrlPrefix = "https://indigofox.dev/replays/";

var mapbounds = []
var mapStyle = 'hybrid'
var worldName = 'fapovo'

window.recordingUrls = [
  '2022_12_09__21_12_FNF_09DEC22_sporc_v1.json',
  '2022_10_29__17_47_242CO12-FourFingerFistV110.json',
  '2022_11_18__22_34_FNFVN_Mallen_CuuLongII_Destroy_V3_Early.json',
  '2022_12_28__22_08_ArabianNights.json',
  '2023_01_21__19_49_OPERATIONGARGOYLEv2.json.gz'
];


// populate list of buttons in 'recording-files' div
var recordingFiles = document.getElementById('recording-files');
for (var i = 0; i < recordingUrls.length; i++) {
  var button = document.createElement('button');
  button.innerHTML = recordingUrls[i];
  button.setAttribute('target-url', missionUrlPrefix + recordingUrls[i]);
  button.addEventListener('click', async (e) => {
    var target = e.target.getAttribute('target-url');
    loadRecording(target);
  });
  recordingFiles.appendChild(button);
};

// maplibregl.accessToken = process.env.MAPBOX_TOKEN;
const map = new maplibregl.Map({
  // const map = new maplibregl.Map({
  container: 'map',
  projection: 'globe',
  pitch: 40,
  bearing: 320,
  zoom: 11,
  minZoom: 11,
  // style: hostedPrefix + tileServerPort + `/styles/${worldName}-${mapStyle}/style.json`,
  // style: hostedPrefix + `/styles/${worldName}-${mapStyle}/style.json`,
  style: hostedPrefix + `/styles/${worldName}/style.json`,
  renderWorldCopies: false,
  maxPitch: 50,
  antialias: false,
  hash: true
})


var scale = new maplibregl.ScaleControl({
  maxWidth: 200,
  unit: 'metric'
});
map.addControl(scale);

const nav = new maplibregl.NavigationControl({
  showCompass: true,
  showZoom: true
});
map.addControl(nav, 'top-right');


map.on('styleimagemissing', (e) => {
  const id = e.id; // id of the missing image

  // use regex to pattern check the id and determine url
  if (id.match(/([A-z]+_)+([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)) {

    const type = id.split('_').slice(0, -1).join('_');
    const color = id.split('_').slice(-1)[0]; // color of the marker (last part of the id
    // const url = imageResourcesPrefix + `/markers/${id}.png`; // url of the image
    const url = hostedPrefix + `/markers/${type}/${color}`; // url of the image

    if (map.hasImage(id) === true) return;
    var image = new Image();
    image.src = url;
    image.crossOrigin = "Anonymous";
    image.onload = function (ev) {
      if (map.hasImage(id) === false) {
        if (type.includes(".paa")) {
          map.addImage(id, image);
          return
        } else {
          map.addImage(id, image);
          return
        };
      };
    };
    image.onerror = function (ev) {
      var backupImage = new Image();
      // backupImage.src = hostedPrefix + imageResourcesPort + `/markers/mil_unknown/000`;
      backupImage.src = hostedPrefix + `/markers/mil_unknown/000`;
      backupImage.crossOrigin = "Anonymous";
      backupImage.onload = function (ev) {
        if (map.hasImage(id) === false) {
          console.log(`Error loading image, using placeholder for ${id}`);
          return map.addImage(id, backupImage);
        };
      };
      backupImage.onerror = function (ev) {

      };
    };
  };
});


window.UnitSides = {
  "WEST": Symbol("BLUFOR"),
  "EAST": Symbol("OPFOR"),
  "GUER": Symbol("INDFOR"),
  "CIV": Symbol("CIV")
};

window.UnitSidesInt = {
  "-1": "GLOBAL",
  "0": "EAST",
  "1": "WEST",
  "2": "GUER",
  "3": "CIV"
};

window.SideDivs = {
  'WEST': {
    'sideName': 'Blufor',
    'div': 'blufor-status-text',
    'mapmark_div': 'show-blufor-mapmark'
  },
  'EAST': {
    'sideName': 'Opfor',
    'div': 'opfor-status-text',
    'mapmark_div': 'show-opfor-mapmark'
  },
  'GUER': {
    'sideName': 'Indfor',
    'div': 'indfor-status-text',
    'mapmark_div': 'show-indfor-mapmark'
  },
  'CIV': {
    'sideName': 'Civilian',
    'div': 'civilian-status-text',
    'mapmark_div': 'show-civilian-mapmark'
  },
  'GLOBAL': {
    'sideName': 'Global',
    'div': 'global-status-text',
    'mapmark_div': 'show-global-mapmark'
  }
};

window.UnitTypes = {
  "unit": Symbol("man"),
  "vehicle": Symbol("vehicle")
};


// document.getElementById('mapstyle-satellite').addEventListener('click', (e) => {
//   changeMapStyle('satellite')
// })
document.getElementById('mapstyle-raster').addEventListener('click', (e) => {
  changeMapStyle('raster')
})
document.getElementById('mapstyle-topo').addEventListener('click', (e) => {
  changeMapStyle('topo')
})
document.getElementById('mapstyle-hybrid').addEventListener('click', (e) => {
  changeMapStyle('hybrid')
})
document.getElementById('mapstyle-dark').addEventListener('click', (e) => {
  changeMapStyle('dark')
})

document.getElementById(`mapstyle-${mapStyle}`).className = 'selected'

function changeMapStyle (style) {
  document.getElementById(`mapstyle-${mapStyle}`).className = ''
  document.getElementById(`mapstyle-${style}`).className = 'selected'
  mapStyle = style
  // map.setStyle(hostedPrefix + tileServerPort + `/styles/${worldName}-${mapStyle}/style.json`);
  // map.setStyle(hostedPrefix + `/styles/${worldName}-${mapStyle}/style.json`);
  map.setStyle(hostedPrefix + `/styles/${worldName}/style.json`);
  map.triggerRepaint();

  setTimeout(() => {
    map.setTerrain({ 'source': `heightmap` });
  }, 1500);
  setLayerLegend();
};

document.getElementById('url-button').addEventListener('click', (e) => {
  var url = document.getElementById('url-input').value;
  if (url == '') return;
  loadRecording(`https://a3tiles.indigofox.dev/ocapdata?url=${url}`);
});

async function setLayerLegend () {

  // iterate through legend-content children and hide all
  var legendContent = document.getElementById('legend-content');
  for (var i = 0; i < legendContent.children.length; i++) {
    legendContent.children[i].style.display = 'none';
  };

  // set object colors in legend based on map style
  var layers = map.getStyle().layers.map(layer => layer.id);

  layers.forEach(layer => {
    var element = document.getElementById(`${layer}-color`);
    if (!element) return;
    var features = map.queryRenderedFeatures({ layers: [layer], validate: false });
    if (features.length == 0) {
      element.style.backgroundColor = '#000';
      element.style.color = '#000';
      element.style.display = 'none';
      return;
    };
    var color = features[0].layer.paint['fill-extrusion-color'];
    if (!color) { color = features[0].layer.paint['fill-color'] };
    if (!color) { color = features[0].layer.paint['line-color'] };
    if (!color) {
      element.style.backgroundColor = '#000';
      element.style.color = '#000';
      element.style.display = 'none';
      return;
    }
    element.style.display = 'block';
    element.style.backgroundColor = color;
    // if color is an object, convert to string hex
    if (typeof color == 'object') {
      color = rgbToHex(color['r'] * 255, color['g'] * 255, color['b'] * 255)
    };
    color = invertColor(color, true);
    element.style.color = color
  });
};

function setBounds () {
  // sleep 2 seconds
  setTimeout(() => {
    var ne = map.getSource(layerId).tileBounds.bounds._ne
    var sw = map.getSource(layerId).tileBounds.bounds._sw
    mapbounds = [
      [sw.lng, sw.lat],
      [ne.lng, ne.lat]
    ]
    map.setZoom(11.5)
    map.setPitch(40)
    map.setBearing(0)
    console.log(mapbounds)
    map.fitBounds(mapbounds)
    map.setMaxBounds(mapbounds)
  }, 700);
}








document.getElementById('satellite').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.setLayoutProperty('satellite', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('satellite', 'visibility', 'none');
  };
  // loop twice
  for (let i = 0; i < 2; i++) {
    map.getTerrain() == null ? map.setTerrain({ source: 'heightmap' }) : map.setTerrain();
  }
});
document.getElementById('heightmap').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.setTerrain({ source: 'heightmap' });
  } else {
    map.setTerrain();
  }
});
// hillshade toggle
document.getElementById('hillshade').addEventListener('change', function (e) {
  if (e.target.checked) {
    map.setLayoutProperty('hillshade', 'visibility', 'visible');
  } else {
    map.setLayoutProperty('hillshade', 'visibility', 'none');
  }
});
// hillshade illumination strength listener
document.getElementById('hillshade-illumination-strength').addEventListener('input', function (e) {
  map.setPaintProperty('hillshade', 'hillshade-exaggeration', parseFloat(e.target.value));
  // set label html
  document.getElementById('hillshade-illumination-strength-label').innerHTML =
    `Hillshade illumination strength (${e.target.value})`;
});
// hillshade direction listener
document.getElementById('hillshade-illumination-direction').addEventListener('input', function (e) {
  map.setPaintProperty('hillshade', 'hillshade-illumination-direction', parseInt(e.target.value));
  // set label html
  document.getElementById('hillshade-illumination-direction-label').innerHTML =
    `Hillshade illumination direction (${e.target.value}&#176;)`;
});