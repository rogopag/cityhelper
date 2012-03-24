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
		init:function()
		{
			self = this;
			self.ajax_populate();
			$('#map_canvas').ajaxComplete(function(event)
			{
				self.map = self.drawMap();
				self.draw_markers(self.fill_objects());
			});
			
		},
		drawMap:function()
		{
			var latlng = new google.maps.LatLng(45.0708515, 7.684340399999996), options = {
		      zoom: 10,
		      center: latlng,
			  mapTypeId: google.maps.MapTypeId.TERRAIN
		    };
			if( document.getElementById("map_canvas") )
			return new google.maps.Map(document.getElementById("map_canvas"), options);
		},
		fill_objects : function()
		{
			for(var key in program.d)
			{
				self.objects[key] = [];
				icon = '/static/images/'+key + ".png";
				for( var items in program.d[key] )
				{
					////console.log(key + " "+ items);
					var current = {}, image;
					current = program.d[key][items];
					current.type = key;
					current.icon_url = icon;
					image = new google.maps.MarkerImage(icon
					      // This marker is 20 pixels wide by 32 pixels tall.
					      //new google.maps.Size(15, 20),
					      // The origin for this image is 0,0.
					      //new google.maps.Point(0,0),
					      // The anchor for this image is the base of the flagpole at 0,32.
					      //new google.maps.Point(0, 20)
					);
					current.marker = new google.maps.Marker({
						position: new google.maps.LatLng(current.lat, current.lng),
						title: current.name,
						icon: image,
						type: current.type
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
			      mgr.traffic.addMarkers(markers.traffic, 12);
			      mgr.traffic.refresh();
			  });
			google.maps.event.addListener(mgr.pharma, 'loaded', function(){
			      mgr.pharma.addMarkers(markers.pharma, 12);
			      mgr.pharma.refresh();
			  });
			google.maps.event.addListener(mgr.parkings, 'loaded', function(){
			      mgr.parkings.addMarkers(markers.parkings, 12);
			      mgr.parkings.refresh();
			  });
		},
		ajax_populate: function()
		{
			obj = {'do' : 'something'};
			
			$.ajax({  
				type: 'post',  
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