// $(function() {
//   $("#map").googleMap({
//     zoom: 15,
//     coords: [35.681382, 139.766084],
//     type: "ROADMAP"
//   });
// })
var markers = []
var color_codes = ["#FF0000", "#00FF00", "#0000FF", "#888800", "#00FFFF", "#FF00FF"]
function initMap(){
  var uluru = {lat: 35.681382, lng: 139.766084}
  var gmap = new google.maps.Map(
  $("#map")[0], {zoom: 4, center: uluru});

}
