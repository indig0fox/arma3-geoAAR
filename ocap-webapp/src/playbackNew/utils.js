import proj4 from 'proj4'

export function XY_to_LatLon (coords) {
  if (coords.length > 2) {
    return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [coords[0], coords[1], coords[2]]);
  } else {
    return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [coords[0], coords[1]]);
  };
};

export function getType (type) {
  switch (type) {
    case "unit":
      return "man";
    case "sea":
      return "ship";
    case "parachute":
      return "parachute";
    case "heli":
      return "heli";
    case "plane":
      return "plane";
    case "truck":
      return "truck";
    case "car":
      return "car";
    case "apc":
      return "apc";
    case "tank":
      return "tank";
    case "static-mortar":
      return "unknown"; // TODO
    case "static-weapon":
      return "unknown"; // TODO
    default:
      return "unknown";
  };
};

export function ASLtoATL (coords, asl) {
  if (coords.length == 2) {
    return asl - map.queryTerrainElevation(coords, { exaggerated: false });
  } else {
    return asl - map.queryTerrainElevation(coords.slice(0, 2), { exaggerated: false });
  }
};

export function animateBulletInterval (callback, feature, delay, repetitions) {
  var x = 0;
  var intervalID = window.setInterval(function () {

    callback();

    if (++x === repetitions) {
      window.clearInterval(intervalID);
    }
  }, delay);
}

export function secondsToTimestamp (seconds) {
  if (seconds === null || seconds === undefined) {
    return '';
  }
  // convert seconds to hh:mm:ss
  var date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
}

export function invertColor (hex, bw) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  if (bw) {
    // https://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
      ? '#000000'
      : '#FFFFFF';
  }
  // invert color components
  r = (255 - r).toString(16);
  g = (255 - g).toString(16);
  b = (255 - b).toString(16);
  // pad each with zeros and return
  return "#" + padZero(r) + padZero(g) + padZero(b);
}

export function padZero (str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

export function rgbToHex (r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function hexToRgb (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);
    return r + "," + g + "," + b;//return 23,14,45 -> reformat if needed 
  }
  return null;
}