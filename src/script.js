$("#widget-toggle-button").click(function() {
	$("#control-panel").toggleClass("hidden");
});

$("#fold-button").click(function() {
	$("#control-panel").toggleClass("folded");
});


$(function() {
	const dataset_id = localStorage.getItem('dataset');
	switch(dataset_id) {
		case 'santander': dataset_name = 'Santander'; break;
		case 'china6':    dataset_name = 'China-6';   break;
		case 'china32':   dataset_name = 'China-32';  break;
		default:          dataset_name = dataset_id;  break;
	}
	$('#dataset').html(dataset_name);
	$('#dataset').attr('data', dataset_id);
});
