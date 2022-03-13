var mymap = L.map('map').setView([51.505, -0.09], 2);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16,
    minZoom: 3
}).addTo(mymap);

var geocodeService = L.esri.Geocoding.geocodeService();
var searchControl = L.esri.Geocoding.geosearch().addTo(mymap);
var results = L.layerGroup().addTo(mymap);

  searchControl.on('results', function (data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
      results.addLayer(L.marker(data.results[i].latlng));
    }
  });

var sidebar = L.control.sidebar({
    autopan: true,
    closeButton: true,    // whether to add a close button to the panes
    container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
    position: 'left',     // left or right
}).addTo(mymap);

sidebar.addPanel({
    id:   'BucketList',
    tab:  '<i class="fas fa-bars"></i>',
    title: 'Bucket List',
    pane: '<ul id="ulCoordinates"></ul>',
})
sidebar.addPanel({
    id: 'ghlink',
    tab: '<i class="fa fa-github"></i>',
    position: 'bottom',
    button: 'https://github.com/griffinallen'
});





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
            addCoordinateToList(t.name, t.lng, t.lat);
        });
    }
    catch (e) {
        console.log("error reading coordinates")
    }
}


async function addCoordinateToList(name, lng, lat){
    //console.log(x + ", " + y + ", " + name + ", " + visited);
    const ulCoordinates = document.getElementById("ulCoordinates")
    const li = document.createElement("li")
    li.textContent = name
    console.log(lng + ", " + lat)
    var marker = L.marker([lat, lng])
    marker.on('click', function(e){
        L.DomEvent.stopPropagation(e);
        fetch("http://localhost:8080/coordinates", {
            method: "DELETE", 
            headers : {"content-type":"application/json"}, 
            body: JSON.stringify({"name":name}) 
        });
        ulCoordinates.removeChild(li)
        markers.removeLayer(this)
        document.getElementById(li.id).outerHTML = "";
        popup.setLatLng(e.latlng).setContent("You deleted " + e.latlng.toString()).openOn(mymap);
        sidebar.open("Clicked");
    });
    markers.addLayer(marker);
    ulCoordinates.appendChild(li)
}


sidebar.on('content', function(e) {
    console.log(e.id);
})

/**
 * On a map click, add a bucket list item
 * @param {*} e event
 */
async function onMapClick(e) {
    geocodeService.reverse().latlng(e.latlng).language("en")
    .run(async function (error, result) {
        if (error) {
          return;
        }
        console.log(result.address.Match_addr);

        var first = result.address.City
        var second = result.address.CountryCode
        if (first == ""){
            first = result.address.Subregion
            if (first == ""){
                first = result.address.Region
            }
        }
        var name = first + ", " + second
        if (first=="" || second ==""){
            name = result.address.Match_addr
        }
        sidebar.open("BucketList");
        await fetch("http://localhost:8080/coordinates", { 
            method: "POST", 
            headers: {"content-type": "application/json"},
            body: JSON.stringify({"name": name, "lat":e.latlng.lat, "lng":e.latlng.lng})
        });
        console.log("post made " + e.latlng)
        addCoordinateToList(name, e.latlng.lng, e.latlng.lat);
    });
    
}
mymap.on('click', onMapClick);