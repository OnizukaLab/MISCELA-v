var label_santander = {"temperature": "T", "light": "L", "noise": "N", "traffic_volume": "Tv", "humidity": "H"}
var label_china = {"PM2.5": "PM2.5",
				   "PM10": "PM10",
				   "SO2": "SO2",
				   "NO2": "NO2",
				   "CO": "CO",
				   "O3": "O3",
				   "sunny-persent": "%S",
				   "rainy-persent": "%R",
				   "rain": "R",
				   "temperature": "T",
				   "air-pressure": "A",
				   "humidity": "H",
				   "wind_speed": "W"}

function id_to_HSV(n){
	var rotate = ((n / 6) % 6) * 10
	var H = rotate + (n % 6)*60
	var S = 1, V = 1
	return [H, S, V]
}

function HSV_to_RGB(hsv){
	var Hd = hsv[0] / 60
	var C = hsv[1]
	var X = C*(1 - Math.abs(Hd % 2 - 1))
	var V = hsv[2]
	switch (parseInt(Hd) % 6){
		case 0:
			rgb = [V, V - C + X, V - C]
			break;
		case 1:
			rgb = [V - C + X, V, V - C]
			break;
		case 2:
			rgb = [V - C, V, V - C + X]
			break;
		case 3:
			rgb = [V - C, V - C + X, V]
			break;
		case 4:
			rgb = [V - C + X, V - C, V]
			break;
		case 5:
			rgb = [V, V - C, V - C + X]
			break;
	}
	return rgb.map(function(value){
		return parseInt(value * 255)
	})
}

function RGB_to_HEX (rgb) {
	return "#" + rgb.map(function(value) {
		return ("0" + value.toString(16)).slice(-2);
	}).join("") ;
}

function get_color_code(i){
	return RGB_to_HEX(HSV_to_RGB(id_to_HSV(i)))
}

function num_duplication(p, points){
	var ret = 0
	var dis = 0
	for (var q of points){
		dis = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
		if (dis == 0){
			ret += 1
		}
	}
	return ret
}

function is_cached(dataset, maxAtt, minSup, evoRate, distance){
	var url_e = `http://10.0.16.1:8000/api/is_exists/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`
	var is_exist = $.ajax({
		type: "GET",
		url: url_e,
		async: false
	}).responseText

	return is_exist.toLowerCase() === "true"
}


function put_markers(data, icon_prop, label_prop){
	var json_data = JSON.parse(data)
	var sensor_counter = 0
	var group_counter = 0
	var latlng = new google.maps.LatLng(35.66666, 139.766766)
	var mapOptions = {
		zoom: 15,
		center: latlng
	}
	$("#map").empty()
	var gmap = new google.maps.Map($("#map")[0], mapOptions)
	var meanLng = 0
	var meanLat = 0
	var points_attr = {}
	var points_group = {}
	for (var group of json_data["groups"]){
		for (var sensor of group){
			icon_prop.labelOrigin = new google.maps.Point(0, 0)
			latlng = new google.maps.LatLng(sensor["log"], sensor["lat"])
			meanLng += sensor["log"]
			meanLat += sensor["lat"]
			var P = [sensor["log"], sensor["lat"]]
			var attr = ""
			console.log(json_data["dataset"] === "santander")
			if (json_data["dataset"] === "santander"){
				attr = label_santander[sensor["attribute"]]
			}
			else{
				attr = label_china[sensor["attribute"]]
			}

			if (!points_attr[P]){
				points_attr[P] = new Set()
			}
			points_attr[P].add(attr)
			points_group[P] = group_counter
			sensor_counter++
		}
		group_counter++
	}
	for (let [key, value] of Object.entries(points_attr)){
		var color_code = get_color_code(points_group[key])
		icon_prop.fillColor = color_code
		// icon_prop.strokeColor = color_code

		var label = ""
		for (var str of points_attr[key]){
			label += str + " "
		}
		label_prop.text = label
		latlng = new google.maps.LatLng(parseFloat(key.split([0])), parseFloat(key.split(',')[1]))
		marker = new google.maps.Marker({
			position: latlng,
			icon: icon_prop,
			label: label_prop
		})
		marker.setMap(gmap)
	}
	meanLng /= sensor_counter
	meanLat /= sensor_counter
	gmap.setCenter(new google.maps.LatLng(meanLng, meanLat))
	console.log(json_data["dataset"])
};



$("#go").click(function(){
	  var icon_prop = {
	    fillColor: "#FF0000",
	    fillOpacity: 1.0,
	    path: google.maps.SymbolPath.CIRCLE,
	    scale: 20,
	    strokeColor: "#000000",
	    strokeWeight: 1.0,
	    labelOrigin: new google.maps.Point(0, 0)
	  }
	  var label_prop = {
	    text: 'A',
	    color: "#FFFFFF",
	    fontSize: '12px'
	  }


	var dataset = $("#dataset").val()
	var maxAtt = $("#maxAtt").val()
	var minSup = $("#minSup").val()
	var evoRate = $("#evoRate").val()
	var distance = $("#distance").val()
	var url = `http://10.0.16.1:8000/api/miscela/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`

	console.log(url)

	var is_exist = is_cached(dataset, maxAtt, minSup, evoRate, distance)
	console.log(is_exist)


	if (!is_exist){
		var is_ok = confirm("データの取得に時間がかかります。よろしいですか？")
		if (!is_ok)
			return
	}
	console.log("send request")
	$.ajax({
		url: url,
		type: "GET",
		datatype: "json",
	}).done(function(data){
		put_markers(data, icon_prop, label_prop)
	})
	.fail(function(data){
		console.log("Error")
	});

})
