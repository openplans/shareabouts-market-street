/*globals jQuery, L, google, Handlebars, Spinner, wax, Swag, Backbone, _ */

var Shareabouts = Shareabouts || {};

(function(NS, $, console) {
  Swag.registerHelpers();

  var minVectorZoom = 12,
      maxVectorZoom = 19,
      preventIntersectionClick = false,
      streetviewVisible = false,
      currentUser;

  // http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
  var t = function t(s,d){
   for(var p in d)
     s=s.replace(new RegExp('{{'+p+'}}','g'), d[p]);
   return s;
  };

  // Get the style rule for this feature by evaluating the condition option
  var getStyleRule = function(properties, rules) {
    var self = this,
        len, i, condition;

    for (i=0, len=rules.length; i<len; i++) {
      // Replace the template with the property variable, not the value.
      // this is so we don't have to worry about strings vs nums.
      condition = t(rules[i].condition, properties);

      // Simpler code plus a trusted source; negligible performance hit
      if (eval(condition)) {
        return rules[i];
      }
    }
    return null;
  };

  NS.smallSpinnerOptions = {
    lines: 13, length: 0, width: 3, radius: 10, corners: 1, rotate: 0,
    direction: 1, color: '#000', speed: 1, trail: 60, shadow: false,
    hwaccel: false, className: 'spinner', zIndex: 2e9, top: 'auto',
    left: 'auto'
  };

  NS.Config = {
    placeTypes: {
      'like': { label: 'Someone likes this on Market Street' },
      'dislike': { label: 'Someone dislikes this on Market Street' },
      'idea': { label: 'A prototype idea' },
    },
    placeStyles: [
      {
        condition: '"{{location_type}}" == "idea"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/sv-idea.png',
          anchor: new google.maps.Point(41,109)
        },
        focusIcon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/focused-idea.png',
          anchor: new google.maps.Point(41,109)

        }
      },
      {
        condition: '"{{location_type}}" == "like"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/sv-like.png',
          anchor: new google.maps.Point(41,109)
        },
        focusIcon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/focused-like.png',
          anchor: new google.maps.Point(41,109)

        }
      },
      {
        condition: '"{{location_type}}" == "dislike"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/sv-dislike.png',
          anchor: new google.maps.Point(41,109)
        },
        focusIcon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/focused-dislike.png',
          anchor: new google.maps.Point(41,109)

        }
      },
      {
        condition: 'true',
        newIcon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/marker-70x124-plus.png',
          anchor: new google.maps.Point(35,103)

        }
      }
    ],
    mapPlaceStyles: [
      {
        condition: '"{{location_type}}" == "idea"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/idea.png',
          anchor: new google.maps.Point(12, 12)
        }
      },
      {
        condition: '"{{location_type}}" == "like"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/like.png',
          anchor: new google.maps.Point(12, 12)
        }
      },
      {
        condition: '"{{location_type}}" == "dislike"',
        icon: {
          url: 'http://openplans.github.io/shareabouts-market-street/styles/images/markers/dislike.png',
          anchor: new google.maps.Point(12, 12)
        }
      },
    ],
    placeColors: {
      'dislike': '#dc143c',
      'like': '#4169e1',
      'idea': '#ffd700',
    },
    mapStyle: [{"featureType":"water","stylers":[{"saturation":43},{"lightness":-11},{"hue":"#0088ff"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"hue":"#ff0000"},{"saturation":-100},{"lightness":99}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#808080"},{"lightness":54}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#ccdca1"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#767676"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#ece2d9"}]},{"featureType":"poi.park","stylers":[{"visibility":"on"}]},{"featureType":"poi.park","elementType":"labels","stylers":[{"visibility":"off"}]}],
    datasetUrl: 'http://data.shareabouts.org/api/v2/sfplanning/datasets/market-street/places',
    intersections: {"0":[-122.417403286000000,37.776618322899999], "1":[-122.417305109000000,37.776695752099997], "2":[-122.417206932000000,37.776773181300001], "3":[-122.417108754000000,37.776850610300002], "4":[-122.417010577000000,37.776928039300003], "5":[-122.416912399000000,37.777005468200002], "6":[-122.416814221000000,37.777082897000000], "7":[-122.416716042999990,37.777160325700002], "8":[-122.416617864000000,37.777237754399998], "9":[-122.416519686000000,37.777315182899997], "10":[-122.416421507000000,37.777392611400003], "11":[-122.416323328000000,37.777470039800001], "12":[-122.416225148000000,37.777547468100003], "13":[-122.416126969000000,37.777624896299997], "14":[-122.416028788999990,37.777702324499998], "15":[-122.415930609000000,37.777779752500003], "16":[-122.415832429000010,37.777857180500000], "17":[-122.415734249000000,37.777934608400003], "18":[-122.415636069000000,37.778012036200003], "19":[-122.415537888000000,37.778089463900002], "20":[-122.415439707000000,37.778166891600002], "21":[-122.415341526000010,37.778244319099997], "22":[-122.415243344999990,37.778321746600000], "23":[-122.415145163000010,37.778399174000000], "24":[-122.415046981000000,37.778476601300000], "25":[-122.414948800000000,37.778554028599999], "26":[-122.414850617000000,37.778631455700001], "27":[-122.414752435000000,37.778708882799997], "28":[-122.414654252999990,37.778786309799997], "29":[-122.414556070000000,37.778863736700004], "30":[-122.414457887000000,37.778941163500001], "31":[-122.414359704000010,37.779018590200003], "32":[-122.414261520000000,37.779096016899999], "33":[-122.414163337000010,37.779173443399998], "34":[-122.414065153000000,37.779250869899997], "35":[-122.413966969000000,37.779328296300001], "36":[-122.413868785000010,37.779405722600004], "37":[-122.413770601000000,37.779483148899999], "38":[-122.413672416000000,37.779560574999998], "39":[-122.413574231000000,37.779638001099997], "40":[-122.413476046000000,37.779715427100001], "41":[-122.413377861000000,37.779792852999996], "42":[-122.413279676000000,37.779870278799997], "43":[-122.413181490000000,37.779947704599998], "44":[-122.413083304000000,37.780025130200002], "45":[-122.412985117999990,37.780102555799999], "46":[-122.412886932000010,37.780179981300002], "47":[-122.412788746000000,37.780257406700002], "48":[-122.412690559000000,37.780334832000001], "49":[-122.412592372000010,37.780412257300000], "50":[-122.412494185000000,37.780489682400002], "51":[-122.412395997999990,37.780567107499998], "52":[-122.412297811000000,37.780644532499998], "53":[-122.412199623000010,37.780721957399997], "54":[-122.412101435000000,37.780799382200001], "55":[-122.412003247000000,37.780876806999999], "56":[-122.411905059000010,37.780954231700001], "57":[-122.411806870000010,37.781031656200000], "58":[-122.411708682000000,37.781109080699999], "59":[-122.411610493000000,37.781186505199997], "60":[-122.411512304000000,37.781263929500000], "61":[-122.411414114000000,37.781341353700000], "62":[-122.411315925000000,37.781418777900001], "63":[-122.411217734999990,37.781496202000000], "64":[-122.411119545000010,37.781573625999997], "65":[-122.411021355000000,37.781651049899999], "66":[-122.410923165000000,37.781728473699999], "67":[-122.410824973999990,37.781805897500000], "68":[-122.410726784000000,37.781883321199999], "69":[-122.410628593000000,37.781960744800003], "70":[-122.410530402000010,37.782038168299998], "71":[-122.410432210000000,37.782115591699998], "72":[-122.410334019000000,37.782193014999997], "73":[-122.410235826999990,37.782270438300003], "74":[-122.410137635000000,37.782347861399998], "75":[-122.410039443000000,37.782425284500000], "76":[-122.409941251000010,37.782502707500001], "77":[-122.409843058000010,37.782580130500001], "78":[-122.409744864999990,37.782657553299998], "79":[-122.409646671999990,37.782734976100002], "80":[-122.409548478999990,37.782812398700003], "81":[-122.409450285999990,37.782889821300003], "82":[-122.409352092000010,37.782967243800002], "83":[-122.409253899000010,37.783044666300000], "84":[-122.409155705000000,37.783122088600003], "85":[-122.409057510000000,37.783199510899998], "86":[-122.408959315999990,37.783276933099998], "87":[-122.408861121000000,37.783354355100002], "88":[-122.408762927000000,37.783431777200001], "89":[-122.408664732000010,37.783509199100003], "90":[-122.408566536000000,37.783586620900003], "91":[-122.408468341000000,37.783664042700003], "92":[-122.408370145000010,37.783741464400002], "93":[-122.408271949000000,37.783818885999999], "94":[-122.408173753000000,37.783896307500001], "95":[-122.408075557000000,37.783973728900001], "96":[-122.407977360999990,37.784051150300002], "97":[-122.407879163999990,37.784128571499998], "98":[-122.407780966999990,37.784205992700002], "99":[-122.407682769999990,37.784283413799997], "100":[-122.407584572999990,37.784360834899999], "101":[-122.407486375000000,37.784438255799998], "102":[-122.407388178000010,37.784515676600002], "103":[-122.407289980000000,37.784593097399998], "104":[-122.407191782000000,37.784670518100000], "105":[-122.407093583999990,37.784747938700001], "106":[-122.406995385000000,37.784825359199999], "107":[-122.406897185999990,37.784902779699998], "108":[-122.406798987000000,37.784980200000000], "109":[-122.406700787999990,37.785057620300002], "110":[-122.406602589000000,37.785135040500002], "111":[-122.406504389999990,37.785212460600000], "112":[-122.406406190000000,37.785289880599997], "113":[-122.406307990000000,37.785367300600001], "114":[-122.406209790000010,37.785444720400001], "115":[-122.406111589000010,37.785522140200001], "116":[-122.406013388999990,37.785599559900000], "117":[-122.405915187999990,37.785676979500003], "118":[-122.405816986999990,37.785754398999998], "119":[-122.405718785999990,37.785831818500000], "120":[-122.405620584999990,37.785909237799999], "121":[-122.405522383000000,37.785986657099997], "122":[-122.405424181000000,37.786064076300001], "123":[-122.405325979000000,37.786141495400003], "124":[-122.405227776999990,37.786218914400003], "125":[-122.405129575000000,37.786296333400003], "126":[-122.405031372000000,37.786373752199999], "127":[-122.404933169000000,37.786451171000003], "128":[-122.404834966000000,37.786528589699998], "129":[-122.404736763000000,37.786606008299998], "130":[-122.404638560000000,37.786683426899998], "131":[-122.404540356000000,37.786760845300002], "132":[-122.404442152000000,37.786838263699998], "133":[-122.404343948000000,37.786915682000000], "134":[-122.404245743999990,37.786993100200000], "135":[-122.404147540000000,37.787070518299998], "136":[-122.404049335000000,37.787147936300002], "137":[-122.403951130000000,37.787225354299999], "138":[-122.403852925000000,37.787302772200000], "139":[-122.403754719999990,37.787380189899999], "140":[-122.403656514999990,37.787457607599997], "141":[-122.403558309000000,37.787535025300002], "142":[-122.403460103000000,37.787612442799997], "143":[-122.403361897000000,37.787689860299999], "144":[-122.403263691000010,37.787767277599997], "145":[-122.403165484000000,37.787844694900002], "146":[-122.403067277999990,37.787922112099999], "147":[-122.402969071000000,37.787999529300002], "148":[-122.402870863999990,37.788076946300002], "149":[-122.402772656000000,37.788154363300002], "150":[-122.402674449000000,37.788231780099999], "151":[-122.402576241000010,37.788309196900002], "152":[-122.402478032999990,37.788386613599997], "153":[-122.402379825000000,37.788464030299998], "154":[-122.402281617000000,37.788541446799996], "155":[-122.402183408000000,37.788618863300002], "156":[-122.402085199000000,37.788696279600003], "157":[-122.401986991000000,37.788773695899998], "158":[-122.401888781000000,37.788851112099998], "159":[-122.401790572000000,37.788928528299998], "160":[-122.401692363000000,37.789005944300001], "161":[-122.401594153000000,37.789083360299998], "162":[-122.401495943000000,37.789160776199999], "163":[-122.401397733000000,37.789238191999999], "164":[-122.401299522000000,37.789315607699997], "165":[-122.401201312000000,37.789393023300001], "166":[-122.401103101000000,37.789470438899997], "167":[-122.401004890000000,37.789547854299997], "168":[-122.400906679000000,37.789625269699997], "169":[-122.400808467000000,37.789702685000002], "170":[-122.400710256000000,37.789780100199998], "171":[-122.400612044000000,37.789857515400001], "172":[-122.400513832000000,37.789934930400001], "173":[-122.400415620000000,37.790012345400001], "174":[-122.400317407000000,37.790089760299999], "175":[-122.400219195000010,37.790167175100002], "176":[-122.400120982000000,37.790244589799997], "177":[-122.400022769000000,37.790322004399997], "178":[-122.399924556000000,37.790399419000003], "179":[-122.399826342000000,37.790476833500001], "180":[-122.399728129000000,37.790554247800003], "181":[-122.399629915000010,37.790631662199999], "182":[-122.399531701000000,37.790709076399999], "183":[-122.399433486000010,37.790786490499997], "184":[-122.399335272000000,37.790863904600002], "185":[-122.399237056999990,37.790941318500003], "186":[-122.399138842000000,37.791018732399998], "187":[-122.399040627000010,37.791096146199997], "188":[-122.398942412000000,37.791173559999997], "189":[-122.398844197000000,37.791250973600000], "190":[-122.398745981000000,37.791328387199997], "191":[-122.398647765000010,37.791405800699998], "192":[-122.398549548999990,37.791483214000003], "193":[-122.398451333000000,37.791560627400003], "194":[-122.398353116000000,37.791638040599999], "195":[-122.398254898999990,37.791715453700000], "196":[-122.398156683000000,37.791792866800002], "197":[-122.398058465000010,37.791870279800001], "198":[-122.397960248000000,37.791947692699999], "199":[-122.397862031000000,37.792025105500002], "200":[-122.397763813000000,37.792102518199997], "201":[-122.397665595000010,37.792179930899998], "202":[-122.397567377000000,37.792257343400003], "203":[-122.397469158000010,37.792334755900001], "204":[-122.397370940000000,37.792412168299997], "205":[-122.397272720999990,37.792489580599998], "206":[-122.397174502000000,37.792566992899999], "207":[-122.397076283000000,37.792644404999997], "208":[-122.396978064000000,37.792721817100002], "209":[-122.396879844000000,37.792799229099998], "210":[-122.396781624000000,37.792876640999999], "211":[-122.396683404000000,37.792954052799999], "212":[-122.396585184000000,37.793031464499997], "213":[-122.396486964000000,37.793108876200002], "214":[-122.396388743000000,37.793186287700003], "215":[-122.396290522000000,37.793263699199997], "216":[-122.396192301000000,37.793341110599997], "217":[-122.396094080000000,37.793418522000003], "218":[-122.395995859000000,37.793495933199999], "219":[-122.395897637000000,37.793573344400002], "220":[-122.395799415000000,37.793650755400002], "221":[-122.395701192999990,37.793728166400001], "222":[-122.395602971000000,37.793805577299999], "223":[-122.395504747999990,37.793882988100002], "224":[-122.395406526000000,37.793960398899998], "225":[-122.395308302999990,37.794037809499997], "226":[-122.395210080000000,37.794115220099997], "227":[-122.395111857000000,37.794192630600001], "228":[-122.395013633000000,37.794270040999997], "229":[-122.394915409000010,37.794347451400000], "230":[-122.394817184999990,37.794424861600000] }
  };

  NS.Router = Backbone.Router.extend({
    routes: {
      ':id': 'showPlace',
      'intersection/:id': 'showIntersection',
      'filter/:locationType': 'filterPlaces',
      '': 'index'
    },

    showPlace: function(id) {
      var self = this,
          placeModel = new NS.PlaceModel({id: id});
      placeModel.urlRoot = NS.Config.datasetUrl;

      // Get the info for this place id
      placeModel.fetch({
        success: function(model, response, options) {
          var lat = model.get('intersection_lat'),
              lng = model.get('intersection_lng');

          // Existing places don't have intersection data, so this is a more
          // graceful fallback.
          if (!lat || !lng) {
            console.warn('Place', id, 'does not have an intersection.');
            self.navigate('', {replace: true});
            return;
          }

          // Show the street view
          loadStreetView([parseFloat(lat), parseFloat(lng)],
            model.get('intersection_id'), model);

        },
        error: function() {
          // No place found for this id, clear the id from the url. No history.
          self.navigate('', {replace: true});
        }
      });
    },

    showIntersection: function(id) {
      var intersection = NS.Config.intersections[id],
          lat, lng;

      if (intersection) {
        lat = intersection[1];
        lng = intersection[0];

        // Show the street view
        loadStreetView([lat, lng], id);
      } else {
        // No place found for this id, clear the id from the url. No history.
        this.navigate('', {replace: true});
      }
    },

    filterPlaces: function(locationType) {
      $('.place-type-li[data-locationtype="'+locationType+'"]').addClass('active');
      NS.filter = {'location_type': locationType};
      resetPlaces();

      // Remove old features
      NS.map.data.forEach(function(feature) {
        NS.map.data.remove(feature);
      });

      // Load new places
      // NOTE: this is currently when the filter is set, regardless of
      // current zoom level. May need refactoring.
      loadMinZoomPlaces();

      // Remove the place raster layer
      NS.map.overlayMapTypes.forEach(function(overlay) {
        if (overlay.name === 'visionzero_places') {
          overlay.setOpacity(0);
        }
      });
    },

    index: function(locationType) {
      // No current filter, but there was one previously
      if (NS.filter) {
        NS.filter = null;
      }

      resetPlaces();
    }
  });

  function getIntersectionFileUrl(intersectionId) {
    var count, i, dataFilePath;

    dataFilePath = 'data/';
    for (count = 0, i = intersectionId.length - 2;
         count < 2; ++i, ++count) {
      dataFilePath += intersectionId[i] + '/';
    }
    dataFilePath += intersectionId + '.json';

    return dataFilePath;
  }

  // Allow an optional parameter for focusing on a place
  function loadStreetView(intersectionLatLng, intersectionId, lookAtPlaceModel) {
    var panoPosition, heading;

    // This global indicates that the streetview is currently visible. This is
    // good for things like hiding the summary infowindow on a small map.
    streetviewVisible = true;

    // Get the intersection data file
    // $.ajax({
    //   url: getIntersectionFileUrl(intersectionId),
    //   dataType: 'json',
    //   success: function(intersection) {
    //     var html = NS.Templates['intersection-detail'](intersection);
    //     $('.shareabouts-intersection-detail').html(html);
    //   },
    //   error: function() {
    //     $('.shareabouts-intersection-detail').empty();
    //   }
    // });

    // Show the streetview container
    $('.shareabouts-streetview-container').addClass('active');
    $('.shareabouts-location-map-container').removeClass('active');

    NS.streetview = new NS.StreetView({
      el: '.shareabouts-streetview',
      map: {
        center: intersectionLatLng,
        maxDistance: '100m',
        streetViewControl: false
      },
      placeStyles: NS.Config.placeStyles,
      datasetUrl: NS.Config.datasetUrl,
      addButtonLabel: 'Share an Idea',
      maxDistance: 25,
      newPlaceInfoWindow: {
        content: '<strong>Drag me to the location of your idea.</strong>'
      },
      currentUser: currentUser,

      templates: NS.Templates
    });

    // When the place panel is shown, update the url with the id
    $(NS.streetview).on('showplace', function(evt, view) {
      NS.router.navigate(view.model.id.toString());
    });

    // When the place panel is closed, clear the id from the url
    $(NS.streetview).on('closeplace', function(evt, view) {
      NS.router.navigate('');
    });

    // When a place is added to the internal streetview collection, add it
    // to our collection so it shows up on the map.
    NS.streetview.placeCollection.on('add', function(model) {
      NS.mapPlaceCollection.add(model);
    });

    // Init the spinner (not shown) when a place survey is shown. This is
    // necessary since it's JS.
    $(NS.streetview).on('showplacesurvey', function(evt, view) {
      var spinner = new Spinner(NS.smallSpinnerOptions).spin(view.$('.form-spinner')[0]);
    });

    $(NS.streetview).on('showplaceform', function(evt, view) {
      // Set the intersection information on the form when it is shown
      view.$('[name="intersection_id"]').val(intersectionId);
      view.$('[name="intersection_lat"]').val(intersectionLatLng[0]);
      view.$('[name="intersection_lng"]').val(intersectionLatLng[1]);
    });

    // Change the POV if we need to be looking at a marker.
    if (lookAtPlaceModel) {
      // Origin
      panoPosition = NS.streetview.panorama.getPosition();
      // From the origin to the place
      heading = google.maps.geometry.spherical.computeHeading(panoPosition,
        new google.maps.LatLng(lookAtPlaceModel.get('geometry').coordinates[1],
          lookAtPlaceModel.get('geometry').coordinates[0]));

      // Look at the place
      NS.streetview.panorama.setPov({heading: heading, pitch: NS.streetview.panorama.getPov().pitch});
      // Show the panel with details
      NS.streetview.showPlace(lookAtPlaceModel);
    }

    // Center the map on the intersection (making sure the map knows what size
    // it is first)
    resetMap(NS.map, {
      center: {lat: intersectionLatLng[0], lng: intersectionLatLng[1]},
      pan: true
    });

    // Add a marker to the map (or move it if it already exists)
    NS.currentMarker = NS.currentMarker || new google.maps.Marker({});
    NS.currentMarker.setMap(NS.map);
    NS.currentMarker.setPosition({lat: intersectionLatLng[0], lng: intersectionLatLng[1]});

    // Remove the summary info window from the map
    NS.summaryWindow.close();

    // Update the url
    if (!lookAtPlaceModel) {
      NS.router.navigate('intersection/'+intersectionId);
    }
  }

  function resetMap(map, options) {
    options = options || {};
    _.defaults(options, {
      center: map.getCenter(),
      pan: false,
      resize: true
    });

    if (options.resize) {
      google.maps.event.trigger(map, 'resize');
    }

    var centerFunc = _.bind(options.pan ? map.panTo : map.setCenter, map);
    centerFunc(options.center);
  }

  function loadMinZoomPlaces(pageNum) {
    var data = _.extend({}, NS.filter, {page: pageNum});

    $.ajax({
      url: NS.Config.datasetUrl,
      dataType: 'json',
      data: data,
      success: function(geojson) {
        var locationType,i;

        if (geojson.features.length > 0) {
          locationType = geojson.features[0].properties.location_type;
        }

        if (locationType === NS.filter.location_type) {
          NS.map.data.addGeoJson(geojson);

          // if this is the first page and there are more than one
          if (geojson.metadata.page === 1 && geojson.metadata.num_pages > 1) {
            for(i=2; i<=geojson.metadata.num_pages; i++) {
              loadMinZoomPlaces(i);
            }
          }
        }
      }
    });
  }

  // Set the style rules for the data layer
  function setMinZoomPlaceStyle(overrides) {
    NS.map.data.setStyle(function(feature) {
      var style = _.extend({
        icon: {
          clickable: false,
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: NS.Config.placeColors[feature.getProperty('location_type')],
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1
        }
      }, overrides);

      return style;
    });
  }

  function resetPlaces() {
    var zoom = NS.map.getZoom(),
        center = NS.map.getCenter();

    if (zoom < minVectorZoom) {
      // Zoomed out... clear the collection/map
      NS.mapPlaceCollection.reset();

      if (NS.filter) {
        setMinZoomPlaceStyle({visible: true});
      } else {
        setMinZoomPlaceStyle({visible: false});
      }
    } else {
      // Apply the attribute filter if it exists
      var data = _.extend({
        near: center.lat()+','+center.lng(),
        distance_lt: '800m'
      }, NS.filter);

      setMinZoomPlaceStyle({visible: false});

      // Zoomed in... get some places
      NS.mapPlaceCollection.fetchAllPages({
        data: data
      });
    }
  }

  function initMap() {
    var map = new google.maps.Map($('.shareabouts-location-map').get(0), {
          center: new google.maps.LatLng(37.7854838, -122.4061001),
          zoom: 15,
          minZoom: 12,
          maxZoom: 19,
          streetViewControl: false,
          panControl: false,
          mapTypeControl: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: NS.Config.mapStyle,
          zoomControl: false
        }),
        markers = {},
        summaryWindow = new google.maps.InfoWindow({
          disableAutoPan: true
        }),
        summaryWindowTid,
        autocomplete = new google.maps.places.Autocomplete(
          document.getElementById('shareabouts-map-search'), {
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(37.769663, -122.430739),
              new google.maps.LatLng(37.794728, -122.390270)),
            componentRestrictions: {country: 'us'},
            types: ['geocode']
          });

    // Make these accessible outside of this function
    NS.map = map;
    NS.mapPlaceCollection = new NS.PlaceCollection();
    NS.summaryWindow = summaryWindow;

    // This has to be set directly, not via the options
    NS.mapPlaceCollection.url = NS.Config.datasetUrl;

    // Bind zoom-in/out to our custom buttons
    $('.shareabouts-zoom-in').click(function(evt) {
      evt.preventDefault();
      map.setZoom(map.getZoom() + 1);
    });
    $('.shareabouts-zoom-out').click(function(evt) {
      evt.preventDefault();
      map.setZoom(map.getZoom() - 1);
    });

    // Set the style rules for the data layer
    setMinZoomPlaceStyle();

    // Map layer with dangerous cooridors and crashes
    var crashDataMapType = new google.maps.ImageMapType({
      name: 'visionzero_crashdata',
      getTileUrl: function(coord, zoom) {
        function getRandomInt (min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        var subdomains = ['a', 'b', 'c', 'd'];
        return ['http://', subdomains[getRandomInt(0, 3)], '.tiles.mapbox.com/v3/openplans.MarketStreet/',
            zoom, '/', coord.x, '/', coord.y, '.png'].join('');
      },
      tileSize: new google.maps.Size(256, 256),
      // https://code.google.com/p/gmaps-api-issues/issues/detail?id=6191
      maxZoom: 19,
      minZoom: 15
    });

    map.overlayMapTypes.push(crashDataMapType);

    // Map layer of places (min zoom levels)
    var placesMapType = new google.maps.ImageMapType({
      name: 'visionzero_places',
      getTileUrl: function(coord, zoom) {
        function getRandomInt (min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        var subdomains = ['a', 'b', 'c', 'd'];
        return ['http://', subdomains[getRandomInt(0, 3)], '.tiles.mapbox.com/v3/openplans.161VisionZeroPlaces/',
            zoom, '/', coord.x, '/', coord.y, '.png'].join('');
      },
      tileSize: new google.maps.Size(256, 256),
      // https://code.google.com/p/gmaps-api-issues/issues/detail?id=6191
      maxZoom: 15,
      minZoom: 11
    });

    map.overlayMapTypes.push(placesMapType);

    // Interactive tile layer hosted on mapbox.com. NOTE: wax is a DEPRECATED
    // library, but still better for styling+interactivity than Fusion Tables.
    // NOTE, that despite the name, this is just the intersections now.
    wax.tilejson('http://a.tiles.mapbox.com/v3/openplans.marketst_intersections.json', function(tilejson) {
      map.overlayMapTypes.insertAt(1, new wax.g.connector(tilejson));
      wax.g.interaction()
        .map(map)
        .tilejson(tilejson)
        .on({
          on: function(obj) {
            // On mouse over, including clicks
            map.setOptions({ draggableCursor: 'pointer' });
            if (obj.e.type === 'click' && !preventIntersectionClick) {
              // If not a double click
              if (obj.e.detail === 1) {
                loadStreetView([obj.data.YCOORD, obj.data.XCOORD], obj.data.NodeID_1);
              }
            }
          },
          off: function(evt) {
            // On mouse out
            map.setOptions({ draggableCursor: 'url(http://maps.google.com/mapfiles/openhand.cur), move' });
          }
        });
    });

    // Listen for autocomplete selection
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(16);
      }
    });

    // Change the map instructions based on the zoom level
    // Decide if we should switch to vector markers
    google.maps.event.addListener(map, 'zoom_changed', resetPlaces);

    // Fetch places for this new area
    google.maps.event.addListener(map, 'dragend', resetPlaces);

    // On model add, put a new styled marker on the map
    NS.mapPlaceCollection.on('add', function(model, collection) {
      var geom = model.get('geometry'),
          position = new google.maps.LatLng(geom.coordinates[1], geom.coordinates[0]),
          styleRule = getStyleRule(model.toJSON(), NS.Config.mapPlaceStyles),
          marker;

      // Create and cache the map marker
      if (styleRule && !markers[model.id]) {
        markers[model.id] = new google.maps.Marker({
          position: position,
          map: map,
          icon: styleRule.icon
        });

        // Show a summary info window when the user hovers over the marker for
        // at least 500ms
        google.maps.event.addListener(markers[model.id], 'mouseover', function(evt) {
          // Already planning to show another summary. Cancel it.
          if (summaryWindowTid) {
            clearTimeout(summaryWindowTid);
          }

          if (!streetviewVisible) {
            // Show the summary info window in 500ms
            summaryWindowTid = setTimeout(function() {
              // close the shared window if it's already open
              summaryWindow.close();

              // set the window content
              summaryWindow.setOptions({
                content: NS.Templates['place-summary'](model.toJSON())
              });

              // show the window
              summaryWindow.open(map, markers[model.id]);

              // reset the timeout id
              summaryWindowTid = null;
            }, 500);
          }
        });

        // I moused off a marker before it was shown, so cancel it.
        google.maps.event.addListener(markers[model.id], 'mouseout', function(evt) {
          if (summaryWindowTid) {
            clearTimeout(summaryWindowTid);
          }
        });

        // Focus on the place when it's clicked
        google.maps.event.addListener(markers[model.id], 'click', function(evt) {
          // This doesn't really do anything useful.
          evt.stop();

          // Okay. This is global to app. There's a problem with wax (DEPRECATED)
          // where if I click on a Google Marker that the wax interaction fires
          // too. This is bad because the map marker triggers an action (show
          // the place details) first, but then the interaction triggers its
          // action (reload the Streetview). So, we're setting a global flag
          // that tell the wax click handler whether it should trigger its
          // action. After 350ms, we allow it to work normally.
          preventIntersectionClick = true;
          setTimeout(function() {
            preventIntersectionClick = false;
          }, 350);

          // Show the place details
          NS.router.navigate(model.id.toString(), {trigger: true});
        });
      }
    });

    // The collection was cleared, so clear the markers from the map and cache
    NS.mapPlaceCollection.on('reset', function() {
      _.each(markers, function(marker, key) {
        // from the map
        marker.setMap(null);
        // from the cache
        delete markers[key];
      });
    });

    // A filter was applied to a non-empty collection, so remove the other
    // markers individually
    NS.mapPlaceCollection.on('remove', function(model, collection, options) {
      if (markers[model.id]) {
        markers[model.id].setMap(null);
        delete markers[model.id];
      }
    });

    // Exit button on Street View to dismiss it and return to the map
    $(document).on('click', '.close-streetview-button', function(evt) {
      // Show the map container
      $('.shareabouts-streetview-container').removeClass('active');
      // Empty out the Street View div, for good measure
      $('.shareabouts-streetview').empty();
      // $('.shareabouts-intersection-detail').empty();
      // Get rid of the map marker
      NS.currentMarker.setMap(null);
      // Show the map panel
      $('.shareabouts-location-map-container').addClass('active');
      // Resize the map to make sure it's the right size
      resetMap(map);
      // Remove any event handlers - important to prevent zombie street views
      $(NS.streetview).off();
      // Set the flag
      streetviewVisible = false;
    });
  }

  // Ready set go!
  $(function() {
    // Hide all of the interactivity
    if (NS.readonly) {
      $('body').addClass('shareabouts-readonly');
    }

    // Init the map
    initMap();

    // Init interactivity on the place type selector in the place form.
    $(document).on('click', '.place-type-selector', function(evt){
      var $target = $(evt.currentTarget),
          $clicked = $(evt.target).closest('li'),
          isOpen = $target.hasClass('is-open'),
          value = $clicked.attr('data-value'),
          $input = $('[name="location_type"]');

      if(isOpen){
        // Set the value of the hidden input
        $input.val(value);

        // Set the selected type as active
        $target.find('li').removeClass('active');
        $clicked.addClass('active');

        // Close the list
        $target.removeClass('is-open');

        if (value === 'idea') {
          $('.type-instructions').addClass('is-hidden');
          $('.idea-type-instructions').removeClass('is-hidden');
          $('#place-description').prop('required', true);
          $('label[for="place-description"] small').addClass('is-hidden'); // the '(optional)' text
        } else if (value === 'dislike') {
          $('.type-instructions').addClass('is-hidden');
          $('.dislike-type-instructions').removeClass('is-hidden');
          $('#place-description').prop('required', true);
          $('label[for="place-description"] small').addClass('is-hidden'); // the '(optional)' text
        } else if (value === 'like') {
          $('.type-instructions').addClass('is-hidden');
          $('.like-type-instructions').removeClass('is-hidden');
          $('#place-description').prop('required', true);
          $('label[for="place-description"] small').addClass('is-hidden'); // the '(optional)' text
        } else {
          $('.type-instructions').addClass('is-hidden');
          $('#place-description').prop('required', false);
          $('label[for="place-description"] small').removeClass('is-hidden'); // the '(optional)' text
        }

        // Make sure to bring the selector back into view
        $('label[for="place-location_type"]').get(0).scrollIntoView(false);

      } else {
        $target.addClass('is-open');
      }
    });

    // Init interactivity on the reply link on the place form.
    $(document).on('click', '.reply-link', function(evt) {
      evt.preventDefault();
      $('.survey-comment')
        .focus()
        .get(0).scrollIntoView();
    });

    // Init auth menu toggle
    $(document).on('click', '.shareabouts-auth-button', function(evt) {
      evt.preventDefault();
      $('.shareabouts-auth-menu').toggleClass('is-exposed');
    });

    // Init fullscreen toggle
    $(document).on('click', '.shareabouts-fullscreen-button', function(evt) {
      evt.preventDefault();
      $('body').toggleClass('shareabouts-fullscreen');
      google.maps.event.trigger(NS.map, 'resize');
      google.maps.event.trigger(NS.streetview.panorama, 'resize');
    });

    // Init click events for location type filtering
    $(document).on('click', '.place-type-li', function(evt) {
      var $this = $(this),
          locationType = $this.attr('data-locationtype'),
          $links = $('.place-type-li');

      $links.removeClass('active');

      if (NS.filter && NS.filter.location_type === locationType) {
        NS.router.navigate('/', {trigger: true});
        return;
      }

      $this.addClass('active');
      NS.router.navigate('filter/'+locationType, {trigger: true});
    });

    NS.auth = new Shareabouts.Auth({
      apiRoot: 'http://data.shareabouts.org/api/v2/',
      successPage: '/map-auth-success',
      errorPage: '/map-auth-error'
    });

    $(NS.auth).on('authsuccess', function(evt, data) {
      currentUser = data;
      if (NS.streetview) {
        NS.streetview.setUser(data);
      }
    });

    NS.auth.initUser();

    // Init the router so we can link to places.
    NS.router = new NS.Router();
    Backbone.history.start({root: window.location.pathname});
  });
}(Shareabouts, jQuery, Shareabouts.Util.console));