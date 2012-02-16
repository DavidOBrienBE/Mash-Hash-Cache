/**
 * Server-side function. It will be invoked once client use $fh.act to call this function.
 * It will return whether client cached data is up to date. If no, the current data and hash will be retrived as well.
 * @param hash client-side cached hash value which is parsed as parameter. Use $params.hash to retrive it.
 */
function getMashup() {

  var response = {};
  
  // Check the cloud cache to see if we have data
  var cached = readCache();

  // No cahced data in cloud
  if( ""=== cached ) {
    
    // Get data from remote web services
    var data = doMashUp();

    // Create MD5 hash of data
    var hash = createHash($fh.stringify(data));

    // Store data and hash in cloud cache
    doCache(hash, data);

    // Build response object
    response = {'data': data, 'hash':hash, 'cached':false};
  }
  else {
    //transform cached data from string type to object type
    cached=$fh.parse(cached);
    // Check if client hash value present & correct
    if( $params.hash && $params.hash === cached.hash ) {
      // Don't need to send data back to client as hash is up to date
      response = {'hash':$params.hash, 'cached':true};
    }
    else {
      // Hash value from client missing or incorrect, return cached cloud data
      response = cached;
    }
  }

  return response;
}

function getFlickrData() {
  var response = [];
  var param = {
    url: "http://www.flickr.com/services/rest/",
    method: "POST",
    charset: "UTF-8",
    contentType: "application/x-www-form-urlencoded",
    body: "method=flickr.photos.search&api_key=" + FLICKR_API_KEY + "&sort=interestingness-desc&place_id=2367105&extras=geo%2Cmedia&per_page=" + FLICKR_LIMIT + "&format=json&nojsoncallback=1"
  }
  var res = $fh.web(param);
  //$fh.log('debug', res);
  var data = $fh.parse(res.body);
  if (data.stat == 'ok') {
    response = data.photos.photo
  }
  return response;
}
 
function getYahooData() {
  var response = [];
  var param = {
    url: "http://local.yahooapis.com/LocalSearchService/V3/localSearch",
    method: "POST",
    charset: "UTF-8",
    contentType: "application/x-www-form-urlencoded",
    body: "appid=YahooDemo&query=" + YAHOO_QUERY + "&location=boston,ma,USA&results=" + YAHOO_LIMIT + "&output=json"
  }
  var res = $fh.web(param);
  var data = $fh.parse(res.body);
  response = data.ResultSet.Result;
  return response;
}

function doMashUp() {
  var mashup = [];
 
  // Add some test placemarks so cache can be invalidated if required
  //mashup.push({type: 'test', title: 'Test 1', lat: 57.5, lon: -7.5});
  //mashup.push({type: 'test', title: 'Test 2', lat: 57, lon: -7});
  //mashup.push({type: 'test', title: 'Test 3', lat: 57.3, lon: -7.3});
 
  // Get placemarks from flickr  
  var flickr = getFlickrData();
  // Iterate over the results, adding them to the mashup
  for (var fi = 0, fl = flickr.length; fi < fl; fi++) {
    var entry = flickr[fi];
    mashup.push({
      type: 'flickr',
      title: entry.title,
      lat: entry.latitude,
      lon: entry.longitude
    });
  }
  // Get placemarks from Yahoo Local Search
  var yahoo = getYahooData();
  // Iterate over the results, adding them to the mashup
  for (var yi = 0, yl = yahoo.length; yi < yl; yi++) {
    var entry = yahoo[yi];
    mashup.push({
      type: 'yahoo',
      title: entry.Title,
      lat: entry.Latitude,
      lon: entry.Longitude
    });
  }
 
  return mashup;
}