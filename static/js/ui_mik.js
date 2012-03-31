var $options, $optionsSelect,
	$traffic, $trafficSelect;

$(document).ready(function () {
	/* info */
	/* bookmark */
	/* means */
	/* options */
	$('div.bt_4 span').append($options);
	$('div.bt_4 div.open').append($traffic,$ztl);
});

function addButton() {
	/* create drawers */
	$options = $.ninja.drawer({
		html: '<div class="open"></div>',
		value: ''
	}),
	$optionsSelect = $.ninja.drawer({
		html: '',
		select: true,
		value: ''
	});
	
	/* create buttons */
	$traffic = $.ninja.button({
		html: 'Traffico'
		}),
	$trafficSelect = $.ninja.button({
		html: 'Selected',
		select: true
	});
	$ztl = $.ninja.button({
		html: 'ZTL'
		}),
	$ztlSelect = $.ninja.button({
		html: 'Selected',
		select: true
	});
};