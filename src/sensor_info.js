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

function draw_timeseries(data){
	const reg = /NaN/g
	const data_conv = data.replace(reg, '-1')
	const json_data = JSON.parse(data_conv)
	console.log(json_data)

}

function unique(arr1, arr2){
	var appeared_1 = new Set()
	var appeared_2 = new Set()
	var ret1 = []
	var ret2 = []
	for (let i=0; i<arr1.length; i++){
		if (!(appeared_1.has(arr1[i]) || appeared_2.has(arr2[i]))){
			ret1.push(arr1[i])
			ret2.push(arr2[i])
			appeared_1.add(arr1[i])
			appeared_2.add(arr2[i])
		}
	}

	return [ret1, ret2]

}

function get_and_draw_timeseries(sensor_id, sensor_attr){

	// console.log(JSON.stringify({'sensor_ids': sensor_id}))
	const formdata = new FormData()
	console.log(sensor_id)
	console.log(sensor_attr)

	var appeared_id = new Set()
	const tmp = unique(sensor_id, sensor_attr)
	console.log(tmp)
	const unique_id = tmp[0]
	const unique_attr = tmp[1]

	// sensor_id.forEach(entry => { formdata.append('sensor_ids[]', entry)})
	// formdata.append('sensor_ids', JSON.stringify(sensor_id))
	// formdata.append('sensor_attributes', JSON.stringify(sensor_attr))
	unique_id.forEach(entry => {formdata.append('sensor_ids', entry)})
	unique_attr.forEach(entry => {formdata.append('sensor_attributes', entry)})
	var dataset = $("#dataset").val()
	var maxAtt = $("#maxAtt").val()
	var minSup = $("#minSup").val()
	var evoRate = $("#evoRate").val()
	var distance = $("#distance").val()
	var url = `http://10.0.16.1:8000/api/sensor_correlation/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`
	$.ajax({
		url: url,
		data: formdata,
		type: "POST",
		processData: false,
		cache       : false,
		contentType : false,
	})
	.done(function(data){
		draw_timeseries(data)
	})
	.fail(function(data){
		console.log("Error at function: get_and_draw_timeseries")
		console.log(data)
	});
}

function gather_fn(event){
	console.log('marker pushed')
	console.log(event)
	data = []
	sensor_ids = []
	sensor_attr = []
	var st_id = this.id_
	var st_attr = this.attr_
	var p = this
	while (true){
	    var sensor_id = p.id_
	    var attr = p.attr_
	    for (var id_ of sensor_id){
	    	sensor_ids.push(id_)
	    }
	    for (var attr_ of attr){
	    	sensor_attr.push(attr_)
	    }
	    // sensor_ids.push(p.id_)
	    // sensor_attr.push(p.attr_)
	    p.visited = true
	    p = p.prev_icon
	    if (p.id_ === st_id && p.attr_ === st_attr){
	    	break
	    }
	}

	get_and_draw_timeseries(sensor_ids, sensor_attr)
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
	var points_id = {}
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
				points_attr[P] = []
			}
			if (!group_members[group_counter]){
				group_members[group_counter] = new Set()
			}
			if (!points_id[P]){
				points_id[P] = []
			}
			points_attr[P].push(attr)
			points_id[P].push(sensor["id"])
			// points_id[P] = sensor["id"]
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
			var attr_set = new Set(points_attr[point])
			for (var str of attr_set){
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
			marker.id_ = points_id[point]
			marker.attr_ = points_attr[point]

			//マーカを前イテレーション時のマーカと繋げる
			marker.prev_icon = marker_prev
			if (marker_prev == null){
				//一番最初のマーカなので、marker_stにセット
				marker_st = marker
			}
			google.maps.event.addListener(marker, 'mouseover', activate_fn(color_code))
			google.maps.event.addListener(marker, 'mouseout', activate_fn('888888'))
			google.maps.event.addListener(marker, 'click', gather_fn)
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
