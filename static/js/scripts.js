var LocalSettings;

jQuery(function($){
	main();
});

function main()
{
	ajaxurl = '/', self = null;
	
	var program = {
		map : null,
		d : null,
		objects : {},
		dzoom: 12,
		mng: null,
		icons: {},
		me: {},
		init:function()
		{
			var o;
			self = this;
			self.me.RATIO = 2.07;
			self.me.RADIUS = 3000;
			self.ajax_populate();
			self.map = self.drawMap();
			self.geolocate_me();
			$('#map_canvas').ajaxComplete(function(event)
			{
				o = self.fill_objects()
				self.mng = self.draw_markers(o);
				self.manageZoom(o, self.mng);
			});	
		},
		geolocate_me:function()
		{
			if (navigator.geolocation) {
				var startPos;
				navigator.geolocation.getCurrentPosition(function(position) {
					startPos = position;
					self.me.lat = startPos.coords.latitude;
					self.me.lng = startPos.coords.longitude;
					//console.log(self.me);
				},
				function(error) {
					console.log('Error occurred. Error code: ' + error.code);
				}
			);
			navigator.geolocation.watchPosition(function(position) {
				var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude), size = self.map.getZoom(), image, circle_options, circle;
				self.me.icon = LocalSettings.STATIC_URL+'images/me.png'
				self.map.setCenter(currentLocation);
				image = new google.maps.MarkerImage(self.me.icon,null, null, null, new google.maps.Size(size, size*self.me.RATIO));
				self.me.marker = new google.maps.Marker({
				      position: currentLocation, 
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
					center: currentLocation,
					radius: self.me.RADIUS / self.dzoom
				};
				self.me.circle = new google.maps.Circle(circle_options);
				
				self.me.lat = position.coords.latitude;
				self.me.lng = position.coords.longitude;
				});
			}
			else {
				console.log('Geolocation is not supported for this Browser/OS version yet.');
			}
		},
		manageZoom: function(obj, mng)
		{
			google.maps.event.addListener(self.map, "zoom_changed", function() {
				if( zoom <= self.dzoom ) return;
				
				var zoom = self.map.getZoom(), size = zoom * ( zoom / 10 ), timeout;
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
				zoom: self.dzoom,
				navigationControl: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: latlng
		    };
			if( document.getElementById("map_canvas") )
			return new google.maps.Map(document.getElementById("map_canvas"), options);
		},
		fill_objects : function()
		{
			var index = 1, ratio = 1, size = self.map.getZoom(), p;
			
			for(var key in program.d)
			{
				
				self.objects[key] = [];
				self.icons[key] = LocalSettings.STATIC_URL+'images/'+key + ".png";
				
				p = self.switch_parameters(key);
				image = new google.maps.MarkerImage(self.icons[key],null, null, null, new google.maps.Size(size, size*p.ratio));
				for( var items in program.d[key] )
				{
					var current = {}, image;
					current = ( typeof program.d[key][items].fields != 'undefined' )?program.d[key][items].fields:program.d[key][items];
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
							console.log(o);
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
						mgr[key] = new MarkerClusterer(self.map, [], {styles : styles});
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
			      mgr.traffic.addMarkers(markers.traffic, self.dzoom);
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
						program.d = response;
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
		}
	}
	program.init();
};
$(document).ajaxSend(function(event, xhr, settings) {
  function getCookie(name) {
    var cookieValue = null;

    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');

      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);

        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }

    return cookieValue;
  }

  function sameOrigin(url) {
    // url could be relative or scheme relative or absolute
    var host = document.location.host;
    // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;

    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
           (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
           // or any other URL that isn't scheme relative or absolute i.e relative.
           !(/^(\/\/|http:|https:).*/.test(url));
  }

  function safeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
  }
});