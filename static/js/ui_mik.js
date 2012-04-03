jQuery(document).ready(function($){
	/* info */
	/* bookmark */
	/* means */
	/* options */
	uiController();
});
function uiController(){
	
	var options, optionsSelect, traffic, trafficSelect, ztl, self;
	
	var viewController = {
		init: function()
		{
			self = this;
			self.hideAddressBar();
			self.setSelectLayer();
		},
		setSelectLayer: function()
		{
			// create elements and their otions
			self.addButton();
			//append elements created to buttons
			$('div.bt_4 span').append(options);
			$('div.bt_4 div.open').append(traffic,ztl);
		},
		 hideAddressBar: function()
		{
			setTimeout(function(){
		    	window.scrollTo(0,1);
		  	},0);
		},

		 addButton: function() {
			/* create drawers */
			options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}),
			optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: ''
			});

			/* create buttons */
			traffic = $.ninja.button({
				html: 'Traffico'
				}),
			trafficSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			ztl = $.ninja.button({
				html: 'ZTL'
				}),
			ztlSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
		}
	}
	viewController.init();
}

