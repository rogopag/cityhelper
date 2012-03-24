$(function(){
	main();
});

function main()
{
	ajaxurl = '/', self;
	
	var program = {
		map : null,
		data : {},
		current : null,
		objects : [],
		init:function()
		{
			self = this;
			self.drawMap();
			self.ajax_populate();
			$('#map_canvas').ajaxComplete(function(data)
			{
				self.draw_markers(self.data);
			});
			
		},
		drawMap:function()
		{
			var latlng = new google.maps.LatLng(45.0708515, 7.684340399999996), options = {
		      zoom: 12,
		      center: latlng,
			  mapTypeId: google.maps.MapTypeId.TERRAIN
		    };
			if( document.getElementById("map_canvas") )
			this.map = new google.maps.Map(document.getElementById("map_canvas"), options);
		},
		draw_markers : function(data)
		{
			var icon;
			
			if(!data) return false;
			
			for(var key in data)
			{
				icon = '/static/images/'+key + ".png";
				//console.log(key+":::");
				for( var items in data[key] )
				{
					self.current = data[key][items];
					self.current.type = key;
					self.current.icon_url = icon;
					var image = new google.maps.MarkerImage(icon,
					      // This marker is 20 pixels wide by 32 pixels tall.
					      new google.maps.Size(30, 60),
					      // The origin for this image is 0,0.
					      new google.maps.Point(0,0),
					      // The anchor for this image is the base of the flagpole at 0,32.
					      new google.maps.Point(0, 30));
					self.current.marker = new google.maps.Marker({
						map: self.map,
						position: new google.maps.LatLng(self.current.lat,self.current.lng),
						icon: image
					});
					self.objects.push( self.current );
					//console.log(self.current);
				}
			}
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
					//console.log( textStatus, errorThrown );
				},
				beforeSend: function(XMLHttpRequest) 
				{ 
					if (XMLHttpRequest && XMLHttpRequest.overrideMimeType) 
					{
						XMLHttpRequest.overrideMimeType("application/j-son;charset=UTF-8");
					}
				}, 
				success: function( data, textStatus, jqXHR )
				{
					////console.log( XMLHttpRequest, textStatus, jqXHR );
					if( data )
					{
						if( data.pharma )
						{
							self.data.pharma = data.pharma;
						}
						if( data.parkings )
						{
							self.data.parkings = data.parkings;
						}
						if( data.traffic )
						{
							self.data.traffic = data.traffic;
						}
					}
				},
				complete: function( data, textStatus )
				{
					//console.log( data, textStatus );
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
        var host = document.location.host; // host + port
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
