const baseurl = 'http://10.0.16.1:8000/api/';
const CHUNK_SIZE = 100000;

$(function() {

	files = []

	$('input[name="dataset"]').change(function(){
		const idname = $(this).attr('id');
		const descriptionname = idname + '-desc';
		$('section').css({display: 'none'})
		$('.' + descriptionname).css({display: 'block'});
	});

	$('input[name="dataset"]:checked').change()

	$('input[name="upload_file"]').change(function(){
		files = $(this)[0].files;
		showfilenames();
	});

	$('#start').click(function() {
		const dataset_name = $('input[name="dataset"]:checked').attr('id');
		switch(dataset_name) {
			case 'santander':
			case 'china6':
			case 'china32':
				localStorage.setItem('dataset', dataset_name);
				go_to_demopage();
				return;
		}
		file_upload();
	});

	let yourdata = localStorage.getItem('dataset');
	yourdata = yourdata == null ? Math.random().toString(32).substring(2) : yourdata;
	$('#dataset-name').val(yourdata);
});


function go_to_demopage() {
	window.location.href = 'demo.html';
}

function isInAcceptedFile(fname) {
	var accept_files = ['data.csv', 'location.csv', 'attribute.csv'];
	return accept_files.indexOf(fname) != -1;
}


// 指定されたファイルを確認し、ファイル名を表示する。
function showfilenames() {
	var byte2humantext = function(byte) {
		if(byte > 1000000)
			return (byte / 1000000 >> 0) + ' MB';
		if(byte > 1000)
			return (byte / 1000 >> 0) + ' KB';
		return byte + ' bytes'
	};
	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		output.push('<li><strong>', f.name, '</strong> - ', byte2humantext(f.size))

		if(isInAcceptedFile(f.name) == false)
			output.push('<br><small style="color: red;">指定されたファイル名ではありません</small>');
		output.push('</li>');
	}
	$('#list').html('<ul>' + output.join('') + '</ul>');
}


//drop zoneの実装
function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	files = evt.dataTransfer.files; // FileList object.
	showfilenames()
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; 
}

// イベントリスナーを設定
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


function file_upload()
{
	let yourdata = $('#dataset-name').val();
	yourdata = yourdata == '' ? Math.random().toString(32).substring(2) : yourdata;
	localStorage.setItem('dataset', yourdata);

	$('#sending').html('処理中...');

	// サーバーのデータを消す
	const delete_dataset = function(dataset_name) {
		$.ajax({
			type: 'GET',
			url: baseurl + 'delete_dataset/' + dataset_name,
			async: false
		});
	};

	// データセットの存在確認
	const is_dataset_exists = $.ajax({
		type: 'GET',
		url: baseurl + 'is_dataset_exists/' + yourdata,
		async: false
	}).responseText;

	// あったら消す
	if(is_dataset_exists == 'True') {
		if(files.length == 0) {
			go_to_demopage();
			return
		}
		is_overwrite = window.confirm('データセット' + yourdata + 'は存在します。上書きしてよろしいですか？');
		if(!is_overwrite) {
			$('#sending').html('');
			return;
		}
		delete_dataset(yourdata);
	}

	if(files.length != 3 || !isInAcceptedFile(files[0].name) || !isInAcceptedFile(files[1].name) || !isInAcceptedFile(files[2].name)) {
		$('#sending').html('');
		alert('ファイル数またはファイル名が正しくありません。');
		return;
	}

	let datafile, attributefile, locationfile;
	for(file of files) {
		switch(file.name) {
			case 'data.csv': datafile = file; break;
			case 'attribute.csv': attributefile = file; break;
			case 'location.csv': locationfile = file; break;
			default: console.log('error'); return;
		}
	}

	// formdata を作る
	const get_formdata = function(data_name, data_type, data_id, upload_file) {
		const formdata = new FormData()
		formdata.append('data_name', data_name)
		formdata.append('data_type', data_type)
		formdata.append('data_id', data_id)
		formdata.append('upload_file', upload_file)
		return formdata
	};

	// formdata を送る
	const send_formdata = function(formdata) {
		$.ajax({
			type: 'POST',
			url: baseurl + 'upload/',
			data: formdata,
			processData: false,
			cache       : false,
			contentType : false,
			async       : false
		})
		.done(function(rdata, textStatus, jqXHR){
			console.log(rdata);
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			console.log("fail");
		})
	};

	let sending_num = 0; 					// いま送り中のファイル数
	let started_all_sendingthread = false;	// すべてのファイル送信の動作は開始した

	// ファイルの1行目をチェックして送信
	const filecheck_and_send = function(file, formdata, checkfirstline) {
		var reader = new FileReader();
		reader.readAsText(file);
		sending_num++;
		reader.addEventListener('load', function(e) {
			const firstline = e.target.result.split('\n')[0];
			if(checkfirstline(firstline)) {
				send_formdata(formdata);
			}
			else {
				alert(file.name + 'のフォーマットエラーです。');
				console.log(file.name + 'のフォーマットエラーです。');
				delete_dataset(yourdata);
			}
			sending_num--;
			$('#sending').html('送信中...');
			if(started_all_sendingthread && sending_num == 0) { // すべてのファイルは送信開始していて、送り中のファイルがゼロだったら
				go_to_demopage();
			}
		});
	};

	// send attribute.csv
	const attribute = get_formdata(yourdata, 'attribute', 0, attributefile);
	filecheck_and_send(attributefile, attribute, (firstline) => { return true; });

	// send location.csv
	const location = get_formdata(yourdata, 'location', 0, locationfile);
	filecheck_and_send(locationfile, location, (firstline) => { return firstline == 'id,attribute,lat,lon'; });

	// send data.csv with splitting
	var reader = new FileReader();
	reader.readAsText(datafile);
	reader.addEventListener('load', function() {
		const alldata = reader.result.split('\n');
		const alldata_length = alldata.length;
		for(let i = 0, j = 0; i < alldata_length; i += CHUNK_SIZE, j++) {
			const chunk = alldata.slice(i, i + CHUNK_SIZE);
			const chunkfile = new File([chunk.join('\n')], 'data.csv', {type: 'text/csv'});
			// function blob2file(blobData, filename) {
			// 	const fd = new FormData();
			// 	fd.set('a', blobData, filename);
			// 	return fd.get('a');
			// }
			// chunkfile = blob2file(chunkfile, 'data.csv');
			const data = get_formdata(yourdata, 'data', i, chunkfile);
			filecheck_and_send(chunkfile, data, (firstline) => { return firstline.split(',').length == 4; });
			started_all_sendingthread = true;
		}
	});
}