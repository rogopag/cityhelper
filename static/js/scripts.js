var LocalSettings;

jQuery(function($){
	main();
});

function main()
{
	var ajaxurl = '/', self = null, view = null, dir = null, dircontrol = null, store = null, storecontrol = null, search = null, searchController = null;
	
	var Program = {
		map : null,
		d : null,
		objects : {},
		ZOOM: 13,
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
				SessionStorageController.init();
				SearchPlacesController.init();
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
				if( zoom <= self.ZOOM ) return false;
				
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
								dir.calculateRoute(o.lat, o.lng);
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
			view.options.addClass("hide-show-layers")
			$.each(view.mngs, function(key, value){
				self.mng[key].mng = value;
				view.buttons[count] = {};
				view.buttons[count][key] = {};
				view.buttons[count][key].name = key;
				view.buttons[count][key].el = $.ninja.button({
					html: view.buttons[count][key].name,
					select:true
					}).deselect(function(){
						if( 'hide' in self.mng[key].mng )
						{
							self.mng[key].mng.hide();
						}
						else
						{
							self.mng[key].cluster = self.mng[key].mng.getMarkers()
							self.mng[key].mng.clearMarkers();
						}
						
					}).select(function(){
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
					select: false
				});
				//console.log( view.key.el );
				$(view.buttons[count][key].el).addClass(view.buttons[count][key].name+"-button");
				count++;
			});
		}
	};
	var Directions = {
		directionsService: new google.maps.DirectionsService(),
		directionDisplay:null,
		origin:null,
		destination:null,
		request:{},
		hasDirection:false,
		mode: google.maps.DirectionsTravelMode.DRIVING,
		init:function()
		{
			dir = this;
			dir.save = null;
			dir.setRenderer();
		},
		destroy:function()
		{
			console.log("Called destroy");
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
					visible:false
				}
			});
		},
		calculateRoute:function(lat, lng)
		{
			// if a route is already plotted please erase.
			console.log("Called calculate route " + dir.hasDirection);
			
			if( dir.hasDirection ) dir.destroy();
			
			var request = {
				origin: self.me.currentLocation,
				destination: new google.maps.LatLng(lat, lng),
				travelMode: dir.mode
			};
			dir.directionsService.route(request, function(response, status) {
			      if (status == google.maps.DirectionsStatus.OK) {
			        dir.directionDisplay.setDirections(response);
					dir.hasDirection = true;
					dir.save = response;
					console.log( dir.save );
			      }
			    });
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
	var DirectionsViewController = {
		options: null,
		optionsSelect:null,
		button:null,
		isSearchingForDirection:false,
		isBike:null,
		isBikeSelect:null,
		isCar:null,
		isCarSelect:null,
		isFeet:null,
		isFeetSelect:null,
		init: function()
		{
			dircontrol = this
			dircontrol.setSelectLayer();
		},
		setSelectLayer: function()
		{
			dircontrol.addButton();
			$('div.bt_5 span').append(dircontrol.options);
			$('div.bt_5 div.open').append(/*dircontrol.isBike, */dircontrol.isCar, dircontrol.isFeet);
		},
		addButton: function()
		{		
			dircontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}).select(function(){
				Directions.init();
				dircontrol.isSearchingForDirection = true;
			}).deselect(function(){
				dircontrol.isSearchingForDirection = false;
				dir.destroy();
			}),
			dircontrol.optionsSelect = $.ninja.drawer({
				html: '',
				select: true,
				value: 'Selected'
			});
			dircontrol.options.addClass('directions-control-button');
			
		/*	dircontrol.isBike = $.ninja.button({
				html: 'Bicicletta'
				}).select(function(){
					dircontrol.purgeCssClass( dircontrol.isBike );
					dir.switchMode(0);
					return false;
				}).deselect(function(){
					dir.switchMode(1);
					return false;
				}),
			dircontrol.isBikeSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});*/
			dircontrol.isCar = $.ninja.button({
				html: 'Auto',
				select:true
				}).select(function(){
					dircontrol.purgeCssClass( dircontrol.isCar );
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
			dircontrol.isFeet = $.ninja.button({
				html: 'Piedi'
				}).select(function(){
					dircontrol.purgeCssClass( dircontrol.isFeet );
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
		},
		purgeCssClass:function(el)
		{
			var elements = [dircontrol.isFeet, dircontrol.isCar];
			$.each(elements, function(key, value){
				if(value != el)
				{
					value.removeClass('nui-slc');
				}
			});
		}
	};
	var SessionStorageController = {
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
			$('div.bt_3 span').append(storecontrol.options);
			$('div.bt_3 div.open').append(storecontrol.saveData, storecontrol.displayData);
		},
		addButton:function()
		{
			storecontrol.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: '',
			}).deselect(function(){
				$(this).find('button').each(function(){
					$(this).removeClass('nui-slc');
				});
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
	var SessionStorage = {
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
			store.input = $('<input type="text" name="save_path_name" value="Nome percorso" id="save_path_name" />');
			store.saveButton = $('<button type="button" id="save_path" value="Salva" />');
			
			if( !store.has_form )
			{
				$("div#working-panel").append(store.input, store.saveButton).show(400, 
					function(){
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
			var container = $("#working-panel"), row, shown = false;
			
			if( store.has_storage && window.localStorage.length)
			{
				var len = window.localStorage.length, objs;
				
				for(var i=0; i<len;i++)
				{
					console.log( "index::: "+i)
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
						row.click(function(){
							Directions.init();
							console.log( "index then " + i );
							//dir.directionDisplay.setDirections( store.stored[i].obj );
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
			$("div#working-panel").empty().fadeOut(400, function(){
				store.has_form = false;
			});
		}
	};
	var SearchPlacesController = {
		options:null,
		optionsSelect:null,
		getClosestPharma:null,
		getClosestPharmaSelect:null,
		getClosestHospital:null,
		getClosestHospitalSelect:null,
		init:function()
		{
			searchController = this;
			searchController.setSelectLayer();
			SearchPlaces.init();
		},
		setSelectLayer: function()
		{
			searchController.addButton();	
			$('div.bt_2 span').append(searchController.options);
			$('div.bt_2 span .open').append(searchController.getClosestPharma, searchController.getClosestHospital);
		},
		addButton:function()
		{
			//add html:'<div class="open"></div>' to have a placeholder for submenu items
			searchController.options = $.ninja.drawer({
				html: '<div class="open"></div>',
				value: ''
			}),
			searchController.optionsSelect = $.ninja.drawer({
				html: '',
				value: 'Selected'
			});
			searchController.getClosestPharma = $.ninja.button({
				html:'Farmacie',
				value:''
			}).select(function(){
				searchController.getClosestHospital.removeClass('nui-slc');
				search.doSearch(['pharmacy']);
			}).deselect(function(){
				
			}),
			searchController.getClosestPharmaSelect = $.ninja.button({
				html: 'Selected',
				select:true
			});
			searchController.getClosestHospital = $.ninja.button({
				html:'Ospedali',
				value:''
			}).select(function(){
				searchController.getClosestPharma.removeClass('nui-slc');
				search.doSearch(['hospital', 'health']);
			}).deselect(function(){
				
			}),
			searchController.getClosestHospitalSelect = $.ninja.button({
				html: 'Selected',
				select: true
			});
		}
	}; 
	var SearchPlaces = {
		map:null,
		service:null,
		infowindow:null,
		loc:null,
		input:document.getElementById("places_search"),
		bounds:null,
		service:null,
		init:function()
		{
			search = this;
			search.map = self.map;
			search.loc = self.me.currentLocation;
			//search.bounds = search.map.getBounds();
		},
		doSearch:function( type )
		{
			var t = ( type ) ? type : ['pharmacy', 'hospital'];
			var listing, request = {
				location:search.loc,
				radius: '500',
				types: t
			};
			search.service = new google.maps.places.PlacesService(search.map);
			search.service.search(request, search.callback);
			
		},
		callback:function(results, status)
		{
			if (status == google.maps.places.PlacesServiceStatus.OK)
			{
				listing = $('a');
				$.each( listing, function(key, value){
					if( typeof $(value).attr('href') != 'undefined' && $(value).attr('href').indexOf('paginegialle') != -1 )
					{
						$(value).parent().remove();
					}
				});
			}
		}
	}
	Program.init();
};

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}