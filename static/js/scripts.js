var LocalSettings;

jQuery(function($){
	main();
});

function main()
{
	var ajaxurl = LocalSettings.WEBSITE_URL, self = null, view = null, dir = null, dircontrol = null, store = null, storecontrol = null, /*search = null, searchController = null,*/ layout = null, mainview = null, Program, ViewController, Directions, DirectionsViewController, SessionStorageController, SessionStorage, SetCenterOnMe, LayoutFixes, CombinedView, combined = null;
	
	Program = {
		map : null,
		d : null,
		objects : {},
		ZOOM: 12,
		clusterMaxZoom:16,
		mng: null,
		icons: {},
		icons_default_size:44,
		me: {},
		touch: false,
		is_not_touch: true,
		trafficLayer:null,
		trafficData:null,
		has_infobox_open:false,
		center_on_me:false,
		infoBox:null,
		init:function()
		{
			var o;
			self = this;
			self.hideAddressBar();
			self.touch = ( typeof window.Touch != 'undefined' ) ? window.Touch : false;
			self.is_not_touch = ( self.touch ) ?  false : true;
			self.me.RATIO = 2.07;
			self.me.RADIUS = 3000;
			self.me.startlat = 0;
			self.me.startlng = 0;
			self.ajax_populate();
			self.map = self.drawMap();
			self.geolocate_me();
			jQuery("#map_canvas").ajaxComplete(function(event)
			{
				o = self.fill_objects()
				self.mng = self.draw_markers(o);
				ViewController.init(self.mng);
				self.manageZoom(o, self.mng);
				MainViewController.init();
				DirectionsViewController.init(self.mng);
				SessionStorageController.init();
				SetCenterOnMe.init();
				LayoutFixes.init();
				CombinedView.init();
			});	
		},
		geolocate_me:function()
		{
			if (navigator.geolocation) {
				var current, watch;
				/*eventually if you want to store the original position */
				current = navigator.geolocation.getCurrentPosition(function(position) {
					startPos = position;
					self.me.startlat = startPos.coords.latitude;
					self.me.startlng = startPos.coords.longitude;
					self.me.startLocation = new google.maps.LatLng(self.me.startlat, self.me.startlng), size = self.map.getZoom();
				
				//	self.map.setCenter(startLocation);
				},
				function(error) {
					alert('Error occurred. Error code: ' + error.code);
				}
			);
			/*and then watch it change*/
			watch = navigator.geolocation.watchPosition(function(position) {
				self.me.lat = position.coords.latitude;
				self.me.lng = position.coords.longitude;
				self.me.currentLocation = new google.maps.LatLng(self.me.lat, self.me.lng)
				var size = self.map.getZoom(), image, circle_options;
				self.me.icon = LocalSettings.STATIC_URL+'images/me.png';
				image = new google.maps.MarkerImage(self.me.icon,null, null, null, new google.maps.Size(size, size*self.me.RATIO));
				
				if(typeof self.me.marker == 'undefined' && typeof self.me.circle == 'undefined' )
				{
					self.me.marker = new google.maps.Marker({
						position: self.me.currentLocation, 
						map: self.map, 
						title:"Here I am",
						icon:image,
						zIndex:google.maps.Marker.MAX_ZINDEX
					});
					circle_options = {
						strokeColor: "#FF0000",
						strokeOpacity: 0.4,
						strokeWeight: 2,
						fillColor: "#FF0000",
						fillOpacity: 0.2,
						map: self.map,
						center: self.me.currentLocation,
						radius: self.me.RADIUS / self.ZOOM
					};
					self.me.circle = new google.maps.Circle(circle_options);
				}
				else
				{
					self.me.marker.setPosition( self.me.currentLocation );
					self.me.circle.setCenter( self.me.currentLocation );
					self.me.circle.setRadius( self.me.RADIUS / self.map.getZoom() );
				}
				if( self.center_on_me )
				{
					self.map.setCenter( self.me.currentLocation );
				}
			},
				function(error) 
				{
					alert('Error occurred. Error code: ' + error.code);
				}, 
				{
					enableHighAccuracy:true, 
					maximumAge:10000, 
					timeout:10000
				});
			}
			else {
				alert('Geolocation is not supported for this Browser/OS version yet.');
			}
		},
		manageZoom: function(obj, mng)
		{
			google.maps.event.addListener(self.map, "zoom_changed", function() {
				var zoom = self.map.getZoom(), size = zoom * ( zoom / 10 );
				if( zoom <= self.ZOOM ) return false;
				
				
				// sets the new zoom for the user's icon
				image = new google.maps.MarkerImage(self.me.icon,null, null, null, new google.maps.Size(size, size*self.me.RATIO));
				self.me.circle.setRadius( self.me.RADIUS / zoom );
				self.me.marker.setIcon(image);
				
				// sets the new zoom for the assets icons if not clustered
			/*	for(var key in obj)
				{
					if( !obj.traffic )
					{
						p = self.switch_parameters(key);

						image = new google.maps.MarkerImage(self.icons[key],null, null, null, new google.maps.Size(size, size*p.ratio));
						for( var items in obj[key] )
						{
							obj[key][items].marker.setIcon(image);
						} //end for
					}
				} *///end for
			});
		},
		hide_managers:function(m)
		{
			$.each(m, function(key, value){
				if( "hide" in value )
				{
					value.hide();
				}
			});
		},
		drawMap:function()
		{
			var latlng = new google.maps.LatLng(45.07, 7.68), options = {
		      	backgroundColor: '#FFFFFF',
				zoom: self.ZOOM,
				navigationControl: false,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: latlng,
				mapTypeControl: false,
				panControl: self.is_not_touch,
			    panControlOptions: {
			        position: google.maps.ControlPosition.LEFT_CENTER
			    },
			    zoomControl: self.is_not_touch,
			    zoomControlOptions: {
			        style: google.maps.ZoomControlStyle.LARGE,
			        position: google.maps.ControlPosition.LEFT_CENTER
			    },
			    scaleControl: self.is_not_touch,
			    scaleControlOptions: {
			        position: google.maps.ControlPosition.LEFT_CENTER
			    },
			    streetViewControl: false,
			    streetViewControlOptions: {
			        position: google.maps.ControlPosition.LEFT_CENTER
			    }
		    };
			if( document.getElementById("map_canvas") )
			return new google.maps.Map(document.getElementById("map_canvas"), options);
		},
		fill_objects : function()
		{
			var /*index = 0, ratio = 1,*/ size = self.icons_default_size, p;
			
			for(var key in self.d)
			{
				var image;
				
				if( 'traffic' != key )
				{ 
					self.objects[key] = [];
					self.icons[key] = LocalSettings.STATIC_URL+'images/map_icons.png';
					
					p = self.switch_parameters(key);
					image = new google.maps.MarkerImage(
						LocalSettings.STATIC_URL+'images/map_icons.png',
						new google.maps.Size(size, size), 
						new google.maps.Point(p.icon,0), 
						new google.maps.Point(12,14)
						//new google.maps.Size(size, size*p.ratio)
					);
					$.each(self.d[key], function(items, values)
					{
						var current = {};
						current = self.d[key][items];
						current.type = key;
						current.icon_url = self.icons[key];
						current.marker = new google.maps.Marker({
							position: new google.maps.LatLng(current.lat, current.lng),
							title: current.name,
							icon: image,
							type: current.type,
							zIndex: p.index
						});
						current.has_infoBox = false;

						google.maps.event.addListener(current.marker, 'click', (function(o)
						{
							return function()
							{
								if( !o.has_infoBox )
								self.manage_info_box(o);
							}

						})(current));
							
							
							self.objects[key].push( current );
							delete current;
						});
					}
					else
					{
						self.d[key] = self.d[key];
					}
				}
				return self.objects;
			},
		manage_info_box:function(o)
		{
			var obj = o, infoBoxOptions, boxBox = document.createElement("div"), more = '<div class="more"></div>', bubble = '<span class="bubble"></span>', info = $('<div class="infoRow"></div>'), action = $('<div class="actionRow"></div>'), button, buttonSelect, parkings_info = $('<span class="parkings_info"></span>');
			//we create and append some html
			button = $.ninja.button({
				html: '',
				select:( dir == null || !dir.hasDirection ) ? false : true
				}).select(function(){
					if(!dir) Directions.init();
						if( !dir.hasDirection )
						{
							dir.calculateRoute(obj.lat, obj.lng);
						}
					//return false;
				}).deselect(function(){
					if( obj.has_infoBox && self.has_infobox_open ) self.infoBox.close();
					o.has_infoBox = false;
					self.has_infobox_open = false;
					view.removeMarkers();
					dir = null;
				}),
			buttonSelect = $.ninja.button({
				html: 'Selected',
				select: true,
			});
			
			info.text(obj.name);
			action.append(button);
			
			$(boxBox).append(more, info, action, bubble);
			
			//some options for our infoBox
			var infoBoxOptions = {
			                 content: boxBox
			                ,disableAutoPan: false
			                ,maxWidth: 200
			                ,pixelOffset: new google.maps.Size(-77, 42)
			                ,zIndex: null
			                ,closeBoxMargin: ""
			                ,closeBoxURL: ""
			                ,infoBoxClearance: new google.maps.Size(1, 1)
			                ,isHidden: false
			                ,pane: "floatPane"
			                ,enableEventPropagation: false
			                ,boxClass: "info_box"
			        };
			if( obj.type == 'parkings' )
			{
					parkings_info.text(' '+obj.free+" posti liberi su "+obj.total);
					info.append( parkings_info );
			}
			//and action!
			if( !obj.has_infoBox && !self.has_infobox_open )
			{
				self.infoBox = new InfoBox( infoBoxOptions );
				self.infoBox.open(self.map, obj.marker);
				obj.has_infoBox = true;
				self.has_infobox_open = true;
				google.maps.event.addListener(self.map, 'click', (function(o, i){
					return function()
					{
						o.has_infoBox = false;
						self.has_infobox_open = false;
						i.close();	
					}
				})(obj, self.infoBox));
			}
			
			return self.infoBox;
		},
		close_info_box:function()
		{
			if( self.has_infobox_open )
			{
				self.infoBox.close();
			}
		},
		switch_parameters : function(key)
		{
			var params = {};
			
			switch(key)
			{
				case 'hospitals':
				params.index = 1001;
				params.ratio = 1.5;
				params.cluster = 0;
				params.icon = 0;
				params.color = '#ff4927';
				break;
				case 'pharma':
				params.index = 1001;
				params.ratio = 1.5;
				params.cluster = 136;
				params.icon = 44;
				params.color = '#1b3e94';
				break;
				case 'parkings':
				params.index = 1000;
				params.ratio = 1.5;
				params.cluster = 90;
				params.icon = 90;
				params.color = '#17c05f';
				break;
				case 'traffic':
				params.index = 999;
				params.ratio = 0.92;
				params.cluster = 0;
				params.icon = 108;
				params.color = '#000';
				break;
				case 'veterinarians':
				params.index = 999;
				params.ratio = 0.92;
				params.cluster = 44;
				params.icon = 136;
				params.color = '#00a4e8';
				break;
			}
			return params;
		},
		draw_markers : function(obj)
		{
			var mgr = {}, markers = {};

			if(!obj) return false;

			self.trafficLayer = new google.maps.TrafficLayer();
			//self.trafficLayer.setMap(self.map);
			self.trafficData = obj.traffic;
			obj.traffic = self.trafficLayer;

			for(var key in obj)
			{
				var styles, params = self.switch_parameters(key);

				if( key != 'traffic')
				{
					styles = [{
						url : LocalSettings.STATIC_URL+'images/map_clusters.png',
						height: 44,
						width: 44,
						backgroundPosition: [params.cluster,0],
						//	anchorIcon: [200,0],
						//	anchor: [12,30],
						textColor: '#000',
						textSize: 11,
						fontWeight: 700,
						textColor: params.color
						}];

						//sets MarkerClusters for each group 
						mgr[key] = new MarkerClusterer(self.map, [], {styles : styles, maxZoom:self.clusterMaxZoom});
						
						mgr[key].setTitle(key);
						
						markers[key] = [];

						$.each(obj[key], function(item, value)
						{
							markers[key].push(value.marker);
						});

						mgr[key].addMarkers(markers[key]);
					}
					else
					{
						mgr[key] = obj.traffic;
					}
				}
				//set the data to data object and substitutes layer to data in obj array
				return mgr;
			},
		ajax_populate: function()
		{
			var obj = {'do' : 'something'};
			
			$.ajax({  
				type: 'post',
				async: true,  
				url: ajaxurl,  
				data: {data: JSON.stringify(obj) },
				dataType: 'json',
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{  
					alert( textStatus, errorThrown );
				},
				beforeSend: function(XMLHttpRequest) 
				{ 
					if (XMLHttpRequest && XMLHttpRequest.overrideMimeType) 
					{
						XMLHttpRequest.overrideMimeType("application/j-son;charset=UTF-8");
					}
				}, 
				success: function( response, textStatus, jqXHR )
				{
					if( response )
					{
						self.d = self.parseResponse(response)
					}
				},
				complete: function( data, textStatus )
				{
					self.loader_hide();
				}
			});
		},
		parseResponse:function(r)
		{
			var inner = {}, response = r, tmp;
			tmp = $.extend(true, {}, response);
			for(var key in tmp){
					inner[key] = $.map(tmp[key], function(v, k){
					if( v.hasOwnProperty('fields') )
					{
						return v.fields;
					}
					else
					{
						return v;
					}
				});
			}
			return inner;
		},
		loader_hide:function()
		{
			$("div#loading-gif").hide();
		},
		loader_show:function()
		{
			$("div#loading-gif").show();
		},
		hideAddressBar: function()
		{
			setTimeout(function(){
					if( self.touch )
					{
						window.scrollTo(0,1);
					}
			},0);
		},	
	};
	ViewController = {
		options:null,
		optionsSelect:null,
		disabled:null, 
		dialogs_open:[],
		clear_button:null,
		rows_selected:[], // push menu elements here if you want them to be deselected when another element is selected
		init: function(mng)
		{
			view = this;
			view.mngs = mng;
			view.buttons = [];
			view.setSelectLayer();
		},
		setSelectLayer: function()
		{
			// create elements and their options
			view.addButton();
			//append elements created to buttons
			$('div.bt_4 span').append(view.options);
			$('div.bt_4 span .open').append(view.clear_button);
		},
		addButton: function() {
			/* create drawers */
			view.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: '',
			}).select(function(event){
					view.controlOtherDrawers(this,  event.target);
				}).deselect(function(event){
					view.controlOtherDrawers(this,  event.target);
				}),
			view.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: 'Selected'
			});		
			view.options.addClass("hide-show-layers");
			
			view.clear_button = $.ninja.button({
				html: 'Svuota'
			}).select(function(){
				view.removeMarkers();
				if( mainview.is_combined )
					mainview.combinedHide();
				view.purge_open( view.options );
				view.purgeCssClass( $(this) );
				mainview.listDialog.detach();
			});
			view.rows_selected.push( view.clear_button );
		},
		removeMarkers:function()
		{
			if( dir && dir.hasDirection )
			{
				if( dir.wmarkers.length ) 
				{
					for(var i=0;i<dir.wmarkers.length;i++) dir.wmarkers[i].setMap(null);
				}
				dir.destroy();
			}
		},
		controlOtherDrawers:function( d, t )
		{
			var drawer = d, target = t;
			
			if( $(target).parent().attr('class') != $(drawer).attr('class') ) return;
			
			if( view.dialogs_open.length == 1 )
			{
				if( view.dialogs_open[0] == drawer )
				{
					view.dialogs_open = [];
				}
				else
				{
					$( view.dialogs_open[0] ).children(".nui-try").slideUp('fast', function(){
						$(this).prev().removeClass('nui-slc');
						view.dialogs_open = [];
						view.dialogs_open.push( drawer );
					});
				}
			}
			else
			{
				view.dialogs_open.push( drawer );
			}	
		},
		purge_open:function(el)
		{
			$(el).children(".nui-try").slideUp('fast', function(){
				$(this).prev().removeClass('nui-slc');
				view.dialogs_open = [];
			});
		},
		purgeCssClass:function(el)
		{
			var elements = view.rows_selected;
			$.each(elements, function(key, value){
				if(value != el)
				{
					value.removeClass('nui-slc');
				}
			});
		},
		listGenericDialog:function( content )
		{
			var container = $.ninja.dialog({
				html: ''
			}).detach(function () {
				
			}).attach(function(){
				$(this).append(content);
			});
			container.addClass("places-show-data");
			return container;
		}
	};
	Directions = {
		directionsService: new google.maps.DirectionsService(),
		directionDisplay:null,
		origin:null,
		destination:null,
		request:{},
		hasDirection:false,
		mode: google.maps.DirectionsTravelMode.DRIVING,
		waypoints:[],
		wmarkers:[],
		init:function()
		{
			dir = this;
			dir.save = null;
			dir.setRenderer();
		},
		destroy:function()
		{
			dir.directionDisplay.setMap(null);
		    dir.directionDisplay.setPanel(null);
			dircontrol.isSearchingForDirection = false;
			dir.hasDirection = false;
			dir.setRenderer();
		},
		setRenderer:function()
		{
			dir.directionDisplay = null;
			dir.directionDisplay = new google.maps.DirectionsRenderer();
		    dir.directionDisplay.setMap(self.map);
			dir.directionDisplay.setPanel( document.getElementById('directions-panel') );
			dir.directionDisplay.setOptions({
				draggable:false,
				markerOptions:{
					visible:false
				},
				polylineOptions:{
					strokeColor:"#0000ff",
					strokeOpacity:0.5,
					strokeWeight:6
				}
			});
		},
		calculateRoute:function(lat, lng, org, w, w_d, d, is_store, org_item )
		{
			var origin, request, waypoints, waypoints_data, dest = d, is_s = ( !is_store || typeof is_store == 'undefined') ? false : true, destination = new google.maps.LatLng(lat, lng);
			// if a route is already plotted please erase.
			
			self.loader_show();
			
			if( dir.hasDirection ) dir.destroy();
			
			origin = ( org ) ? org : self.me.currentLocation;
			
			origin_item = org_item;

			waypoints = ( w ) ? w : [];
			waypoints_data = ( w_d ) ? w_d : [];
			dest = ( d ) ? d : false;
			
			request = {
				origin: origin,
				destination: destination,
				travelMode: dir.mode,
				provideRouteAlternatives:true,
				waypoints:waypoints,
				optimizeWaypoints:true
			};
			
			//console.log( waypoints, request );
			
			if( is_s ) dir.directionDisplay.setOptions({
					markerOptions:{
						visible:true
					}
				});
				dir.directionsService.route(request, function(response, status) {
					if (status == google.maps.DirectionsStatus.OK) {
						self.loader_hide();
						dir.directionDisplay.setDirections(response);
						dir.hasDirection = true;
						dir.save = {};
						dir.save.start_lat = origin.lat();
						dir.save.start_lng = origin.lng();
						dir.save.end_lat = destination.lat();
						dir.save.end_lng = destination.lng();
						dir.save.waypoints = waypoints;
					}
				else if( status == google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED)
				{
					alert("Il massimo numero di fermate (8) "+ unescape('%E8') +" stato raggiunto!");
				}
			    });
				if( !is_s )
				dir.markers_printer(waypoints, waypoints_data, dest, origin_item  );
		},
		markers_printer:function( wp, waypoints_data, d, o )
		{
			var w = wp, marker = [], w_d = waypoints_data, dest = d, origin = o;
			dir.wmarkers = [];
			
			if( dest && dest.marker ) 
			{
				dest.marker.setMap(self.map);
				dir.wmarkers.push(dest.marker);
				console.log( dir.wmarkers, dir.wmarkers.length)
			}
			
			//if( !w || w.length == 0 ) return false;
			
			for( var i in w_d )
			{
				if( typeof w_d[i].marker != 'undefined')
				{
					w_d[i].marker.setMap(self.map);
					dir.wmarkers.unshift( w_d[i].marker );
					console.log( dir.wmarkers, dir.wmarkers.length)
				}	
			}
			
			if( origin )
			{
				dir.wmarkers.setMap(self.map);
				dir.wmarkers.unshift( origin.marker );
				console.log( dir.wmarkers, dir.wmarkers.length)
			}
		},
		switchMode:function(val)
		{
			switch(val)
			{
			    case 1:
			        dir.mode = google.maps.DirectionsTravelMode.DRIVING;
			        break;
			    case 2:
			        dir.mode = google.maps.DirectionsTravelMode.WALKING;
			        break;
				default:
					dir.mode = google.maps.DirectionsTravelMode.DRIVING;
					break;
			}
		}
	};
	DirectionsViewController = {
		options: null,
		optionsSelect:null,
		button:null,
		isSearchingForDirection:false,
		isCar:null,
		isCarSelect:null,
		isFeet:null,
		isFeetSelect:null,
		dialog:null,
		mngs:null,
		buttons:[],
		mng:{},
		init: function(mng)
		{
			dircontrol = this;
			dircontrol.mngs = mng;
			dircontrol.setSelectLayer();
			dircontrol.enableDisableLayerView();
		},
		setSelectLayer: function()
		{
			dircontrol.addButton();
			$('div.bt_5 span').append(dircontrol.options);
			$('div.bt_5 div.open').append(/*dircontrol.isBike, */dircontrol.isCar, dircontrol.isFeet, dircontrol.isMore);
		},
		addButton: function()
		{		
			dircontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).select(function(event){
				if( !dir ) Directions.init();
				dircontrol.isSearchingForDirection = true;
				view.controlOtherDrawers(this,  event.target);
			}).deselect(function(event){
				dir.destroy();
				view.controlOtherDrawers(this,  event.target);
			}),
			dircontrol.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: 'Selected'
			});
			dircontrol.options.addClass('directions-control-button');

			dircontrol.isCar = $.ninja.button({
				html: 'Auto',
				select:true
				}).select(function(){
					view.purgeCssClass( dircontrol.isCar );
					dir.switchMode(1);
					return false;
				}).deselect(function(){
					dir.switchMode(1);
					return false;
				}),
			dircontrol.isCarSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			
			view.rows_selected.push( dircontrol.isCar );
			
			dircontrol.isFeet = $.ninja.button({
				html: 'Piedi'
				}).select(function(){
					view.purgeCssClass( dircontrol.isFeet );
					dir.switchMode(2);
					return false;
				}).deselect(function(){
					dir.switchMode(1);
					return false;
				}),
			dircontrol.isFeetSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			
			view.rows_selected.push( dircontrol.isFeet );
			
			dircontrol.isMore = $.ninja.button({
				html: 'Opzioni percorso'
				}).select(function(){			
					$(this).removeClass('nui-slc');
					view.purge_open( dircontrol.options );
					dircontrol.dialog.attach();
					return false;		
				}).deselect(function(){
					return false;
				}),
			dircontrol.isMoreSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});	
			
			view.rows_selected.push( dircontrol.isMore );
		},
		enableDisableLayerView:function()
		{
			dircontrol.dialog = $.ninja.dialog({
               html: ''
           }).detach(function () {
	       		$('.nui-dlg span.title').remove();
	       		$('.nui-dlg').prepend($('.nui-dlg .close .nui-icn'));
       		   	$('.nui-dlg .close').remove();
           }).attach(function(){
               	$('.nui-dlg').css({'width':$(window).width()-20,'top':'10','left':'10'}).prepend('<span class="title"><h2>Opzioni percorso<h/h2></span>');
	
	           	$('.nui-dlg').append('<span class="close"><span>Chiudi</span></span>');
	           	$('.nui-dlg .close').prepend($('.nui-dlg img.nui-icn'));
           });
			
			dircontrol.dialog.addClass("dircontrol");
			dircontrol.addButtons();
			
			$.each(dircontrol.buttons, function(key, value)
			{
				for( var key in value)
				{
					
					$(dircontrol.dialog).append( value[key].el );
				}
			});
		},
		addButtons:function()
		{
			var count = 0/*, cluster*/;

			$.each(dircontrol.mngs, function(key, value){
				self.mng[key].mng = value;
				dircontrol.buttons[count] = {};
				dircontrol.buttons[count][key] = {};
				dircontrol.buttons[count][key].name = key;
				dircontrol.buttons[count][key].el = $.ninja.button({
					html: dircontrol.buttons[count][key].name,
					select: !( 'hide' in self.mng[key].mng )
					}).deselect(function(){
						if( 'hide' in self.mng[key].mng )
						{
							self.trafficLayer.hide();
						}
						else
						{
							self.mng[key].cluster = self.mng[key].mng.getMarkers()
							self.mng[key].mng.clearMarkers();
						}

					}).select(function(){
						if( 'hide' in self.mng[key].mng)
						{
							self.trafficLayer.setMap(self.map);
						}
						else
						{
							self.mng[key].mng.addMarkers(self.mng[key].cluster);
							self.mng[key].mng.repaint();
						}
					}),
				dircontrol.buttons[count][key].sel = $.ninja.button({
					html: 'Selected',
					select: false
				});
				$(dircontrol.buttons[count][key].el).addClass(dircontrol.buttons[count][key].name+"-button");
				count++;
			});
		},
		hideMngsAndDeselect:function()
		{
			for( var i in dircontrol.buttons )
			{
				for(var key in dircontrol.buttons[i] )
				{
					$(dircontrol.buttons[i][key].el).removeClass('nui-slc');
					
					if( typeof self.mng[key] != 'undefined' )
					{
						if( 'hide' in self.mng[key].mng )
						{
							self.trafficLayer.hide();
						}
						else
						{
							self.mng[key].cluster = self.mng[key].mng.getMarkers()
							self.mng[key].mng.clearMarkers();
						}
					}
				}
			}
		},
		showMangsAndSelect:function()
		{
			for( var i in dircontrol.buttons )
			{
				for(var key in dircontrol.buttons[i] )
				{
					$(dircontrol.buttons[i][key].el).removeClass('nui-slc');
					
					if( 'hide' in self.mng[key].mng )
					{
						self.trafficLayer.hide();
					}
					else
					{
						self.mng[key].cluster = self.mng[key].mng.getMarkers()
						self.mng[key].mng.clearMarkers();
					}
				}
			}
		}
	};
	SessionStorageController = {
		options:null,
		optionsSelect:null,
		saveData:null,
		saveDataSelect:null,
		displayData:null,
		displayDataSelect:null,
		saveData_div:null,
		init:function()
		{
			storecontrol = this;
			storecontrol.setSelectLayer();
			SessionStorage.init();
		},
		setSelectLayer: function()
		{
			storecontrol.addButton();
			$('div.bt_2 span').append(storecontrol.options);
			$('div.bt_2 div.open').append(storecontrol.displayData, storecontrol.saveData);
		},
		addButton:function()
		{
			storecontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).deselect(function(event){
				view.controlOtherDrawers(this,  event.target);
			}).select(function(event){
				view.controlOtherDrawers(this,  event.target);
			}),
			storecontrol.optionsSelect = $.ninja.drawer({
				html: '',
				value: 'Selected'
			});
			storecontrol.saveData = $.ninja.button({
				html: 'Salva'
				}).select(function(){
					storecontrol.saveData_div = store.saveData(storecontrol.saveData);
					
				}).deselect(function(){
					store.removePanel();
				}),
			storecontrol.saveDataSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			storecontrol.displayData = $.ninja.button({
				html: 'Carica'
				}).select(function(){
					store.getData(storecontrol.saveData);
					view.purge_open(storecontrol.options);
					dircontrol.hideMngsAndDeselect();
				}).deselect(function(){
					
				}),
			storecontrol.displayDataSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
		}
	};
	//despite of the name it uses localStorage object
	SessionStorage = {
		input:null,
		button:null,
		has_form:false,
		stored:[],
		init: function()
		{
			store = this;
			
			if( !store.has_storage() )
			{
				alert("Il browser non supporta web storage, i dati non possono essere salvati");
				return false;
			}
		},
		has_storage:function()
		{
			//session & local check
			if(window.sessionStorage && window.localStorage)
			{
				return true;
			}
			return false;
		},
		saveData:function(button)
		{
			if( dir && dir.save )
			{
				//do you stuff here
			
				return store.appendFormAndSave();
			}
			else
			{
				$(button).removeClass('nui-slc');
				alert("Costruisci un percorso!");
				return false;
			}
		},
		appendFormAndSave:function()
		{
			var wrap = $('<div id="wrap_combined_inputs_save"></div>');
			store.input = $('<input type="text" name="save_path_name" value="Nome percorso" id="save_path_name" />');
			store.saveButton = $('<button type="button" id="save_path" value="Salva" />');
			
			if( !store.has_form )
			{
				wrap.append(store.input, store.saveButton);
				
				$(storecontrol.saveData).parent().append(wrap);
					wrap.slideDown(400, function(){
						store.has_form = true;
					});
			
				store.input.click(function(){
					$(this).val('');
				});
			}	
			store.saveButton.click(function(){
				if( store.input.val() == "Nome percorso" || store.input.val() == '')
				{
					alert("Dai un nome al tuo percorso "+store.input.val());
					return false;
				}
				else
				{
					try
					{
						window.localStorage.setObject( store.input.val(), dir.save );
						alert("Il percorso "+ store.input.val() + " " + unescape('%E8') + " stato salvato");
					}
					catch(error)
					{
						alert(error);
					}
					finally
					{
						store.removePanel();
					}	
				}
			});
			return wrap;
		},
		getData:function(button)
		{
			var container, row, shown = false, del, txt;
			
			container = $.ninja.dialog({
				html: ''
			}).detach(function () {
				storecontrol.displayData.removeClass('nui-slc')
			});

			container.addClass("locations-saved-list").append('<span class="title"><h2>I miei percorsi</h2></span>');

			if( store.has_storage() && window.localStorage.length)
			{
				var len = window.localStorage.length;
				
				container.attach().hide();
				
				for(var i=0; i<len;i++)
				{
					store.stored[i]={};
					store.stored[i].key = window.localStorage.key(i);
					store.stored[i].obj = window.localStorage.getObject( store.stored[i].key );
					row = $('<div class="row" />'), del = $('<span class="store_delete"></span>'), txt = $('<span class="store_text"></span>');
					if( !shown )
					{
						txt.text(store.stored[i].key);
						row.append(txt, del);
						container.append( row ).slideDown(400, function(){
							shown = true;
						});
						txt.bind('click', {index:i}, function(event){
							if(!dir) Directions.init();
							var i = event.data.index, o = new google.maps.LatLng(store.stored[i].obj.start_lat, store.stored[i].obj.start_lng);
							dir.calculateRoute( 
								store.stored[i].obj.end_lat, 
								store.stored[i].obj.end_lng, 
								o,
								store.parseWaypoints(store.stored[i].obj.waypoints),
								false,
								false,
								true
								);
						});
						del.bind('click', {index:i, 'row':row}, function(event){
							
							var i = event.data.index, r = event.data.row;
							try
							{
								res = store.deleteStore(store.stored[i].key);
							}
							catch(e)
							{
								alert(e);
								return false;
							}
							r.slideUp(300, function(){
								$(this).remove();
							});
						});
					}
				}
				
				$('.nui-dlg').css({'width':$(window).width()-20,'top':'10','left':'10'});
				
				setTimeout(function(){ //must wait for the anim to end!
					$('.nui-dlg').css('height',$(window).height()-20);
					$('.nui-dlg').append('<span class="close"><span>Chiudi</span></span>');
		           	$('.nui-dlg .close').prepend($('.nui-dlg img.nui-icn'));
				},1000);
			}
			else
			{
				alert("Non ci sono percorsi salvati");
			}
		},
		deleteStore:function(key)
		{
			var k = key;
			//console.log( k );
			window.localStorage.removeItem(k);
		},
		parseWaypoints:function(waypoints)
		{
			var w = waypoints, ar = [];
			
			$.each(w, function(key, value){
				var lat = value.location.$a, lng = value.location.ab;
				ar.push({ 
					'location':new google.maps.LatLng( lat, lng ),
					'stopover':true,
				});
			});
			return ar;
		},
		removePanel:function()
		{
			storecontrol.saveData_div.slideUp(400, function(){
				store.has_form = false;
				$(this).remove();
				storecontrol.saveData.removeClass('nui-slc');
			});
		}
	};
	SetCenterOnMe = {
		options:null,
		optionsSelect:null,
		init:function()
		{
			setcenteronme = this;
			setcenteronme.setSelectLayer();
		},
		setSelectLayer: function()
		{
			setcenteronme.addButton();	
			$('div.bt_1 span').append(setcenteronme.options);
		},
		addButton:function()
		{
			//add html:'<div class="open"></div>' to have a placeholder for submenu items
			setcenteronme.options = $.ninja.button({
				html: '',
				value: ''
			}).select(function(){
				self.center_on_me = true;
			}).deselect(function(){
				self.center_on_me = false;
			}),
			setcenteronme.optionsSelect = $.ninja.button({
				html: '',
				value: 'Selected'
			});
		}
	};
	MainViewController = {
		options:null,
		optionsSelect:null,
		displayMap:null,
		displayMapSelect:null,
		displayList:null,
		displayListSelect:null,
		displayTwin:null,
		displayTwinSelect:null,
		listDialog:null,
		dialog_open:null,
		div:$("#working-panel"),
		map_div:$("#map_canvas"),
		is_combined: false,
		init:function()
		{
			mainview = this;
			mainview.setSelectLayer();
			mainview.listView();
		},
		setSelectLayer: function()
		{
			mainview.addButton();
			$('div.bt_3 span').append(mainview.options);
			$('div.bt_3 div.open').append(mainview.displayMap, mainview.displayList, mainview.displayTwin);
		},
		addButton:function()
		{
			mainview.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).deselect(function(event){
				view.controlOtherDrawers(this,  event.target);
			}).select(function(event){
				view.controlOtherDrawers(this,  event.target);
			}),
			mainview.optionsSelect = $.ninja.drawer({
				html: '',
				value: 'Selected'
			});
			mainview.displayMap = $.ninja.button({
				html: 'Mappa',
				select:true
				}).select(function(){
					if( mainview.is_combined) mainview.combinedHide();
					view.purgeCssClass( mainview.displayMap );
					mainview.closeDialog();
				}).deselect(function(){
					
				}),
			mainview.displayMapSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			view.rows_selected.push( mainview.displayMap );
			
			mainview.displayList = $.ninja.button({
				html: 'Lista'
				}).select(function(){
					if( dir && dir.hasDirection )
					{
						if( mainview.is_combined) mainview.combinedHide();
						view.purgeCssClass( mainview.displayList );
						mainview.listDialog.attach();
					}
					else
					{
						alert("Crea un percorso per visualizzarne i passi");
						$(this).removeClass('nui-slc');
					}
				}).deselect(function(){
					
				}),
			mainview.displayListSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			view.rows_selected.push( mainview.displayList );
			
			mainview.displayTwin = $.ninja.button({
				html: 'Combined'
				}).select(function(){
					view.purgeCssClass( mainview.displayTwin );
					mainview.closeDialog();
					mainview.combinedView();
				}).deselect(function(){
					mainview.combinedHide();
				}),
			mainview.displayTwinSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			view.rows_selected.push( mainview.displayTwin );
		},
		closeDialog:function()
		{
			if( mainview.dialog_open )
			{
				mainview.listDialog.detach();
			}
		},
		combinedShow:function(d)
		{
			var has_dir = d;
			dircontrol.hideMngsAndDeselect();
			mainview.div.slideDown(function(){
				mainview.map_div.css('height', '50%');
				mainview.is_combined = true;
				if( has_dir )
				{
					dir.directionDisplay.setPanel(this);
				}
				else
				{
					combined.makeForm();
				}
			});
		},
		combinedHide:function()
		{
			mainview.map_div.css('height', '100%');
			mainview.div.slideUp(function(){
				mainview.is_combined = false;
				mainview.displayTwin.removeClass('nui-slc');
				if( combined.has_sortable) combined.sortable.sortable("destroy");
				$(this).empty();
			});
		},
		combinedView:function()
		{
			if( dir && dir.hasDirection )
			{
				mainview.combinedShow(true);
			}
			else
			{
				mainview.combinedShow(false);
			}
			view.purge_open(mainview.options);
		},
		listView:function()
		{
			mainview.listDialog = $.ninja.dialog({
				html:''
			}).detach(function(){
				mainview.dialog_open = false;
			}).attach(function(){
				mainview.dialog_open = true;
				if( dir && dir.hasDirection )
				{
					dir.directionDisplay.setPanel(this);
					view.purge_open( mainview.options );
					view.purgeCssClass( $(this) );
				}
			});
		}	
	};
	CombinedView = {
		origin:null,
		destination:null,
		o_input:null,
		d_input:null,
		w_inputs:null,
		wrp:null,
		add_button:null,
		save_buton:null,
		b_count:0,
		waypoints:false,
		items:null,
		request:false,
		has_sortables:false,
		sortable:null,
		dictionary:null,
		init:function()
		{
			combined = this;
		},
		makeForm:function()
		{
			var working_panel = $('#working-panel');
			
			combined.dictionary = combined.makeDictionary();
			
			//reset some variables 
			combined.has_sortables = false;
			combined.w_inputs = [];
			combined.waypoints = [];
			combined.request = {};
			
			combined.wrp = $('<div id="wrap_combined_inputs"></div>');
			working_panel.append(combined.wrp);
			
			combined.w_inputs[0] = combined.o_input = combined.printInput( true, true );
			combined.o_input.attr('id', 'id_'+0);
			combined.w_inputs[1] = combined.d_input = combined.printInput( false, true );
			combined.d_input.attr('id', 'id_'+1)/*.parent().addClass('ui-state-default')*/;

			combined.add_button = $('<span class="button_wrapper"><input type="button" id="add_input" name="add_input" value="add" /></span>');

			combined.save_buton = $('<input type="button" id="save_input" name="save_input" value="save" />');
			
			combined.wrp.append( combined.o_input, combined.add_button, combined.d_input, combined.save_buton );
			
			combined.wrp.fadeIn(function(){
				combined.save();
			});
			
			combined.deleteBox();
			combined.addInput();
		},
		addInput:function()
		{
			combined.add_button.bind('click', function(event){
				var len = combined.w_inputs.length;
				combined.w_inputs[len] = combined.w_inputs[len-1]
				combined.w_inputs[len-1] = combined.printInput( false, true );
				combined.w_inputs[len-1].data('related', null);
				if( len == 2 )
				{
					$(combined.w_inputs[0]).after( combined.w_inputs[len-1] );
				}
				else
				{	
					$('#id_'+(len-2) ).after( combined.w_inputs[len-1] );
				}
				$(combined.w_inputs[len-1]).prop('id', 'id_'+(len-1) );
				$(combined.w_inputs[len]).removeProp('id');
				$(combined.w_inputs[len]).attr('id', 'id_'+len );
				combined.deleteBox();
				////console.log( "len after"+combined.w_inputs.length );	
			});
			$('#working-panel').css({'display':'-webkit-box'});
		},
		makeWayPointsSortable:function(element, container)
		{
			var c = ( typeof container == 'undefined' ) ? combined.wrp : container, el = element, sort = null, tmp = [];
			//check if container is sortable already, if not make it so
			if( !$(c+':data(sortable)').length )
			{
				sort = c.sortable({
				   create: function(event, ui) { 
						combined.has_sortables = true;
					},
					start: function (event, ui) {
							tmp = $.extend(true, [], combined.w_inputs);
							
							$('span.ui-state-default').each(function(key, val){
								$(val).data( 'startindex', key );
								////console.log( "on start ".key, $(val).data( 'startindex'), $(combined.w_inputs[key]).data('related').name, $(val).data('related') );
							});
							
				    },
					update:function(event, ui)
					{
						combined.w_inputs = [];
						
						$('span.ui-state-default').each(function(key, val){
							////console.log( key, $(val).data( 'startindex') );
							combined.w_inputs[key] = tmp[ $(val).data( 'startindex') ];
							$(combined.w_inputs[key]).removeProp('id');
							//////console.log( $(combined.w_inputs[key]).attr('id') )
							combined.w_inputs[key].prop( 'id', 'id_'+key );
							//////console.log( key, $(val).data( 'startindex') )
							////console.log( " ends "+$(combined.w_inputs[key]).data('related').name+" "+ $(val).data( 'startindex') +" ->>> "+ key);
						});
					}
				});
				c.sortable( "option", {
					'items':'span.ui-state-default',
					'cursor':'move',
					'handle':'div.drag_handle',
					'placeholder': 'ui-state-highlight'
				}).disableSelection();
			}
			c.sortable('refresh');
			return sort;
		},
		makeDictionary:function()
		{
			var data, arr;
			
			data = $.extend(true, {}, self.d);
			
			delete data.traffic;
			delete data.parkings;
			
			arr = $.map(data, function (item, i){
				return item;
			});
			
			delete data;
			return arr;
		},
		printInput:function( d, s )
		{
			var my, def = ( typeof d == 'undefined' || d == false ) ? false : d, sort = ( typeof s == 'undefined' || s == false ) ? false : s, delete_handle = $('<div class="delete_handle"></div>'), drag_handle = $('<div class="drag_handle"></div>'), details = $('<div class="details">');
			
			my = $.ninja.autocomplete({
			  placeholder: ( !def ) ? 'Cerca servizio' : 'Current location'
			}).values(function (event) {
			      my.list({
			        values: $.map(combined.dictionary, function (item, i) {
						if( item.name.hasIn(event.query) )
						{
							return {
								html: item.name,
								value: item.name,
								select:function()
								{
									my.data('related', item);
									details.unbind('click');
									combined.showDetails(details, my.data('related') );
								}
						}
			          };
			        }),
			        query: event.query
			      });
			});
			
			my.append( delete_handle, drag_handle, details );
			
			if( sort && my )
			{
				my.addClass('ui-state-default');
				combined.makeWayPointsSortable( my );
			}
			
			if( def )
			{
				////console.log( self.me.currentLocation );
				my.data('related', 'current');
				////console.log( my.data('related') );
			}
			else
			{
				my.data('related', null);
			}
			
			combined.showDetails(details, my.data('related') );
			
			return my;
		},
		deleteBox:function()
		{
			var elements = $('.delete_handle');

			$.each(elements, function(i, v){

				var el = $(v);
				//keep at least origin and destination
				if( combined.w_inputs.length <= 2 )
				{
					el.css('display', 'none');
				} 
				else
				{
					el.css('display', 'block');
				}
				//don't make a mess 
				el.unbind('click');
				//and bind only if necessary
				if( combined.w_inputs.length > 2 )
				{
					el.bind('click', function(event){
						var len = combined.w_inputs.length, i = $(event.target).parent().index(), index = ( len ==  i ) ? i-1 : i;
						//remove from array
						combined.w_inputs.remove(index);
						$(event.target).parent().slideUp(200, function(){
							//remove from dom	
							$(this).remove();
							//reorder others
							$('span.ui-state-default').each(function(key, val){
								$(val).removeAttr('id');
								
								$(val).prop( 'id', 'id_'+key );
								
								combined.w_inputs[key] = $(val);
								
								if( combined.w_inputs.length <= 2 )
								{
									$(val).children('.delete_handle').fadeOut(200);
								} 
								else
								{
									$(val).children('.delete_handle').css('display', 'block');
								}
							});
							
							
						});

					});
				}
			});
		},
		showDetails:function(el, data)
		{
				var content, dialog;
				
				el.bind('click', {item:data}, function(event){
					var item = event.data.item;
					if( null != item )
					{
						if( 'name' in item )
						{
							content = item.address+", "+item.cap+", "+item.town+", "+item.phone;
							combined.attachListDialog(content);
						}
						else
						{
							var geo = new google.maps.Geocoder();
							var latlng = new google.maps.LatLng( item.$a, item.ab );
							geo.geocode({'latLng': latlng}, function(results, status) {
								if (status == google.maps.GeocoderStatus.OK) {
									if (results[0]) {
										content = results[0].formatted_address;
										combined.attachListDialog(content);
									}
								}
							});
						}
					}
					else
					{
						alert( "Seleziona una destinazione per visualizzarne i dettagli")
					}
				});
		},
		attachListDialog:function(c)
		{
			var content = c;
			dialog = view.listGenericDialog(content);
			dialog.attach();
			return dialog;
		},
		switchOriginAndDestination: function(d)
		{
			var r = false, sw = d;
			
			if( sw == null) return r;
			
			switch(typeof sw)
			{
				case 'object':
					if( 'name' in sw )
					{
						r = new google.maps.LatLng( sw.lat, sw.lng );
					}
					else
					{
						r = new google.maps.LatLng( sw.$a, sw.ab );
					}
				break;
				case 'string':
					if( sw == 'current' )
					{
						r = new google.maps.LatLng( sw.$a, sw.ab );
					}
				break;
			}
			return r;
		},
		save:function()
		{
			combined.save_buton.bind('click', {d:null}, function(event){
				
				var done = false, len = combined.w_inputs.length, last = len - 1, wp, wp_items = [], org_item;
				//debug
				////console.log( len );
				
				$.each(combined.w_inputs, function(key, val){
					////console.log("Line ::: "+key, $(val).data('related').name);
				});
				
				combined.request.origin = ( combined.w_inputs[0].data('related') ) ?  combined.switchOriginAndDestination( combined.w_inputs[0].data('related') ) : self.me.currentLocation;
				
				combined.request.destination = combined.switchOriginAndDestination( combined.w_inputs[last].data('related') );
				
				if( !combined.request.origin )
				{
					alert("Seleziona un punto di partenza!");
					done = false;
					return done;
				}
				if( !combined.request.destination )
				{
					alert("Seleziona una destinazione!");
					done = false;
					return done;
				}
				
				////console.log( "o "+combined.w_inputs[0].data('related').name )
				////console.log( "last "+combined.w_inputs[last].data('related').name )
				
				wp = $.extend(true, [], combined.w_inputs);
				
				wp.pop();
				wp.shift();
				
				if( !wp.length )
				{
					done = true
				}
				else
				{
					$.each(wp, function(key, value){
						
						
						
						if( typeof value.data('related') == 'object' )
						{
							////console.log( "w "+key+""+value.data('related').name );
							combined.waypoints.push({ 
								'location':new google.maps.LatLng( value.data('related').lat, value.data('related').lng ),
								'stopover':true,
							});
							wp_items.push( value.data('related') );
							done = true;
						}
						else if( value.data('related') == 'current' )
						{
							combined.waypoints.push({ 
								'location':combined.switchOriginAndDestination('current'),
								'stopover':true,
							});
							wp_items.push( value.data('related') );
							done = true;
						}
						else
						{
							//stop execution if not all waypoints have an address
							combined.waypoints = [];
							wp_items = [];
							done = false;
							alert("Completa la compilazione delle fermate");
							return false;
						}

					});
				}
				//stop execution if not all waypoints have an address
				if(!done) return false;
				
				combined.request.waypoints = ( combined.waypoints ) ? combined.waypoints : [];
				
				org_item = ( combined.request.origin == self.me.currentLocation )? false : combined.request.origin; 
				
				if(!dir) Directions.init();
				
				dir.calculateRoute(
					combined.request.destination.lat(),
					combined.request.destination.lng(),
					combined.request.origin,
					combined.waypoints,
					wp_items,
					combined.w_inputs[last].data('related'),
					org_item
				 );
				google.maps.event.addListener(dir.directionDisplay, 'directions_changed', function()
				{
					mainview.combinedHide();
				});
			});
		}	
	};	
	LayoutFixes = {
		init:function()
		{
			layout = this;
			layout.set_styles();
		},
		set_styles:function()
		{
			if ($(window).width()<=960) {
				$('div.nui-try').css('width',$(window).width());
			}		
			$('#working-panel').append('<div class="division1"><span class="division2"></span></div>');
			$('div.bt_3 div.nui-try').css('width','100%');
		}
	};

	Program.init();
};
// the next to extend Storage object to save JS Object in LocalStorage object
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
};
// adds a hide method to TrafficLayerObject
google.maps.TrafficLayer.prototype.hide = function()
{
	this.setMap(null);
};
//Adds startsWith method to string Object
String.prototype.startsWith = function(pattern) {
  return this.slice(0, pattern.length).toLowerCase() == pattern.toLowerCase();
};
String.prototype.hasIn = function(pattern)
{
	var splits = this.split(" "), len = splits.length;
	
	for(var i=0;i<len;i++)
	{
		if( splits[i].length > 2 && splits[i].startsWith(pattern) ) return true;	
	}
};
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};