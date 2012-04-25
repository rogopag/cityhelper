var LocalSettings;

jQuery(function($){
	main();
});

function main()
{
	var ajaxurl = '/', self = null, view = null, dir = null, dircontrol = null, store = null, storecontrol = null, /*search = null, searchController = null,*/ layout = null, mainview = null, Program, ViewController, Directions, DirectionsViewController, SessionStorageController, SessionStorage, SetCenterOnMe, LayoutFixes, CombinedView, combined = null;
	
	Program = {
		map : null,
		d : null,
		objects : {},
		ZOOM: 11,
		clusterMaxZoom:16,
		mng: null,
		icons: {},
		icons_default_size:54,
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
				////console.log("marker "+self.me.marker+" accuracy "+position.coords.accuracy+" time "+position.timestamp+" circle "+self.me.circle);
				
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
			    streetViewControl: self.is_not_touch,
			    streetViewControlOptions: {
			        position: google.maps.ControlPosition.LEFT_CENTER
			    }
		    };
			if( document.getElementById("map_canvas") )
			return new google.maps.Map(document.getElementById("map_canvas"), options);
		},
		fill_objects : function()
		{
			var index = 1, /*ratio = 1,*/ size = self.icons_default_size, p;
			
			for(var key in self.d)
			{
				//////console.log( key );
				self.objects[key] = [];
				self.icons[key] = LocalSettings.STATIC_URL+'images/map_icons.png';
				
				p = self.switch_parameters(key);
				////console.log( )
				image = new google.maps.MarkerImage(
					self.icons[key],
					new google.maps.Size(size, size), 
					new google.maps.Point(p.icon,0), 
					new google.maps.Point(0,0)
					//new google.maps.Size(size, size*p.ratio)
					);
				for( var items in self.d[key] )
				{
					var current = {}, image;
					//make sure fields prperty is gone forever and doesn't bother anymore
					current = ( typeof self.d[key][items].fields != 'undefined' )?self.d[key][items].fields:self.d[key][items];
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
				}
			}
			return self.objects;
		},
		manage_info_box:function(o)
		{
			var obj = o, infoBoxOptions, boxBox = document.createElement("div"), info = $('<div class="infoRow"></div>'), action = $('<div class="actionRow"></div>'), button, buttonSelect;
			//we create and append some html
			button = $.ninja.button({
				html: 'Percorso',
				select:( null == dir ) ? false : true
				}).select(function(){
					Directions.init();
					dir.calculateRoute(obj.lat, obj.lng);
					return false;
				}).deselect(function(){
					dir.destroy();
					if( !obj.has_infoBox && !self.has_infobox_open ) self.infoBox.close();
					return false;
				}),
			buttonSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			
			info.text(obj.name);
			action.append(button);
			
			$(boxBox).append(info, action);
			
			//some options for our infoBox
			var infoBoxOptions = {
			                 content: boxBox
			                ,disableAutoPan: false
			                ,maxWidth: 0
			                ,pixelOffset: new google.maps.Size(-140, 0)
			                ,zIndex: null
			                ,closeBoxMargin: ""
			                ,closeBoxURL: ""
			                ,infoBoxClearance: new google.maps.Size(1, 1)
			                ,isHidden: false
			                ,pane: "floatPane"
			                ,enableEventPropagation: false
			        };
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
						////console.log( "tapped "+obj.has_infoBox+" "+i );
						i.close();
						o.has_infoBox = false;
						self.has_infobox_open = false;
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
				break;
				case 'pharma':
				params.index = 1001;
				params.ratio = 1.5;
				params.cluster = 38;
				params.icon = 54;
				break;
				case 'parkings':
				params.index = 1000;
				params.ratio = 1.5;
				params.cluster = 76;
				params.icon = 108;
				break;
				case 'traffic':
				params.index = 999;
				params.ratio = 0.92;
				params.cluster = 0;
				params.icon = 108;
				break;
				case 'veterinarians':
				params.index = 999;
				params.ratio = 0.92;
				params.cluster = 114;
				params.icon = 162;
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
				
		//		////console.log(params.cluster)
				
				if( key != 'traffic')
				{
					styles = [{
						url : LocalSettings.STATIC_URL+'images/map_clusters.png',
						height : 38,
						width : 38,
						backgroundPosition:[params.cluster,0],
					//	anchorIcon:[200,0],
						anchor : [50,30],
						textColor : '#ff0000',
						textSize : 12
					}];
						//sets MarkerClusters for each group 
						mgr[key] = new MarkerClusterer(self.map, [], {styles : styles, maxZoom:self.clusterMaxZoom});
				//		////console.log( mgr[key].getCalculator() )
					}
					else
					{
						//sets MarkerManager for those we don't want to cluster 
						mgr[key] = self.trafficLayer;
					}
				
				markers[key] = [];
				
				for( var items in obj[key] )
				{
					markers[key].push(obj[key][items].marker);
				}
				if(key != 'traffic')
				mgr[key].addMarkers(markers[key]);
				
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
					////////console.log( textStatus, errorThrown );
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
					//////////console.log( XMLHttpRequest, textStatus, jqXHR );
					if( response )
					{
						self.d = self.parseResponse(response)
						return self.d;
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
		    	window.scrollTo(0,1);
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
			//////console.log(view.mngs);
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
			}).select(function(){
					view.controlOtherDrawers(this,  event.target);
				}).deselect(function(){
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
				if( dir && dir.hasDirection ) dir.destroy();
				view.purge_open( view.options );
				view.purgeCssClass( $(this) );
			});
			view.rows_selected.push( view.clear_button );
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
				$(this).prev().removeClass('nui-slc')
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
		init:function()
		{
			dir = this;
			dir.save = null;
			dir.setRenderer();
		},
		destroy:function()
		{
			////console.log("Called destroy");
			dir.directionDisplay.setMap(null);
		    dir.directionDisplay.setPanel(null);
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
					visible:true
				}
			});
		},
		calculateRoute:function(lat, lng, org, w)
		{
			var origin, request, waypoints;
			// if a route is already plotted please erase.
			
			if( dir.hasDirection ) dir.destroy();
			
			origin = ( org ) ? org : self.me.currentLocation;
			
			waypoints = ( w ) ? w : [];
			
			request = {
				origin: origin,
				destination: new google.maps.LatLng(lat, lng),
				travelMode: dir.mode,
				provideRouteAlternatives:true,
				waypoints:waypoints,
				optimizeWaypoints:true
			};
			dir.directionsService.route(request, function(response, status) {
			      if (status == google.maps.DirectionsStatus.OK) {
			        dir.directionDisplay.setDirections(response);
					dir.hasDirection = true;
					dir.save = {};
					dir.save.start_lat = response.routes[0].legs[0].start_location.lat();
					dir.save.start_lng = response.routes[0].legs[0].start_location.lng();
					dir.save.end_lat = response.routes[0].legs[0].end_location.lat();
					dir.save.end_lng = response.routes[0].legs[0].end_location.lng();
			      }
			    });
			dir.markers_printer(waypoints);
		},
		markers_printer:function( wp )
		{
			var w = wp, marker = [];
			
			if( !w || w.length == 0 ) return;
			
			for( var i in w )
			{
				//console.log( i, w[i] );
				marker[i] = new google.maps.Marker({
					position: w[i].location,
					title: "stop",
					map:self.map
				});
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
				Directions.init();
				dircontrol.isSearchingForDirection = true;
				view.controlOtherDrawers(this,  event.target);
			}).deselect(function(event){
				dircontrol.isSearchingForDirection = false;
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
               	$('.nui-dlg').css({
	               	'width':$(window).width()-20,
	               	'top':'10',
	               	'left':'10'
	              	}).prepend('<span class="title"><h2>Opzioni percorso<h/h2></span>');
	
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
				//console.log(key);
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
				//////console.log( dircontrol.key.el );
				$(dircontrol.buttons[count][key].el).addClass(dircontrol.buttons[count][key].name+"-button");
				count++;
			});
		},
	};
	SessionStorageController = {
		options:null,
		optionsSelect:null,
		saveData:null,
		saveDataSelect:null,
		displayData:null,
		displayDataSelect:null,
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
			$('div.bt_2 div.open').append(storecontrol.saveData, storecontrol.displayData);
		},
		addButton:function()
		{
			storecontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).deselect(function(){
				view.controlOtherDrawers(this,  event.target);
				$(this).find('button').each(function(){
					$(this).removeClass('nui-slc');
				});	
			}).select(function(){
				view.controlOtherDrawers(this,  event.target);
			}),
			storecontrol.optionsSelect = $.ninja.drawer({
				html: '',
				value: 'Selected'
			});
			storecontrol.saveData = $.ninja.button({
				html: 'Salva'
				}).select(function(){
					store.saveData(storecontrol.saveData);
				}).deselect(function(){
					
				}),
			storecontrol.saveDataSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
			storecontrol.displayData = $.ninja.button({
				html: 'Carica'
				}).select(function(){
					store.getData(storecontrol.saveData);
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
				alert("i do not store things, your data won't be saved");
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
				console.log("Press ")
				store.appendFormAndSave();
			}
			else
			{
				$(button).removeClass('nui-slc');
				alert("Build route before trying to save it!");
				return false;
			}
		},
		appendFormAndSave:function()
		{
			console.log("should append form " + store.has_form);
			var wrap = $('<div id="wrap_combined_inputs"></div>');
			store.input = $('<input type="text" name="save_path_name" value="Nome percorso" id="save_path_name" />');
			store.saveButton = $('<button type="button" id="save_path" value="Salva" />');
			
			if( !store.has_form )
			{
				mainview.div.css('height', '25%');
				wrap.append(store.input, store.saveButton).css('top','50%');
				mainview.div.append(wrap).slideDown(400, 
					function(){
						mainview.map_div.css('height', '75%');
						store.has_form = true;
						console.log("should be appendend " + store.has_form);
					});
				wrap.fadeIn(200);
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
					console.log("is else")
					try
					{
						window.localStorage.setObject( store.input.val(), dir.save );
						alert("Il percorso "+ store.input.val() + " &egrave; stato salvato");
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
		},
		getData:function(button)
		{
			var container, row, shown = false;
			
			container = $.ninja.dialog({
				html: ''
			}).detach(function () {
				
			});
			container.addClass("locations-saved-list");
			console.log("has storage:: "+store.has_storage()+" s len "+window.localStorage.length)
			if( store.has_storage() && window.localStorage.length)
			{
				var len = window.localStorage.length;
				
				container.attach().hide();
				
				for(var i=0; i<len;i++)
				{
					store.stored[i]={};
					store.stored[i].key = window.localStorage.key(i);
					store.stored[i].obj = window.localStorage.getObject( store.stored[i].key );
					row = $('<div class="row" />');
					if( !shown )
					{
						row.text(store.stored[i].key);
						container.append( row ).fadeIn(400, function(){
							shown = true;
						});
						row.bind('click', {index:i}, function(event){
							if(!dir) Directions.init();
							var i = event.data.index, o = new google.maps.LatLng(store.stored[i].obj.start_lat, store.stored[i].obj.start_lng);
							
							dir.calculateRoute( 
								store.stored[i].obj.end_lat, 
								store.stored[i].obj.end_lng, 
								o
								);
								//console.log("Clicked")
						});
					}
				}
			}
			else
			{
				alert("Non ci sono percorsi salvati");
			}
		},
		removePanel:function()
		{
			mainview.map_div.css('height', '100%');
			mainview.div.slideUp(400, function(){
				store.has_form = false;
				$(this).empty();
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
		w_inputs:[],
		wrp:null,
		add_button:null,
		save_buton:null,
		b_count:0,
		waypoints:false,
		items:null,
		request:false,
		init:function()
		{
			combined = this;
		},
		makeForm:function()
		{
			var working_panel = $('#working-panel');
			
			combined.waypoints = [];
			combined.request = {};
			
			combined.o_input = combined.printInput( combined.o_input, true );
			combined.d_input = combined.printInput( combined.d_input );
			combined.add_button = $('<span class="button_wrapper"><input type="button" id="add_input" name="add_input" value="add" /></span>');
			combined.save_buton = $('<input type="button" id="save_input" name="save_input" value="save" />');
			combined.wrp = $('<div id="wrap_combined_inputs"></div>');
			
			combined.wrp.append( combined.o_input, combined.add_button, combined.d_input, combined.save_buton );
			working_panel.append(combined.wrp);
			
			combined.wrp.fadeIn(function(){
				combined.addInput();
				combined.save();
			});
		},
		addInput:function()
		{
			combined.add_button.bind('click',{d:null}, function(event){
				var len = combined.w_inputs.length;
				combined.w_inputs[len] = combined.printInput( combined.w_inputs[len] );
				if( len == 0 )
				{
					combined.o_input.after( combined.w_inputs[len] );
				}
				else
				{
					
					combined.w_inputs[len-1].after( combined.w_inputs[len] );
				}	
			});
			
			$('#working-panel').css({'display':'-webkit-box'});
		},
		save:function()
		{
			combined.save_buton.bind('click', {d:null}, function(event){
				combined.request.origin = ( 'name' in combined.o_input.data ) ? new google.maps.LatLng( combined.o_input.data.lat, combined.o_input.data.lng ) : combined.o_input.data;
				combined.request.destination = ( typeof combined.d_input.data == 'object' ) ? new google.maps.LatLng( combined.d_input.data.lat, combined.d_input.data.lng ) : false;
				if( !combined.request.destination )
				{
					alert("Seleziona una destinazione!");
					return false;
				}
				$.each(combined.w_inputs, function(key, value){
						if( typeof value.data == 'object' )
						{
							combined.waypoints.push({ 
									'location':new google.maps.LatLng( value.data.lat, value.data.lng ),
									'stopover':true,
								});
						}
						else
						{
							combined.waypoints = [];
							alert("Completa la compilazione dei waypoints!");
							return false;
						}
				});
				combined.request.waypoints = combined.waypoints;
				if(!dir) Directions.init();
				dir.calculateRoute(
					combined.request.destination.lat(),
					combined.request.destination.lng(),
					combined.request.origin,
					combined.request.waypoints
				 );
				google.maps.event.addListener(dir.directionDisplay, 'directions_changed', function()
				{
					mainview.combinedHide();
				});
			});
		},
		printInput:function( me, d )
		{
			var data = $.extend(true, {}, self.d), my = me, tmp = [], arr, def = ( typeof d == 'undefined' ) ? false : d;
			delete data.traffic;
			arr = $.map(data, function (item, i){
				return $.merge(tmp, data[i]);
			});
			
			my = $.ninja.autocomplete({
			  placeholder: ( !def ) ? 'Cerca servizio' : 'Current location'
			}).values(function (event) {
			      my.list({
			        values: $.map(arr, function (item, i) {
					if( item.name.startsWith(event.query) )
			          return {
			            html: item.name,
			            value: item.name,
						select:function()
						{
							my.data = item;
						}
			          };
			        }),
			        query: event.query
			      });
			});
			
			if( def )
			{
				my.data = self.me.currentLocation;
			}
			
			delete tmp, arr, data;
			return my;
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
			$('#working-panel').append('<div class="division1"><span class="division2"></span></div>')
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
//Adds a data Object to autocomplete Object
$.ninja.autocomplete.prototype.data = {};
