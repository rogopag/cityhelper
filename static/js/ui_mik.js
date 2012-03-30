var $dialog, $button;

$(document).ready(function () {
	$('#footer').append($button);
});

function addButton() {
    $button = $.ninja.button({
		html: '<b>Ninja</b> star...'
	}).select(function () {
		$dialog.attach();
	});
    $dialog = $.ninja.dialog({
		html: '<img src="http://ninjaui.com/img/logo.png"/>'
	}).detach(function () {
		$button.deselect();
	});
};