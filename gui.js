
String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
}

var ITEM_TEMPLATE = "<li><a href='#event-details?{4}'>{0}<span class='small right'>{1}</span><div class='small'>{2}<span class='right'>{3}km away</span></div></a></li>";
var DESCRIPTION_LENGTH_LIMIT = 30;

function createResultItem(opportunity) {
	var title = opportunity.title;
	var date = dateFormat(opportunity.date, "dd/mm/yyyy");
	var description = opportunity.description;
	if (description.length > DESCRIPTION_LENGTH_LIMIT) {
		description = description.substring(0, DESCRIPTION_LENGTH_LIMIT - 3) + "...";
	};
    var id = opportunity.id;
	var distance = opportunity.distance;
    var latitude = opportunity.geoLocation.latitude;
    var longitude = opportunity.geoLocation.longitude;
 
    var location = new google.maps.LatLng(latitude, longitude);
    addMarker(location, title, id);
    return String.format(ITEM_TEMPLATE, title, date, description, distance, id);
}

function populateSearch(oportunities) {
	var resultList = $('#results-list');
	resultList.empty();
	$.each(oportunities, function(rowIndex) {
		var data = createResultItem(oportunities[rowIndex]);
		resultList.append(data);
	});
	resultList.listview('refresh');
	var latlngbounds = new google.maps.LatLngBounds();
	$.each(markersArray, function(n){
		var marker = markersArray[n];
		if (marker.position != undefined) {
			latlngbounds.extend(marker.position);
		};
	   
	});
	map.setCenter(latlngbounds.getCenter());
	map.fitBounds(latlngbounds); 
}

var map;
var markersArray = [];

function addMarker(location, title, id) {
  marker = new google.maps.Marker({
    position: location,
    map: map,
    title : title
  });
  google.maps.event.addListener(marker, 'click', function() {
  	window.location = "#event-details?" + id;
  });
  markersArray.push(marker);
}

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
  if (markersArray) {
    for (i in markersArray) {
      markersArray[i].setMap(null);
    }
  }
}

// Shows any overlays currently in the array
function showOverlays() {
  if (markersArray) {
    for (i in markersArray) {
      markersArray[i].setMap(map);
    }
  }
}

// Deletes all markers in the array by removing references to them
function deleteOverlays() {
  if (markersArray) {
    for (i in markersArray) {
      markersArray[i].setMap(null);
    }
    markersArray.length = 0;
  }
}

function loadMap(elemID) {
    var map;
    var myOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: false,
        zoomControl: false,
        scaleControl: false,
        streetViewControl: false,
        mapTypeControl: false
    };
    map = new google.maps.Map($(elemID)[0], myOptions);
    return map
}

$(document).delegate('#event-details', 'pageinit', function() {
    $(window).bind("orientationchange resize pageshow", function() {
        var height = $(window).height();
        
        var $eventMap = $("#event-map");
        $eventMap.siblings().each(function() {
            height -= $(this).outerHeight();
        });
        $eventMap.outerHeight(height);
    });
});

var router = new $.mobile.Router({
    "#event-details(?:[/?](.*))?": "eventDetailsPage",
    "#search": "searchPage"
},{
    searchPage: function() {
        map = loadMap('#map');
    },
    eventDetailsPage: function(type, match, ui){
        $.ajax({
            url: '/openplanetideas-plusyou-provider/opportunities/'+match[1],
            success: function(data) {
                var o = $.xml2json(data)
                var html = '';
                html += '<h1>'+o.title+'</h1><p>'+o.description+'</p>';
                var interests = $.isArray(o.interests.interest) ? o.interests.interest : [o.interests.interest];
                html += '<ul class="interests">';
                $.each(interests, function() {
                    html += '<li>'+this.name+'</li>';
                });
                html += '</ul>';
                html += '<div class="divider"></div>';
                html += '<div class="where"><span class="street">'+o.address.street+'</span><span class="postcode">'+o.address.postcode+'</span></div>';
                html += '<div class="when"><span class="date">'+dateFormat(o.date, 'ddd d mmm yyyy')+'</span><span class="begin-time">@'+dateFormat(o.beginTime, 'h:MM TT')+'</span></div>';
                $('#event-details .event-details').html(html);
                var latitude = o.geoLocation.latitude;
                var longitude = o.geoLocation.longitude;
                map = loadMap('#event-map', latitude, longitude);
                var latlngbounds = map.getBounds() || new google.maps.LatLngBounds(); 
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(latitude, longitude),
                    map: map
                });
	            latlngbounds.extend(marker.position);
	            map.setCenter(latlngbounds.getCenter());
	            map.fitBounds(latlngbounds); 
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        var latitude = position.coords.latitude;
                        var longitude = position.coords.longitude;
                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(latitude, longitude),
                            map: map,
                            icon: 'pics/map_me_indicator.png'
                        });
                        latlngbounds.extend(marker.position);
                        map.setCenter(latlngbounds.getCenter());
                        map.fitBounds(latlngbounds); 
                    });
                }
                return map
            },
        });
    }
}, { 
    defaultHandlerEvents: "bs"
});
