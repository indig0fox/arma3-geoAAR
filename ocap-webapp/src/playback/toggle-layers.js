map.on('idle', () => {

  // Enumerate ids of the layers.
  const toggleableLayerIds = [
    'grid-lines',
    'grid-text',
    'mountains-polyline',
    'mountains-text'
  ];

  // Check each ID to see if they exist on the map.
  var missingLayers = []
  toggleableLayerIds.forEach((id) => {
    if (!map.getLayer(id)) { return id }
  });

  console.log("Missing layers: " + missingLayers.join(', '))

  if (!missingLayers) { return }


  // Set up the corresponding toggle button for each layer.
  for (const id of toggleableLayerIds) {
    // Skip layers that already have a button set up.
    if (document.getElementById(id)) {
      continue;
    }

    // Create a link.
    const link = document.createElement('a');
    link.id = id;
    link.href = '#';
    link.textContent = id;
    link.className = 'active';

    // Show or hide layer when the toggle is clicked.
    link.onclick = function (e) {
      const clickedLayer = this.textContent;
      e.preventDefault();
      e.stopPropagation();

      const visibility = map.getLayoutProperty(
        clickedLayer,
        'visibility'
      );

      // Toggle layer visibility by changing the layout object's visibility property.
      if (visibility === 'visible') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
        this.className = '';
      } else {
        this.className = 'active';
        map.setLayoutProperty(
          clickedLayer,
          'visibility',
          'visible'
        );
      }
    };

    const layers = document.getElementById('layer-menu');
    layers.appendChild(link);
  }
});