var LocalSettings;

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
		dzoom: 12,
		mng: null,
		icons: {},
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
			google.maps.event.addListener(self.map, "changed", function() {
						
			});
			
			$(mng).bind( 'zoom_done', function(event) {
				$.each(mng, function(key, value){
					if( "show" in value )
					{
						value.show();
					}
				});
			});
			
			google.maps.event.addListener(self.map, "zoom_changed", function() {
				var zoom = self.map.getZoom(), size = zoom * ( zoom / 10 ), timeout;
				
				if( zoom <= self.dzoom ) return;
				
				for(var key in obj)
				{
					p = self.switch_parameters(key);
					
					image = new google.maps.MarkerImage(self.icons[key],null, null, null, new google.maps.Size(size, size*p.ratio));
					for( var items in obj[key] )
					{
						obj[key][items].marker.setIcon(image);
					} //end for
				} //end for
				timeout = window.setTimeout(function(){
					$(mng).trigger("zoom_done");
					clearTimeout( timeout );
				}, 1000); //timeout
			}); //zoom event
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
					////console.log(key + " "+ items);
					var current = {}, image;
					current = program.d[key][items];
					current.type = key;
					current.icon_url = self.icons[key];
					current.marker = new google.maps.Marker({
						position: new google.maps.LatLng(current.lat, current.lng),
						title: current.name,
						icon: image,
						type: current.type,
						zIndex: p.index
					});
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
				
				mgr[key] = new MarkerClusterer(self.map);
				markers[key] = [];
				
				for( var items in obj[key] )
				{
					markers[key].push(obj[key][items].marker);
				}
				mgr[key].addMarkers(markers[key]);
			}
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