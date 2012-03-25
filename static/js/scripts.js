$(function(){
	main();
});

function main()
{
	ajaxurl = '/', self = null;
	
	var program = {
		map : null,
		d : null,
		objects : {},
		dzoom: 13,
		mng: null,
		init:function()
		{
			var o;
			self = this;
			self.ajax_populate();
			self.map = self.drawMap();
			$('#map_canvas').ajaxComplete(function(event)
			{
				o = self.fill_objects()
				self.mng = self.draw_markers(o);
				self.manageZoom(o, self.mng);
			});	
		},
		manageZoom: function(obj, mng)
		{
			google.maps.event.addListener(self.map, "zoom_changed", function() {
				var size = self.map.getZoom();
				if( size < self.dzoom ) return; 
				for(var key in obj)
				{
					var icon = icon = '/static/images/org/'+key + ".png", image;
					
					mng[key].hide();
					
					switch(key)
					{
						case 'pharma':
						ratio = 0.92;
						break;
						case 'parkings':
						ratio = 1.5;
						break;
						case 'traffic':
						ratio = 0.92;
						break;
					}
					image = new google.maps.MarkerImage(icon,null, null, null, new google.maps.Size(size, size*ratio));
					for( var items in obj[key] )
					{
						obj[key][items].marker.setIcon(image);
					}
					mng[key].show();
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
			var index = 1, ratio = 1, size = self.map.getZoom();
			
			for(var key in program.d)
			{
				self.objects[key] = [];
				icon = '/static/images/'+key + ".png";
				switch(key)
				{
					case 'pharma':
					index = 1001;
					ratio = 0.92;
					break;
					case 'parkings':
					index = 1000;
					ratio = 1.5;
					break;
					case 'traffic':
					index = 999;
					ratio = 0.92;
					break;
				}
				
				image = new google.maps.MarkerImage(icon,null, null, null, new google.maps.Size(size, size*ratio));
				
				for( var items in program.d[key] )
				{
					////console.log(key + " "+ items);
					var current = {}, image;
					current = program.d[key][items];
					current.type = key;
					current.icon_url = icon;
					current.marker = new google.maps.Marker({
						position: new google.maps.LatLng(current.lat, current.lng),
						title: current.name,
						icon: image,
						type: current.type,
						zIndex: index
					});
					self.objects[key].push( current );
					delete current;
				}
			}
			return self.objects;
		},
		draw_markers : function(obj)
		{
			var mgr = {}, markers = {};
			
			if(!obj) return false;
			
			for(var key in obj)
			{
				
				mgr[key] = new MarkerManager(self.map);
				markers[key] = [];
				
				for( var items in obj[key] )
				{
					markers[key].push(obj[key][items].marker);
				}
			}
			google.maps.event.addListener(mgr.traffic, 'loaded', function(){
			      mgr.traffic.addMarkers(markers.traffic, self.dzoom);
			      mgr.traffic.refresh();
			  });
			google.maps.event.addListener(mgr.pharma, 'loaded', function(){
			      mgr.pharma.addMarkers(markers.pharma, self.dzoom);
			      mgr.pharma.refresh();
			  });
			google.maps.event.addListener(mgr.parkings, 'loaded', function(){
			      mgr.parkings.addMarkers(markers.parkings, self.dzoom);
			      mgr.parkings.refresh();
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
						program.d = response;
					}
				},
				complete: function( data, textStatus )
				{
				//	console.log( data, textStatus );
				}  
			});
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