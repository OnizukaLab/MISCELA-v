$("#widget-toggle-button").click(function() {
	$("#control-panel").toggleClass("hidden");
});

$("#fold-button").click(function() {
	$("#control-panel").toggleClass("folded");
});


$(function() {
	const yourdata = localStorage.getItem('yourdata');
	const dataset_id = dataset_id == 'yourdata' ? yourdata : localStorage.getItem('dataset');
	let dataset_name = dataset_id == 'yourdata' ? yourdata : dataset_id;
	switch(dataset_id) {
		case 'santander': dataset_name = 'Santander'; break;
		case 'china6':    dataset_name = 'China-6';   break;
		case 'china32':   dataset_name = 'China-32';  break;
	}
	$('#dataset').html(dataset_name);
	$('#dataset').attr('data', dataset_id);
});
