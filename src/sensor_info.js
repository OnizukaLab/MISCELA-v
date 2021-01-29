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
	var url_e = `http://localhost:8000/api/is_exists/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`
	var is_exist = $.ajax({
		type: "GET",
		url: url_e,
		async: false
	}).responseText

	return is_exist.toLowerCase() === "true"
}

function activate_fn(color, close){
	function fn(event){
		var marker_on = this
		var icon_prop = marker_on.getIcon()
		icon_prop.fillColor = color
		console.log(marker_on.groups)
		for (let g of marker_on.groups){
			for (let p of marker_on.prev_icon[g]){
				//console.log(p)
				var image = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + color)
				p.setIcon(image)
				p.color_now = color
				if (close == 0){
					p.window_.open(p.getMap(), p)
					p.is_open = true
				}
				else {
					p.window_.close()
					p.is_open = false
				}
				// infowindow.close()
			}
	  }
	}

	return fn
}

function draw_timeseries(data){
	const reg = /NaN/g
	const data_conv = data.replace(reg, 'null')
	const json_data = JSON.parse(data_conv)
	console.log(json_data)

	//const timestamp = json_data.timestamp; ***タイムスタンプを受け取れていない***
	const sensors = Object.values(json_data.sensor);
	const sensor_keys = Object.keys(json_data.sensor);
	const indexes = json_data.indexes;
	console.log(sensor_keys)

	chart_data = [];
	const sensors_len = sensors.length;
	for(let i = 0; i < sensors_len; i++) {
		sensor = sensors[i]

		attribute = sensor.attribute

		timestamp = sensor.timestamp
		timestamp = timestamp.map(x => new Date(x))

		data = sensor.data
		const max = Math.max.apply(null, data);
		data = data.map(x => x == null ? null : x/max);
		// センサーデータを最大値で割り,0〜１の値に変換。nullはnullとして使用

		let dataPoints = [];
		//let len = sensor.length;
		//for(let j = 0; j < len; j++)
		let data_len = data.length
		for(let j = 0; j < data_len; j++)
			dataPoints.push({ x: timestamp[j], y: data[j] });

		chart_data.push({
				legendText: sensor_keys[i]+" ( "+attribute+" )",
				showInLegend: true,
				type: "line",
				markerType: "circle",
				connectNullData: true,
				dataPoints: dataPoints
		});
	}

	let striplines = [];
	for(let index of indexes) {
		striplines.push({
			// color: "#ffcc99", value: new Date(timestamp[index])
			startValue: new Date(timestamp[index]),
			endValue: new Date(timestamp[index+1]),
			color: "#ffcc99"
		});
	}

	console.log(chart_data);
	console.log(striplines);

	mychart = new CanvasJS.Chart("chart", {
		backgroundColor: "rgba(0,0,0,0)",
		zoomEnabled: true,
		axisX:{
			//stripLines: striplines,
			// stripLines: [
			// 	{
			// 		startValue: new Date('2016-08-10 12:00:00'),
			// 		endValue: new Date('2016-08-10 18:00:00'),
			// 		color: "#ffcc99"
			// 	},
			// 	{
			// 		startValue: new Date('2016-08-11 09:00:00'),
			// 		endValue: new Date('2016-08-11 15:00:00'),
			// 		color: "#ffcc99"
			// 	},
			// 	{
			// 		startValue: new Date('2016-08-13 12:00:00'),
			// 		endValue: new Date('2016-08-13 16:00:00'),
			// 		color: "#ffcc99"
			// 	},
			// ],
			// valueFormatString: "####"
		},
		axisY: {
			maximum: 1,
			minimum: 0
		},
		// legend: {
		// 	// horizontalAlign: "left", // left, center ,right
		// 	verticalAlign: "top",  // top, center, bottom
		// 	fontSize: 12,
		// },
		data: chart_data
// 		[
// 			{
// 				legendText: "id=10015, attr=light",
// 				showInLegend: true,
// 				type: "line",
// 				markerType: "circle",
// 				connectNullData: true,
// 				dataPoints: [
// {x: new Date('2016-03-01 00:00:00'), y:null},
// {x: new Date('2016-03-01 01:00:00'), y:0.000204622},
// 				]
// 			},
// 			{
// 				type: "line",
// 				markerType: "circle",
// 				connectNullData: true,
// 				legendText: "id=10015, attr=light",
// 				showInLegend: true,
// 				dataPoints: [
// {x: new Date('2016-03-01 00:00:00'), y:null},
// {x: new Date('2016-03-01 01:00:00'), y:0.233745298},
// 				]
// 			}
// 		]
	});
	mychart.render();
}

function unique(arr1, arr2){
	var appeared_1 = new Set()
	var appeared_2 = new Set()
	var ret1 = []
	var ret2 = []

	for (let i=0; i<arr1.length; i++){
		//if (!(appeared_1.has(arr1[i]) || appeared_2.has(arr2[i]))){
		if (!(appeared_1.has(arr1[i]) && appeared_2.has(arr2[i]))){
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
	var dataset = $("#dataset").attr('data')
	var maxAtt = $("#maxAtt").val()
	var minSup = $("#minSup").val()
	var evoRate = $("#evoRate").val()
	var distance = $("#distance").val()
	var url = `http://localhost:8000/api/sensor_correlation/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`
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
		removeLoading();
	})
	.fail(function(data){
		console.log("Error at function: get_and_draw_timeseries")
		console.log(data, sensor_id, sensor_attr)
		removeLoading();
		swal("An error has occurred. Can't draw graph.");
	});
}

function gather_fn(event){
	console.log('marker pushed')
	console.log(event)
	data = []
	sensor_ids = []
	sensor_attr = []

	var marker_on = this
	//console.log(marker_on)
	for (let g of marker_on.groups){
		//console.log(g)
		for (let p of marker_on.prev_icon[g]){
			for (let sid of p.id_){
				sensor_ids.push(sid)
			}
			for (let sattr of p.attr_){
			  sensor_attr.push(sattr)
		  }
		}
	}
	dispLoading("Drawing graph...");
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
		//console.log(group)
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
			if (!points_group[P]){
				points_group[P] = new Set()
			}
			if (!group_members[group_counter]){
				group_members[group_counter] = new Set()
			}
			if (!points_id[P]){
				points_id[P] = new Set()
			}
			points_attr[P].add(attr)
			points_id[P].add(sensor["id"])
			//console.log(points_attr)
			//console.log(points_id)
			// points_id[P] = sensor["id"]
			group_members[group_counter].add(P)
			points_group[P].add(group_counter)
			sensor_counter++
		}
		group_patterns.push(group[0].pattern)
		group_counter++
	}
	console.log(points_group)
	console.log(group_members)

	var is_placed = {}

	//各グループごとにセンサを表示
	for (let [group_num, value_list] of Object.entries(group_members)){
		//console.log(group_num)
		//console.log(value_list)
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
      if (!is_placed[point]) {
				var marker = new google.maps.Marker({
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

				marker.groups = points_group[point]
				google.maps.event.addListener(marker, 'mouseover', activate_fn(color_code, 0))
				google.maps.event.addListener(marker, 'mouseout', activate_fn('888888', 1))
				google.maps.event.addListener(marker, 'click', gather_fn)
				is_placed[point] = marker
			}
			else{
				marker = is_placed[point]
			}
		}
		//console.log(marker)
	}

	for (let [loc, gm_set] of Object.entries(points_group)){
		var marker = is_placed[loc]
		marker.prev_icon = {}
		for (let gm of gm_set){
			if (!(gm in Object.keys(marker.prev_icon))){
				marker.prev_icon[gm] = new Set()
				for (let loc2 of group_members[gm]){
					marker.prev_icon[gm].add(is_placed[loc2])
				}
			}
	  }
		//console.log(marker.prev_icon)
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
	var url = `http://localhost:8000/api/miscela/${dataset}/${maxAtt}/${minSup}/${evoRate}/${distance}`

	console.log(url)

	var is_exist = is_cached(dataset, maxAtt, minSup, evoRate, distance)
	console.log(is_exist)

	if (!is_exist){
		var is_ok = confirm("It takes time to get the data. ")
		if (!is_ok)
			return
	}

	console.log("send request")

	// 計算実行前に Loading 画像を表示
	dispLoading("Running...");

	$.ajax({
		url: url,
		type: "GET",
		datatype: "json",
	})
	.done(function(data){
		removeLoading();
		swal("The calculation is finished.");
		put_markers(data, icon_prop, label_prop)
	})
	.fail(function(data){
		removeLoading();
		swal("An error has occurred.");
		console.log("Error")
	});
})

/* ------------------------------
 Loading イメージ表示関数
 引数： msg 画面に表示する文言
 ------------------------------ */
function dispLoading(msg){
  // 引数なし（メッセージなし）を許容
  if( msg == undefined ){
    msg = "";
  }
  // 画面表示メッセージ
  var dispMsg = "<div class='loadingMsg'>" + msg + "</div>";
  // ローディング画像が表示されていない場合のみ出力
  if($("#loading").length == 0){
    $("body").append("<div id='loading'>" + dispMsg + "</div>");
  }
}

/* ------------------------------
 Loading イメージ削除関数
 ------------------------------ */
function removeLoading(){
  $("#loading").remove();
}
