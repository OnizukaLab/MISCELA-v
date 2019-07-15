function put_markers(data, icon_prop, label_prop, label_char){
	var json_data = JSON.parse(data)
	var sensor_counter = 0
	var group_counter = 0
	var latlng = new google.maps.LatLng(35.66666, 139.766766)
	var mapOptions = {
		zoom: 6,
		center: latlng
	}
	$("#map").empty()
	var gmap = new google.maps.Map($("#map")[0], mapOptions)
	for (var group of json_data["groups"]){
		for (var sensor of group){
			latlng = new google.maps.LatLng(sensor["log"], sensor["lat"])
			icon_prop.fillColor = color_codes[group_counter]
			icon_prop.strokeColor =  color_codes[group_counter]
			label_prop.text = label_char[group_counter]
			marker = new google.maps.Marker({
				position: latlng,
				icon: icon_prop,
				label: label_prop
			})
			marker.setMap(gmap)
			sensor_counter++
		}
		group_counter++
	}
	console.log(json_data["dataset"])
};

$("#go").click(function(){
	  var icon_prop = {
	    fillColor: "#FF0000",
	    fillOpacity: 1.0,
	    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
	    scale: 8,
	    strokeColor: "#FF0000",
	    strokeWeight: 1.0,
	    labelOrigin: new google.maps.Point(0, -2.2)
	  }
	  var label_prop = {
	    text: 'A',
	    color: "#FFFFFF",
	    fontSize: '12px'
	  }
	  var label_char = "ABCDEFGHIJKLMN"

	console.log("send request")
	var dataset = $("#dataset").val()
	var maxAtt = $("#maxAtt").val()
	var minSup = $("#minSup").val()
	var evoRate = $("#evoRate").val()
	var distance = $("#distance").val()
	var url = `http://10.0.16.7:8000/api/miscela/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`
	console.log(url)

	$.ajax({
		url: url,
		type: "GET",
		datatype: "json",
	}).done(function(data){
		put_markers(data, icon_prop, label_prop, label_char)
	})
	.fail(function(data){
		console.log("Error")
	});

})