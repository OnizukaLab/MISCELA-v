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
		return parseInt(value * 200)
	})
}

function RGB_to_HEX (rgb) {
	return rgb.map(function(value) {
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

function activate_fn(color){
	function fn(event){
		var p = this
		var icon_prop = p.getIcon()
		icon_prop.fillColor = color
		while(true){
			var image = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color)
			p.setIcon(image)
			p.color_now = color
			if (!p.is_open){
				p.window_.open(p.getMap(), p)
				p.is_open = true
			}
			else{
				p.window_.close()
				p.is_open = false
			}
			// infowindow.close()
			p = this.prev_icon
			icon_prop = p.getIcon()
			if (p.color_now === color){
				break
			}
		}
	}

	return fn
}


function put_markers(data, icon_prop, label_prop){
	console.log(data)
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
	var group_members = {}
	var group_patterns = []
	for (var group of json_data["groups"]){
		for (var sensor of group){
			icon_prop.labelOrigin = new google.maps.Point(0, 0)
			latlng = new google.maps.LatLng(sensor["log"], sensor["lat"])
			meanLng += sensor["log"]
			meanLat += sensor["lat"]
			var P = [sensor["log"], sensor["lat"]]
			var attr = ""
			if (json_data["dataset"] === "santander"){
				attr = sensor["attribute"]
			}
			else{
				attr = sensor["attribute"]
			}

			if (!points_attr[P]){
				points_attr[P] = new Set()
			}
			if (!group_members[group_counter]){
				group_members[group_counter] = new Set()
			}
			points_attr[P].add(attr)
			group_members[group_counter].add(P)
			points_group[P] = group_counter
			sensor_counter++
		}
		group_patterns.push(group[0].pattern)
		group_counter++
	}

	//各グループごとにセンサを表示
	for (let [group_num, value_list] of Object.entries(group_members)){
		var marker_prev = null 
		var marker_st = null
		var c = 0
		for (var point of value_list){
			c++;
			//ハイライト時の色
			var color_code = get_color_code(group_patterns[group_num])
			//デフォルト色

			//表示するラベルの設定
			var label = ""
			for (var str of points_attr[point]){
				label += str + "<br>"
			}

			//マーカを置く
			latlng = new google.maps.LatLng(point[0], point[1])
			var image = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + '888888')

			marker = new google.maps.Marker({
				position: latlng,
				// icon: image,
				icon: image,
				// label: label_prop
			})

		    var infowindow = new google.maps.InfoWindow({
		        content: label
		    });
			marker.setMap(gmap)
			marker.window_ = infowindow
			marker.is_open = false

			//マーカを前イテレーション時のマーカと繋げる
			marker.prev_icon = marker_prev
			if (marker_prev == null){
				//一番最初のマーカなので、marker_stにセット
				marker_st = marker
			}
			google.maps.event.addListener(marker, 'mouseover', activate_fn(color_code))
			google.maps.event.addListener(marker, 'mouseout', activate_fn('888888'))
			marker_prev = marker
		}

		//最初と最後をつなぐ
		marker_st.prev_icon = marker
	}
	meanLng /= sensor_counter
	meanLat /= sensor_counter
	gmap.setCenter(new google.maps.LatLng(meanLng, meanLat))
	console.log(json_data["dataset"])
};



$("#go").click(function(){
	  var icon_prop = {
	    fillColor: "#888888",
	    // fillOpacity: 1.0,
	    // path: google.maps.SymbolPath.CIRCLE,
	    // scale: 20,
	    strokeColor: "#000000",
	    // strokeWeight: 1.0,
	    // labelOrigin: new google.maps.Point(0, 0)
	  }
	  var label_prop = {
	    text: 'A',
	    color: "#FFFFFF",
	    fontSize: '12px'
	  }


	var dataset = $("#dataset").attr('data')
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
