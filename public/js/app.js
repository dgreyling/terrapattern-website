var terrapatternMap = (function(){

  // CONSTANTS
  var THE_WHOLE_WORLD = [
          [0, 90],
          [180, 90],
          [180, -90],
          [0, -90],
          [-180, -90],
          [-180, 0],
          [-180, 90],
          [0, 90]
  ];
  var BOUNDARY_STYLE = {
      strokeWeight: 0,
      fillColor: "#000000",
      fillOpacity: .7
  };
  var MAP_OPTIONS = {
            center: {lat: map_center.lat, lng: map_center.lng},
            zoom: 17,
            mapTypeId: "satellite",
            mapTypeControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            tilt: 0,
            maxZoom: 19,
            minZoom: 10
  };

  //Internal module variables
  var lastValidCenter;
  var defaultBounds;
  var map;
  var pinIds = [];

  //-----------------
  function getTileImage(lat,lng,size=200) {
    var url = "https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&zoom=19";
    url = url + "&center=" + lng + "," + lat;
    url = url + "&size=" + size + "x" + size;
    url = url + "&key=" + MAPS_API_KEY;
    return url
  } 

  //-----------------
  function hideEverythingBut(and_then_show=null) {
    $('#result-grid').addClass("hidden");
    $('#no-results').addClass("hidden");
    $('#waiting').addClass("hidden");
    $(and_then_show).removeClass("hidden");
  }

  //-----------------
  function handlePan() {
    if (defaultBounds.contains(map.getCenter())) {
        // still within valid bounds, so save the last valid position
        lastValidCenter = map.getCenter();
        return; 
    }
    // not valid anymore => return to last valid position
    map.panTo(lastValidCenter);
  }

  //-----------------
  function handleSearch() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
    var new_location = places[0];
    map.panTo(new_location.geometry.location);
    map.setZoom(18);
  }

  //-----------------
  function handleClick(e) {
      
      hideEverythingBut('#waiting');
      var roundAmount = 1000;
      
      var data = {lat: e.latLng.lat(), lng: e.latLng.lng()}
   
      var results = $.get("/search", data);
      results.done(function(e){
        
        hideEverythingBut('#result-grid');
       
        pinIds.forEach(function(p) {
          map.data.remove(map.data.getFeatureById(p));
        })

        var pins = map.data.addGeoJson(e);
        var pinBounds = new google.maps.LatLngBounds();
        pinIds = [];

        for (var i = 0; i < pins.length; i++) {
          pinIds.push(pins[i].getId());
          pinBounds.extend( pins[i].getGeometry().get());
        }

        map.fitBounds(pinBounds);
      });
  }

  //-----------------
  function initMap() {

    // Set the search boundary (just a hint, not a requirement)
    defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(bounding_box.sw_lat, bounding_box.sw_lng),
      new google.maps.LatLng(bounding_box.ne_lat, bounding_box.ne_lng)
    );

    // Initialize the map object
    map = new google.maps.Map(document.getElementById('main-map'), MAP_OPTIONS);  
    lastValidCenter = map.getCenter();

    // Initialize the grey boundary
    boundary.geometry.coordinates.unshift(THE_WHOLE_WORLD);
    map.data.addGeoJson(boundary);
    map.data.setStyle(BOUNDARY_STYLE);

    // Set up the search box
    var input = document.getElementById('search_box');
    var searchBox = new google.maps.places.SearchBox(input, {bounds: defaultBounds});
    searchBox.setBounds(map.getBounds());
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Set up the event handlers
    map.addListener('click', handleClick);
    map.addListener('center_changed',handlePan);
    searchBox.addListener('places_changed', handleSearch);
  }


  // Expose the module's interface to the world (you naughty code, you).
  return {
    initialize: initMap
  };
}());

