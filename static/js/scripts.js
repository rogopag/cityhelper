var LocalSettings;

jQuery(function($){
	main();
});

function main()
{
	ajaxurl = '/', self = null, view = null, dir = null, dircontrol = null;
	
	var Program = {
		map : null,
		d : null,
		objects : {},
		ZOOM: 12,
		mng: null,
		icons: {},
		me: {},
		touch: false,
		is_not_touch: true,
		init:function()
		{
			var o;
			self = this;
			self.touch = ( typeof window.Touch != 'undefined' ) ? window.Touch : false;
			self.is_not_touch = ( self.touch ) ?  false : true;
			self.me.RATIO = 2.07;
			self.me.RADIUS = 3000;
			self.me.startlat = 0;
			self.me.startlng = 0;
			self.ajax_populate();
			self.map = self.drawMap();
			self.geolocate_me();
			$('#map_canvas').ajaxComplete(function(event)
			{
				o = self.fill_objects()
				self.mng = self.draw_markers(o);
				ViewController.init(self.mng);
				self.manageZoom(o, self.mng);
				DirectionsViewController.init();
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
					console.log('Error occurred. Error code: ' + error.code);
				}
			);
			/*and then watch it change*/
			watch = navigator.geolocation.watchPosition(function(position) {
				self.me.lat = position.coords.latitude;
				self.me.lng = position.coords.longitude;
				self.me.currentLocation = new google.maps.LatLng(self.me.lat, self.me.lng)
				var size = self.map.getZoom(), image, circle_options, circle;
				self.me.icon = LocalSettings.STATIC_URL+'images/me.png';
				image = new google.maps.MarkerImage(self.me.icon,null, null, null, new google.maps.Size(size, size*self.me.RATIO));
				//console.log("marker "+self.me.marker+" accuracy "+position.coords.accuracy+" time "+position.timestamp+" circle "+self.me.circle);

				if(typeof self.me.marker == 'undefined' && typeof self.me.circle == 'undefined' )
				{
					self.me.marker = new google.maps.Marker({
						position: self.me.currentLocation, 
						map: self.map, 
						title:"Here I am",
						icon:image
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
			},
				function(error) 
				{
					console.log('Error occurred. Error code: ' + error.code);
				}, 
				{
					enableHighAccuracy:true, 
					maximumAge:10000, 
					timeout:10000
				});
			}
			else {
				console.log('Geolocation is not supported for this Browser/OS version yet.');
			}
		},
		manageZoom: function(obj, mng)
		{
			google.maps.event.addListener(self.map, "zoom_changed", function() {
				var zoom = self.map.getZoom(), size = zoom * ( zoom / 10 ), timeout;
				if( zoom <= self.ZOOM ) return;
				console.log( "zoom is "+zoom);
				
				// sets the new zoom for the user's icon
				image = new google.maps.MarkerImage(self.me.icon,null, null, null, new google.maps.Size(size, size*self.me.RATIO));
				self.me.circle.setRadius( self.me.RADIUS / zoom );
				self.me.marker.setIcon(image);
				
				// sets the new zoom for the assets icons if not clustered
				for(var key in obj)
				{
					p = self.switch_parameters(key);
					
					image = new google.maps.MarkerImage(self.icons[key],null, null, null, new google.maps.Size(size, size*p.ratio));
					for( var items in obj[key] )
					{
						obj[key][items].marker.setIcon(image);
					} //end for
				} //end for
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
			var index = 1, ratio = 1, size = self.map.getZoom(), p;
			
			for(var key in self.d)
			{
				//console.log( key );
				self.objects[key] = [];
				self.icons[key] = LocalSettings.STATIC_URL+'images/' + key + ".png";
				
				p = self.switch_parameters(key);
				image = new google.maps.MarkerImage(self.icons[key],null, null, null, new google.maps.Size(size, size*p.ratio));
				for( var items in self.d[key] )
				{
					var current = {}, image;
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
					google.maps.event.addListener(current.marker, 'click', (function(o)
					{
						return function()
						{
							if( dircontrol.isSearchingForDirection )
							{
								var request = {
									origin: self.me.currentLocation,
									destination: new google.maps.LatLng(o.lat, o.lng),
									travelMode: google.maps.DirectionsTravelMode.DRIVING
								};
								dir.calculateRoute(request);
							}
							else
							{
								console.log(o);
							}
						}
						
					})(current));
					self.objects[key].push( current );
					delete current;
				}
			}
			return self.objects;
		},
		switch_parameters : function(key)
		{
			var params = {};
			
			switch(key)
			{
				case 'hospitals':
				params.index = 1001;
				params.ratio = 1.5;
				break;
				case 'pharma':
				params.index = 1001;
				params.ratio = 1.5;
				break;
				case 'parkings':
				params.index = 1000;
				params.ratio = 1.5;
				break;
				case 'traffic':
				params.index = 999;
				params.ratio = 0.92;
				break;
			}
			return params;
		},
		draw_markers : function(obj)
		{
			var mgr = {}, markers = {};
			
			if(!obj) return false;
			
			for(var key in obj)
			{
				var styles, params = self.switch_parameters(key);
				
				if( key != 'traffic')
				{
					styles = [{
						url : LocalSettings.STATIC_URL+'images/'+key + "34.png",
						height : 34,
						width : 34,
						anchor : [15,0],
						textColor : '#ff0000',
						textSize : 12
					},
					{
						url : LocalSettings.STATIC_URL+'images/'+key + "44.png",
						height : 44,
						width : 44,
						anchor : [23,0],
						textColor : '#ff0000',
						textSize : 12
					},
					{
						url : LocalSettings.STATIC_URL+'images/'+key + "54.png",
						height : 54,
						width : 54,
						anchor : [31,0],
						textColor : '#ff0000',
						textSize : 12
						}];
						//sets MarkerClusters for each group 
						mgr[key] = new MarkerClusterer(self.map, [], {styles : styles, maxZoom:14});
					}
					else
					{
						//sets MarkerManager for those we don't want to cluster 
						mgr[key] = new MarkerManager( self.map );
					}
				
				markers[key] = [];
				
				for( var items in obj[key] )
				{
					markers[key].push(obj[key][items].marker);
				}
				if(key != 'traffic')
				mgr[key].addMarkers(markers[key]);
			}
			google.maps.event.addListener(mgr.traffic, 'loaded', function(){
			      mgr.traffic.addMarkers(markers.traffic, self.ZOOM);
			      mgr.traffic.refresh();
			  });
			return mgr;
		},
		ajax_populate: function()
		{
			obj = {'do' : 'something'};
			
			$.ajax({  
				type: 'post',
				async: true,  
				url: ajaxurl,  
				data: {data: JSON.stringify(obj) },
				dataType: 'json',
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{  
					////console.log( textStatus, errorThrown );
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
					//////console.log( XMLHttpRequest, textStatus, jqXHR );
					if( response )
					{
						//console.log(response)
						self.d = response;
					}
				},
				complete: function( data, textStatus )
				{
					self.loader_hide();
				}
			});
		},
		loader_hide:function()
		{
			$("div#loading-gif").hide();
		},
		loader_show:function()
		{
			$("div#loading-gif").show();
		},	
	};
	var Directions = {
		directionsService: new google.maps.DirectionsService(),
		directionDisplay:null,
		origin:null,
		destination:null,
		request:{},
		init:function()
		{
			dir = this;
			dir.directionDisplay = new google.maps.DirectionsRenderer({
				draggable:false,
				map:self.map,
				panel: document.getElementById('directions-panel'),
				markerOptions:{
					visible:false
				}
			});
		},
		destroy:function()
		{
			
		},
		calculateRoute:function(request)
		{
			dir.directionsService.route(request, function(response, status) {
			      if (status == google.maps.DirectionsStatus.OK) {
			        dir.directionDisplay.setDirections(response);
					
					console.log( response );
			      }
			    });
		}
	};
	var DirectionsViewController = {
		options: null,
		optionsSelect:null,
		button:null,
		isSearchingForDirection:false,
		init: function()
		{
			dircontrol = this
			dircontrol.setSelectLayer();
		},
		setSelectLayer: function()
		{
			dircontrol.addButton();
			$('div.bt_5 span').append(dircontrol.options);
		},
		addButton: function()
		{
			dircontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).select(function(){
				dircontrol.isSearchingForDirection = true;
				Directions.init();
			}).deselect(function(){
				dircontrol.isSearchingForDirection = false;
				Directions.destroy();
			}),
			dircontrol.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: 'Selected'
			});
			dircontrol.options.addClass('directions-control-button');
		}
	};
	var ViewController = {
		options:null,
		optionsSelect:null, 
		traffic:null, 
		trafficSelect:null, 
		parkings:null,
		mngs:null,
		buttons:null,
		mng:{},
		init: function(mng)
		{
			view = this;
			view.mngs = mng;
			view.buttons = [];
			view.hideAddressBar();
			view.setSelectLayer();
			//console.log(view.mngs);
		},
		setSelectLayer: function()
		{
			// create elements and their otions
			view.addButton();
			//append elements created to buttons
			$('div.bt_4 span').append(view.options);
			
			$.each(view.buttons, function(key, value)
			{
				for( var key in value)
				{
					$('div.bt_4 div.open').append( value[key].el );
				}
			});
		},
		 hideAddressBar: function()
		{
			setTimeout(function(){
		    	window.scrollTo(0,1);
		  	},0);
		},
		 addButton: function() {
			/* create drawers */
			var count = 0, cluster;
			view.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}),
			view.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: 'Selected'
			});
			$.each(view.mngs, function(key, value){
				self.mng[key].mng = value;
				view.buttons[count] = {};
				view.buttons[count][key] = {};
				view.buttons[count][key].name = key;
				view.buttons[count][key].el = $.ninja.button({
					html: view.buttons[count][key].name
					}).select(function(){
						if( 'hide' in self.mng[key].mng)
						{
							self.mng[key].mng.hide();
						}
						else
						{
							self.mng[key].cluster = self.mng[key].mng.getMarkers()
							self.mng[key].mng.clearMarkers();
						}
						
					}).deselect(function(){
						if( 'hide' in self.mng[key].mng)
						{
							self.mng[key].mng.show();
						}
						else
						{
							self.mng[key].mng.addMarkers(self.mng[key].cluster);
							self.mng[key].mng.repaint();
						}
					}),
				view.buttons[count][key].sel = $.ninja.button({
					html: 'Selected',
					select: true
				});
				//console.log( view.key.el );
				$(view.buttons[count][key].el).addClass(view.buttons[count][key].name+"-button");
				count++;
			});
		}
	};
	Program.init();
};