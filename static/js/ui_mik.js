jQuery(document).ready(function($){
	/* info */
	/* bookmark */
	/* means */
	/* view.options */
	uiController();
});
function uiController(){
	
	var view;
	
	var viewController = {
		options:null,
		optionsSelect:null, 
		traffic:null, 
		trafficSelect:null, 
		parkings:null,
		init: function()
		{
			view = this;
			view.hideAddressBar();
			view.setSelectLayer();
		},
		setSelectLayer: function()
		{
			// create elements and their otions
			view.addButton();
			//append elements created to buttons
			$('div.bt_4 span').append(view.options);
			$('div.bt_4 div.open').append(view.traffic,view.parkings);
		},
		 hideAddressBar: function()
		{
			setTimeout(function(){
		    	window.scrollTo(0,1);
		  	},0);
		},
		 addButton: function() {
			/* create drawers */
			view.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}),
			view.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: ''
			});
			/* create buttons */
			view.traffic = $.ninja.button({
				html: 'Traffico'
				}),
			view.trafficSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			$(view.traffic).addClass("traffic-button")
			view.parkings = $.ninja.button({
				html: 'Parcheggi'
				}),
			view.parkingsSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			$(view.parkings).addClass("parkings-button")
		}
	}
	viewController.init();
};