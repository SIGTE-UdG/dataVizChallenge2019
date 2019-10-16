var map = L.map('map',{
  minZoom:12
}).setView([41.403081, 2.1777954], 14);

map.setMaxBounds([
    [41.309551,2.019795],
    [41.497023,2.28175]
]);


//basemap layer
var basemapGrey = L.tileLayer('https://api.mapbox.com/styles/v1/josepsitjar/ck0xpy0xd1ewc1cmzdo07t0ie/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiam9zZXBzaXRqYXIiLCJhIjoiNXhaUDE0byJ9.f72o2M2gG-g0TqZlIemYvg', {
  attribution: '<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons BY </a>| &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
  tileSize: 512,
  zoomOffset: -1
}).addTo(map);



// Tilelayer mapbox NDVI Barcleona
// Amb tippecannoe convertim json a mbtiles, i exportem a mapbox
var ndviLayer = L.tileLayer('https://api.mapbox.com/styles/v1/josepsitjar/cjrqgkxvz3qa82sr5dvtmdpv2/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiam9zZXBzaXRqYXIiLCJhIjoiNXhaUDE0byJ9.f72o2M2gG-g0TqZlIemYvg', {
    tileSize: 512,
    zoomOffset: -1
});

// layer barris temperatura
function getColorBarris(d) {
		return d > 46 ? '#7d191a' :
				d > 44  ? '#d7191c' :
				d > 40  ? '#f69053' :
				d > 36  ? '#ffdf9a' :
							'#def2b4';
}

//style barris temperatura
function style(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.8,
			fillColor: getColorBarris(feature.properties._mean)
		};
	}

geojson = L.geoJson(tempBarris, {
		style: style,
    attribution:"OpenData Barcelona",
    onEachFeature: function(feature, layer) {
      layer.bindTooltip('<b>'+feature.properties.NOM+ '</b>'+ '<br>'+feature.properties._mean.toFixed(2) + ' ºC',{
        sticky:true
      });
    }
	});


// layer barris vegetation coverage
function getColorBarrisVeg(d) {
		return d > 80 ? '#00441b' :
				d > 60  ? '#2a924a' :
				d > 40  ? '#7bc87c' :
				d > 20  ? '#caeac3' :
							'#e2fbd7';
}

function styleBarrisVeg(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.8,
			fillColor: getColorBarrisVeg(feature.properties.NDVI_join_coverage)
		};
	}

geojsonBarrisCoverage = L.geoJson(barrisCoverage, {
		style: styleBarrisVeg,
    attribution:"OpenData Barcelona",
    onEachFeature: function(feature, layer) {
      layer.bindTooltip('<b>'+feature.properties.n_barri+ '</b>'+ '<br>'+feature.properties.NDVI_join_coverage.toFixed(2) + ' %',{
        sticky:true
      });
    }
	});



var layerTemp;
setTimeout(function(){

  const rasterUrl = "http://localhost/app/temperatura_barcelona/tif/0607_temp_4_color.tif";

  parseGeoraster(rasterUrl).then(georaster => {
    const { noDataValue } = georaster;
    var pixelValuesToColorFn = values => {
      if (values[1]==255) {
        return 'rgba(133,33,33,0)';
      } else {
        const [r, g, b] = values;
        return `rgba(${r},${g},${b},1)`;
      }
    };
    const resolution = 64;
    layerTemp = new GeoRasterLayer({
      attribution: "OpenData Barcelona",
      georaster, pixelValuesToColorFn, resolution, opacity:0.8
    });


    layerTemp.addTo(map);
    ndviLayer.addTo(map);
    var overlayMaps = {
        //"Land Surface Temperature (LST)": layerTemp,
        //"Vegetation <div class='block-conent-layer-list'></div>": ndviLayer,
        //"Average LST (ºc)": geojson,
        //"Vegetation cover (%)": geojsonBarrisCoverage
    };

    L.control.layers(null,overlayMaps,{collapsed:false, position:'topright'}).addTo(map);
    $(".leaflet-control-layers-list").prepend("<div class='subtitle'><b>Comparing green areas with built-up areas</b></div>");
    $(".leaflet-control-layers-list").prepend("<div class='title'><b>How vegetation affects the temperature in your city?</b><hr></div>");

    $(".leaflet-control-layers-list").append($('.layer-form'));
    $(".block-conent-layer-list").append("<div class='subtitle-2'><br><b>...and in your neighborhood</b></div>");

    $(".leaflet-control-layers-list").append('<br>');

  });
}, 100);





/*control layers*/
$(document).ready(function(){
  $( "#lst" ).prop( "checked", true );
  $( "#vegetation" ).prop( "checked", true );
  $( "#averageLST" ).prop( "checked", false );
  $( "#vegetationCover" ).prop( "checked", false );

  //create legend on load page
  generateLegend(['#abdda4', '#ffffbf', '#f69053', '#d7191c', '#670d29'],[35, 40, 45, 50, 55], "legend-lst", "legendboxes-lst", " ºC", "ºC +");
  generateLegend(['#28821c'],['Vegetation'], "legend-ndvi", "legendboxes-ndvi", "", "");

  $('#lst').change(function() {

    if($('#lst').is(':checked')){
      if($('#vegetation').is(':checked')){
        map.removeLayer(ndviLayer);
        map.addLayer(layerTemp);
        map.addLayer(ndviLayer);
      }

      map.addLayer(layerTemp);
      map.removeLayer(geojsonBarrisCoverage);
      map.removeLayer(geojson);
      $( "#averageLST" ).prop( "checked", false );
      $( "#vegetationCover" ).prop( "checked", false );

      $( ".legendboxes-temp" ).hide();
      $( ".legendboxes-vcover" ).hide();
      generateLegend(['#ffffbf', '#f69053', '#d7191c', '#670d29'],[40, 45, 50, 55], "legend-lst", "legendboxes-lst", " ºC", "ºC +");
    }else{
      map.removeLayer(layerTemp);
      $( ".legendboxes-lst" ).addClass('remover').fadeOut(300);
    }
  });

  $('#vegetation').change(function() {
    if($('#vegetation').is(':checked')){
      map.addLayer(ndviLayer);
      map.removeLayer(geojsonBarrisCoverage);
      map.removeLayer(geojson);
      $( "#averageLST" ).prop( "checked", false );
      $( "#vegetationCover" ).prop( "checked", false );

      $( ".legendboxes-temp" ).hide();
      $( ".legendboxes-vcover" ).hide();
      generateLegend(['#28821c'],['Vegetation'], "legend-ndvi", "legendboxes-ndvi", "", "");
    }else{
      map.removeLayer(ndviLayer);
      $( ".legendboxes-ndvi" ).addClass('remover').fadeOut(300);
    }
  });

  $('#averageLST').change(function() {
    if($('#averageLST').is(':checked')){
      map.addLayer(geojson);
      map.removeLayer(ndviLayer);
      map.removeLayer(geojsonBarrisCoverage);
      map.removeLayer(layerTemp);
      $( "#lst" ).prop( "checked", false );
      $( "#vegetation" ).prop( "checked", false );
      $( "#vegetationCover" ).prop( "checked", false );

      $( ".legendboxes-ndvi" ).hide();
      $( ".legendboxes-vcover" ).hide();
      $( ".legendboxes-lst" ).hide();
      generateLegend(['#def2b4', '#ffdf9a', '#f69053', '#d7191c', '#7d191a'],[25, 35, 40, 45, 50], "legend-temp", "legendboxes-temp", " ºC", "ºC +");
    }else{
      map.removeLayer(geojson);
      $( ".legendboxes-temp" ).addClass('remover').fadeOut(300);
    }
  });

  $('#vegetationCover').change(function() {
    if($('#vegetationCover').is(':checked')){
      map.addLayer(geojsonBarrisCoverage);
      map.removeLayer(ndviLayer);
      map.removeLayer(geojson);
      map.removeLayer(layerTemp);
      $( "#lst" ).prop( "checked", false );
      $( "#vegetation" ).prop( "checked", false );
      $( "#averageLST" ).prop( "checked", false );

      $( ".legendboxes-lst" ).hide();
      $( ".legendboxes-ndvi" ).hide();
      $( ".legendboxes-temp" ).hide();
      generateLegend(['#e2fbd7', '#caeac3', '#7bc87c', '#2a924a', '#00441b'],[25, 35, 40, 45, 50], "legend-vcover", "legendboxes-vcover", " %", " %");

    }else{
      map.removeLayer(geojsonBarrisCoverage);
      $( ".legendboxes-vcover" ).addClass('remover').fadeOut(300);
    }
  });

});


function generateLegend(colors, grades, classToAppend, classBoxes, unit1, unit2){
  for (var i = 0; i < colors.length; i++) {
      $('.'+classToAppend+'').append('<div class='+classBoxes+'><i style="background: '+colors[i]+'"></i>'+grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + ' '+unit1+'<br>' : ''+unit2+'<br><br>')+'</div>');
  }

}



map.on('overlayadd', function(layer) {

  var layerNames = ['Vegetation cover (%)', 'Average LST (ºc)', 'Vegetation'];
  if(layer.name === layerNames[0]){
    setTimeout(function(){
      map.removeLayer(ndviLayer);
      map.removeLayer(geojson);
    },10);
  } else if(layer.name === layerNames[1]){
    setTimeout(function(){
      map.removeLayer(ndviLayer);
      map.removeLayer(geojsonBarrisCoverage);
    },10);
  }else if(layer.name === layerNames[2]){
    setTimeout(function(){
      map.removeLayer(geojson);
      map.removeLayer(geojsonBarrisCoverage);
    },10);
  }
});



var buttonStorymap = L.control({position:'bottomleft'});
buttonStorymap.onAdd = function(map){
  var div = L.DomUtil.create('div', 'buttonStroymap');

  div.innerHTML += '<a href="https://uploads.knightlab.com/storymapjs/8ef33cdca766bd401d6c52381ffa19ac/how-vegetation-affects-to-temperature-in-your-city/index.html" target="_blank"><img src="./img/buto-storymap2.png" width="140px"></a>';

  return div;
}

buttonStorymap.addTo(map);



// easy button
L.easyButton('fa-info-circle fa-lg', function(btn, map){
    //alert('info projecte');
    $('#mymodal').modal('show');
}).addTo(map);
