var mymap = L.map('map').setView([51.505, -0.09], 2);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2FsbGVuMTk5OSIsImEiOiJja2d3cmI5bWkwY3pxMzFwbmgwMmhlajk4In0.ZPpCyzJ_4pGPb2ujRkxqbQ', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiZ2FsbGVuMTk5OSIsImEiOiJja2d3cmI5bWkwY3pxMzFwbmgwMmhlajk4In0.ZPpCyzJ_4pGPb2ujRkxqbQ'
}).addTo(mymap);

var searchControl = L.esri.Geocoding.geosearch().addTo(mymap);
var results = L.layerGroup().addTo(mymap);

  searchControl.on('results', function (data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
      results.addLayer(L.marker(data.results[i].latlng));
    }
  });

var sidebar = L.control.sidebar({
    autopan: false,
    closeButton: true,    // whether to add a close button to the panes
    container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
    position: 'left',     // left or right
}).addTo(mymap);

sidebar.addPanel({
    id:   'Home',
    tab:  '<i class="fas fa-bars"></i>',
    title: 'Home',
    pane: '<ul id="ulCoordinates"></ol>',
}).addPanel({
    id:   'js-api',
    tab:  '<i class="fas fa-cog"></i>',
    title: 'JS API',
    pane: '<p>The Javascript API allows to dynamically create or modify the panel state.<p/><p><button onclick="sidebar.enablePanel(\'mail\')">enable mails panel</button><button onclick="sidebar.disablePanel(\'mail\')">disable mails panel</button></p><p><button onclick="addUser()">add user</button></b>',
}).addPanel({
    id:   'mail',
    tab:  '<i class="fa fa-envelope"></i>',
    title: 'Messages',
    button: function() { alert('opened via JS callback') },
    disabled: true,
})





var markers = L.layerGroup().addTo(mymap);
var popup = L.popup();
readCoordinates();




/**
 * read all the bucket list items from the database
 */
async function readCoordinates() {
    try {
        
        const result = await fetch("http://localhost:8080/coordinates", { method: "GET" });
        const coordinates = await result.json();
        coordinates.forEach(t => {
            addCoordinateToList(t);
        });
    }
    catch (e) {
        console.log("error reading coordinates")
    }

}


async function addCoordinateToList(coordinate){
    console.log(coordinate);
    const ulCoordinates = document.getElementById("ulCoordinates")
    const li = document.createElement("li")
    li.textContent = coordinate.id + ": " + coordinate.x + ", " + coordinate.y + ", " + coordinate.name + ", " + coordinate.visited;
    li.id = coordinate.id;
    var marker = L.marker([coordinate.x, coordinate.y]);
    marker.on('click', function(e){
        L.DomEvent.stopPropagation(e);
        fetch("http://localhost:8080/coordinates", {
            method: "DELETE", 
            headers : {"content-type":"application/json"}, 
            body: JSON.stringify({"x":e.latlng.lat, "y":e.latlng.lng}) 
        });
        markers.removeLayer(this)
        document.getElementById(li.id).outerHTML = "";
        popup.setLatLng(e.latlng).setContent("You deleted " + e.latlng.toString()).openOn(mymap);
    });
    markers.addLayer(marker);
    ulCoordinates.appendChild(li)
}




/**
 * On a map click, add a bucket list item
 * @param {*} e event
 */
async function onMapClick(e) {
    await fetch("http://localhost:8080/coordinates", { 
        method: "POST", 
        headers: {"content-type": "application/json"},
        body: JSON.stringify({"x":e.latlng.lat, "y":e.latlng.lng, "name":"3", "visited": "false"})
    });
    const result = await fetch("http://localhost:8080/specificCoordinate?" + new URLSearchParams({
        x: e.latlng.lat,
        y: e.latlng.lng
    }), { method: "GET"});
    const coordinates = await result.json();
    coordinates.forEach(t => {
        addCoordinateToList(t);
    });
}
mymap.on('click', onMapClick);