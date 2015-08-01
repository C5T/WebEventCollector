(function (window) {
  'use strict';
  
  var STR_document = "document";
  var STR_navigator = "navigator";
  var STR_cookie = "cookie";
  var STR_call = "call";
  var STR_apply = "apply";
  var STR_indexOf = "indexOf";
  var STR_prototype = "prototype";
  var STR_shift = "shift";
  var STR_push = "push";
  var STR_split = "split";
  var STR_join = "join";
  var STR_match = "match";
  var STR_length = "length";
  var STR_create = "create";
  var STR_version = "version";
  var STR_send = "send";
  var STR_set = "set";
  var STR_get = "get";
  var STR_trackingId = "trackingId";
  var STR_clientId = "clientId";
  var STR_userId = "userId";
  var STR_cookieName = "cookieName";
  var STR_cookieDomain = "cookieDomain";
  var STR_cookiePath = "cookiePath";
  var STR_cookieExpires = "cookieExpires";
  var STR_name = "name";
  var STR_addEventListener = "addEventListener";
  var STR_trackEnterExit = "trackEnterExit";
  var STR_trackForegroundBackground = "trackForegroundBackground";
  var STR_xhr = "xhr";
  var STR_image = "image";
  var STR_beacon = "beacon";
  var STR_transport = "transport";
  var STR_useBeacon = "useBeacon";
  var STR_hitCallback = "hitCallback";
  var STR_timestamp = "timestamp";
  var STR_hitType = "hitType";
  var STR_event = "event";
  var STR_eventCategory = "eventCategory";
  var STR_eventAction = "eventAction";
  var STR_eventLabel = "eventLabel";
  var STR_eventValue = "eventValue";
  var STR_isForeground = "isForeground";
  var STR_isForegroundUnsupported = "isForegroundUnsupported";
  
  var document = window[STR_document];
  var navigator = window[STR_navigator];
  
  var C5T_EVENT_CATEGORY = 'C5T';
  var C5T_EVENT_ACTION_ENTER = 'En';
  var C5T_EVENT_ACTION_EXIT = 'Ex';
  var C5T_EVENT_ACTION_FOREGROUND = 'Fg';
  var C5T_EVENT_ACTION_BACKGROUND = 'Bg';
  
  // TODO(sompylasar): Update the API endpoint URL when the backend is ready.
  var C5T_DATADROP_URL = '//localhost:4000/datadrop/v1/';
  
  /**
   * The internal name of the default `tracker` object.
   * Not intended for using by the user's code.
   * 
   * @const {string}
   */
  var DEFAULT_TRACKER_NAME = "";
  
  /**
   * The internal name of the property on the `tracker` objects 
   * that contain the tracker state.
   * Not intended for reading from the user's code.
   * 
   * @const {string}
   */
  var TRACKER_STATE_PROPERTY_NAME = "s";
  
  /**
   * The name of the property on the `c5t` global object 
   * that collects the calls to the library until it's loaded.
   * WARNING: Do not change for backwards compatibility with the snippet.
   *
   * @const {string}
   */
  var C5T_QUEUE_PROPERTY_NAME = "q";
  
  /**
   * The name of the property on the `c5t` global object 
   * that contains the timestamp of when the snippet has executed.
   * WARNING: Do not change for backwards compatibility with the snippet.
   * 
   * @const {string}
   */
  var C5T_TIME_PROPERTY_NAME = "l";
  
 /**
  * The name of the property on the `c5t` global object 
  * that contains the timestamp of when the snippet has executed.
  * WARNING: Do not change for backwards compatibility with the snippet.
  * 
  * @const {string}
  */
  var C5T_VERSION_PROPERTY_NAME = "v";
  
  /**
   * The name of the property on the `c5t` global object 
   * that says the library is loaded.
   * WARNING: Do not use the above names because they are already taken by the snippet code.
   *
   * @const {string}
   */
  var C5T_LOADED_FLAG_PROPERTY_NAME = "loaded";
  
  /**
   * The maximum URL length for GET requests.
   *
   * @const {number}
   */
  var URL_MAX_LENGTH = 2048;
  
  /**
   * The list of properties to serialize and send to the backend.
   * The values are the optimized (shortened) names for the listed properties.
   * The rest of properties won't be sent to the backend.
   *
   * @const {Object.<string,string>}
   */
  var SERIALIZABLE_PROPERTIES = {};
  SERIALIZABLE_PROPERTIES[STR_timestamp] = "_t";
  SERIALIZABLE_PROPERTIES[STR_hitType] = "t";
  SERIALIZABLE_PROPERTIES[STR_eventCategory] = "ec";
  SERIALIZABLE_PROPERTIES[STR_eventAction] = "ea";
  SERIALIZABLE_PROPERTIES[STR_eventLabel] = "el";
  SERIALIZABLE_PROPERTIES[STR_eventValue] = "ev";
  SERIALIZABLE_PROPERTIES[STR_isForeground] = "fg";
  SERIALIZABLE_PROPERTIES[STR_isForegroundUnsupported] = "fgu";
  // The tracking ID is the part of the URL for now, so we don't put it into the payload.
  //SERIALIZABLE_PROPERTIES[STR_trackingId] = "tid";
  SERIALIZABLE_PROPERTIES[STR_clientId] = "cid";
  SERIALIZABLE_PROPERTIES[STR_userId] = "uid";
  
  // Shorthands for utility functions.
  var _hasOwnProperty = {}.hasOwnProperty;
  var _toArray = [].slice;
  var _objectToString = {}.toString;
  
  // A collection of trackers by name.
  var _trackersByName = {};
  var _trackersArray = [];
  
  // Get everything from the stub object that will be replaced.
  var c5t_name = (window.CurrentIntelligenceObject || "c5t");
  var c5t = ((_isString(c5t_name) && window[c5t_name]) || {});
  var c5t_snippetQueue = (c5t[C5T_QUEUE_PROPERTY_NAME] || []);
  var c5t_snippetTime = (c5t[C5T_TIME_PROPERTY_NAME] || 0);
  var c5t_snippetVersion = (c5t[C5T_VERSION_PROPERTY_NAME] || 0);
  
  // Do not load and initialize the library twice.
  if (c5t && c5t[C5T_LOADED_FLAG_PROPERTY_NAME]) {
    return;
  }
  
  function _DEBUG_log() {
    try {
      var args = _toArray[STR_call](arguments);
      args.unshift('[' + (1*new Date()) + ']');
      console && console.log && console.log.apply(console, args);
    }
    catch (ex) {}
  }
  
  /**
   * Checks if the passed in value is a string.
   *
   * @param {*} value The value to check.
   * @returns {boolean}
   */
  function _isString(value) {
    return (void 0 != value && "[object String]" === _objectToString.call(value));
  }
  
  /**
   * Checks if the passed in value is a `Date`.
   *
   * @param {*} value The value to check.
   * @returns {boolean}
   */
  function _isDate(value) {
    return (void 0 != value && "[object Date]" === _objectToString.call(value));
  }
  
  /**
   * Shallow extend of one object with another.
   * Does not propagate non-primitive data types to the destination.
   *
   * @param {Object} dst The destination object.
   * @param {Object} [src] The source object.
   * @returns {Object} The destination object.
   */
  function _extend(dst, src) {
    if (src) {
      for (var x in src) {
        if (_hasOwnProperty[STR_call](src, x)) {
          dst[x] = src[x];
        }
      }
    }
    return dst;
  }
  
  /**
   * A map of available transports.
   * The API is compatible with Google Analytics.
   * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#transport
   *
   * @var {Object.<string,function(baseUrl:string,payloadString:string,callbackFn:Function)>}
   */
  var _transports = {};
  
  /**
   * A `POST` transport via `XMLHttpRequest`.
   */
  _transports[STR_xhr] = function (baseUrl, payloadString, callbackFn) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        xhr.onreadystatechange = null;
        xhr = null;
        callbackFn();
      }
    };
    // Use synchronous request.
    xhr.open('POST', baseUrl, false);
    xhr.send(payloadString);
  };
  
  /**
   * A `GET` transport via `Image`.
   */
  _transports[STR_image] = function (baseUrl, payloadString, callbackFn) {
    var image = new Image();
    image.onload = image.onerror = function () {
      image.onload = image.onerror = null;
      image = null;
      callbackFn();
    };
    image.src = baseUrl + '?' + payloadString;
  };
  
  // If the `sendBeacon` API is not supported we don't add the transport implementation.
  if (navigator.sendBeacon) {
    /**
     * A `POST` transport via `sendBeacon`.
     */
    _transports[STR_beacon] = function (baseUrl, payloadString, callbackFn) {
      navigator.sendBeacon(baseUrl, payloadString);
      setTimeout(callbackFn, 0);
    };
  }
  
  function _serializeValue(value) {
    return (
      value === true ? "1" :
      value === false ? "0" :
      void 0 == value ? "" :
      _isDate(value) ? 1*value :
      String(value)
    );
  }
  
  /**
   * Serializes the hit info into a string.
   *
   * @param {Object} trackerState The state of the tracker.
   * @param {string} hitType The hit type, e.g. 'event' or 'pageview'.
   * @param {Object} [fieldObject] The overrides for this particular hit.
   * @returns {string} The serialized hit info.
   */
  function _serializeHit(trackerState, hitType, fieldObject) {
    var payload = _extend(_extend({}, trackerState), fieldObject);
    payload[STR_timestamp] = (1*new Date());
    payload[STR_hitType] = hitType;
    var payloadString = '';
    // Only serialize whitelisted properties.
    for (var x in SERIALIZABLE_PROPERTIES) {
      if (_hasOwnProperty[STR_call](SERIALIZABLE_PROPERTIES, x) && _hasOwnProperty[STR_call](payload, x)) {
        payloadString += (
          (payloadString ? '&' : '') +
          encodeURIComponent(SERIALIZABLE_PROPERTIES[x]) + '=' +
          encodeURIComponent(_serializeValue(payload[x]))
        );
      }
    }
    return payloadString;
  }
  
  /**
   * Determines the optimal transport to send the passed payload.
   *
   * @param {string} baseUrl The base URL.
   * @param {string} payloadString The payload.
   * @returns {function(baseUrl:string,payloadString:string,callbackFn:Function)} The transport.
   */
  function _determineTransport(baseUrl, payloadString) {
    return _transports[((baseUrl[STR_length] + 1 + payloadString[STR_length]) >= URL_MAX_LENGTH ? STR_xhr : STR_image)];
  }
  
  /**
   * The do-nothing function.
   */
  function _noop() {}
  
  
  function _readCookie(name) {
    var c = decodeURIComponent(document[STR_cookie])[STR_split](";");
    name = new RegExp("^\\s*" + name + "=\\s*(.*?)\\s*$");
    for (var d = 0; d < c[STR_length]; d++) {
      var match = c[d][STR_match](name);
      if (match) {
        return match[1];
      }
    }
  }
  
  function _writeCookie(name, value, path, domain, expiresInMs) {
    // TODO(sompylasar): GA limits the cookie value length with 1200 bytes.
    var cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=" + path + "; ";
    if (typeof expiresInMs === "number") {
      cookie += "expires=" + (new Date(1*new Date() + expiresInMs)).toGMTString() + "; ";
    }
    // TODO(sompylasar): Add "auto" domain.
    if (domain === "auto") {
      domain = void 0;
    }
    if (domain && "none" != domain) {
      cookie += "domain=" + domain + ";";
    }
    document[STR_cookie] = cookie;
    // TODO(sompylasar): GA checks if the cookie value has been actually written.
  }
  
  /**
   * Some hashing algorithm from GA analytics.js source.
   */
  function _calcHash(a) {
    var b = 1, c = 0, d;
    if (a) {
      for (b = 0, d = a[STR_length] - 1; 0 <= d; d--) {
        c = a.charCodeAt(d),
        b = (b << 6 & 268435455) + c + (c << 14),
        c = b & 266338304,
        b = 0 != c ? b ^ c >> 21 : b;
      }
    }
    return b;
  }
  
  /**
   * Some footprinting algorithm from GA analytics.js source.
   */
  function _calcFootprint() {
    for (
      var a =  +
        (document[STR_cookie] ? document[STR_cookie] : "") +
        (document.referrer ? document.referrer : ""),
      b = a[STR_length],
      c = window.history[STR_length];
      0 < c;
    ) {
      a += c-- ^ b++;
    }
    return _calcHash(a);
  }
  
  
  var C5T_COOKIE_VERSION = '1';
  
  function _serializeCookie(tracker) {
    var clientId = tracker[STR_get](STR_clientId);
    if (!clientId) {
      return;
    }
    
    var cookieValue = [
      'v' + '=' + encodeURIComponent(C5T_COOKIE_VERSION),
      SERIALIZABLE_PROPERTIES[STR_clientId] + '=' + encodeURIComponent(clientId)
    ][STR_join]('&');
    
    _writeCookie(
      tracker[STR_get](STR_cookieName),
      cookieValue,
      tracker[STR_get](STR_cookiePath),
      tracker[STR_get](STR_cookieDomain),
      tracker[STR_get](STR_cookieExpires)
    );
  }
  
  function _deserializeCookie(tracker) {
    var cookieValue = _readCookie(tracker[STR_get](STR_cookieName));
    var pairs = (cookieValue && cookieValue[STR_split]('&')) || [];
    var versionMatched = false;
    var clientId;
    for (var ic = pairs.length, i = 0; i < ic; ++i) {
      var pair = pairs[i][STR_split]('=');
      pair[1] = decodeURIComponent(pair[1]);
      if (pair[0] === 'v' && C5T_COOKIE_VERSION === pair[1]) {
        versionMatched = true;
      }
      if (pair[0] === SERIALIZABLE_PROPERTIES[STR_clientId]) {
        clientId = pair[1];
      }
    }
    if (versionMatched && clientId) {
      tracker[STR_set](STR_clientId, clientId);
    }
    else {
      tracker[STR_set](STR_clientId, _calcFootprint());
    }
  }
  
  function _removeCookie(tracker) {
    _writeCookie(
      tracker[STR_get](STR_cookieName),
      "deleted",
      tracker[STR_get](STR_cookiePath),
      tracker[STR_get](STR_cookieDomain),
      -1E10
    );
  }
  
  
  /**
   * The tracker constructor.
   */
  function Tracker() {
    var trackerState = this[TRACKER_STATE_PROPERTY_NAME] = {};
    
    // Fill in the defaults.
    trackerState[STR_cookieName] = "_c5t";
    trackerState[STR_cookiePath] = "/";
    trackerState[STR_cookieExpires] = 63072E3;
    
    // Make the tracking of c5t-specific events enabled by default.
    trackerState[STR_trackEnterExit] = true;
    trackerState[STR_trackForegroundBackground] = true;
    
    _deserializeCookie(this);
    _serializeCookie(this);
  }
  
  var TrackerProto = Tracker[STR_prototype];
  
  /**
   * Send the hit with the tracker state and the data.
   * The API is compatible with Google Analytics.
   * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/method-reference#send
   *
   * @param {string} hitType Hit type (e.g. 'event').
   * @param {Object} [opt_fieldObject] The `fieldObject` overrides for this particular hit.
   */
  TrackerProto[STR_send] = function (hitType, opt_fieldObject) {
    var options = opt_fieldObject || {};
    var trackerState = this[TRACKER_STATE_PROPERTY_NAME];
    var baseUrl = C5T_DATADROP_URL + trackerState[STR_trackingId];
    var payloadString = _serializeHit(trackerState, hitType, opt_fieldObject);
    var transportFn = (
      _transports[options[STR_transport] || (options[STR_useBeacon] && STR_beacon)]
      || _determineTransport(baseUrl, payloadString)
    );
    var callbackFn = options[STR_hitCallback];
    if (!callbackFn || !callbackFn[STR_apply]) {
      callbackFn = _noop;
    }
    _DEBUG_log(c5t_name, STR_send, payloadString);
    transportFn(baseUrl, payloadString, callbackFn);
  };
  
  /**
   * Sets a property on the tracker.
   * The API is compatible with Google Analytics.
   * @see https://developers.google.com/analytics/devguides/collection/analyticsjs/method-reference#set
   *
   * @param {string|Object} args_0 Either `fieldName` or `fieldObject` (and no arguments after it).
   * @param {string} [args_1] Either `fieldValue` for the `fieldName` or nothing.
   */
  TrackerProto[STR_set] = function (args_0, args_1) {
    _removeCookie(this);
    var trackerState = this[TRACKER_STATE_PROPERTY_NAME];
    if (_isString(args_0)) {
      trackerState[args_0] = args_1;
    }
    else {
      _extend(trackerState, args_0);
    }
    _serializeCookie(this);
  };
  
  /**
   * Gets a property on the tracker.
   *
   * @param {string} fieldName The `fieldName`.
   * @returns {*} The value.
   */
  TrackerProto[STR_get] = function (fieldName) {
    return this[TRACKER_STATE_PROPERTY_NAME][fieldName];
  };
  
  /**
   * Creates a tracker.
   *
   * @param {string|Object} args_0 Either `trackingId` or `opt_configObject` (and no arguments after it).
   * @param {string|Object} [args_1] Either `cookieDomain` or `opt_configObject` (and no arguments after it).
   * @param {Object} [args_2] The `opt_configObject`.
   */
  function _create(args_0, args_1, args_2) {
    var configObject = {};
    if (_isString(args_0)) {
      configObject[STR_trackingId] = args_0;
      args_0 = args_1;
      args_1 = args_2;
    }
    if (_isString(args_0)) {
      configObject[STR_cookieDomain] = args_0;
      args_0 = args_1;
      args_1 = args_2;
    }
    _extend(configObject, args_0);
    var trackerName = (configObject[STR_name] || DEFAULT_TRACKER_NAME);
    var tracker = (_trackersByName[trackerName] || new Tracker());
    tracker[STR_set](configObject);
    if (!_trackersByName[trackerName]) {
      _trackersByName[trackerName] = tracker;
      _trackersArray[STR_push](tracker);
    }
    return tracker;
  }
  
  /**
   * Calls a library or tracker method.
   *
   * @param {Arguments} args The arguments to call the method with.
   * @returns {*} The return value of the called method.
   */
  function _call(args) {
    args = _toArray[STR_call](args);
    var fnName = args[STR_shift]();
    if (fnName === STR_create) {
      return _create[STR_apply](null, args);
    }
    var tracker = _trackersByName[DEFAULT_TRACKER_NAME];
    if (tracker) {
      var fn = tracker[fnName];
      if (fn && fn[STR_apply]) {
        return fn[STR_apply](tracker, args);
      }
    }
  }
  
  /**
   * Loops through all trackers.
   *
   * @param {function(tracker:Tracker,index:number,trackers:Array.<Tracker>)} callback
   */
  function _forEachTracker(callback) {
    for (var ic = _trackersArray[STR_length], i = 0; i < ic; ++i) {
      callback(_trackersArray[i], i, _trackersArray);
    }
  }
  
  // Replace the function that queues the calls with the one that makes immediate calls.
  c5t = window[c5t_name] = function () {
    return _call(arguments);
  };
  
  // Put the library methods on the `c5t` object itself.
  c5t[STR_create] = _create;
  
  // Designate the library as loaded.
  c5t[C5T_LOADED_FLAG_PROPERTY_NAME] = true;
  
  // Execute the queued calls.
  while (c5t_snippetQueue[STR_length] > 0) {
    _call(c5t_snippetQueue[STR_shift]());
  }
  
  // User presense tracking via Page Visibility API.
  var STR_hidden = 'hidden';
  var STR_webkitHidden = 'webkitHidden';
  var STR_mozHidden = 'mozHidden';
  var STR_visibilityState = 'visibilityState';
  var STR_webkitVisibilityState = 'webkitVisibilityState';
  var STR_mozVisibilityState = 'mozVisibilityState';
  
  var visibilityHiddenProperty = (
    STR_hidden in document ? STR_hidden :
    STR_webkitHidden in document ? STR_webkitHidden :
    STR_mozHidden in document ? STR_mozHidden :
    null
  );
  
  var visibilityStateProperty = (
    STR_visibilityState in document ? STR_visibilityState :
    STR_webkitVisibilityState in document ? STR_webkitVisibilityState :
    STR_mozVisibilityState in document ? STR_mozVisibilityState :
    null
  );
  
  var visibilityChangeEvent = (
    visibilityHiddenProperty &&
    visibilityHiddenProperty.replace(/hidden/i, 'visibilitychange')
  );
  
  var visibilityIsHidden;
  
  function _onVisibilityChanged() {
    var v = !!document[visibilityHiddenProperty];
    if (v !== visibilityIsHidden) {
      visibilityIsHidden = v;
      
      _forEachTracker(function (tracker) {
        tracker.set(STR_isForeground, !visibilityIsHidden);
        if (tracker.get(STR_trackForegroundBackground)) {
          var fieldObject = {};
          fieldObject[STR_eventCategory] = C5T_EVENT_CATEGORY;
          fieldObject[STR_eventAction] = (visibilityIsHidden ? C5T_EVENT_ACTION_BACKGROUND : C5T_EVENT_ACTION_FOREGROUND);
          tracker.send(STR_event, fieldObject);
        }
      });
    }
  }
  
  function _onEnter() {
    // Send 'Enter' event once per library load.
    // Send after draining the queue to give the user time to create at least one tracker.
    _forEachTracker(function (tracker) {
      if (tracker.get(STR_trackEnterExit)) {
        var fieldObject = {};
        fieldObject[STR_eventCategory] = C5T_EVENT_CATEGORY;
        fieldObject[STR_eventAction] = C5T_EVENT_ACTION_ENTER;
        tracker.send(STR_event, fieldObject);
      }
    });
  }
  
  if (visibilityChangeEvent) {
    _forEachTracker(function (tracker) {
      tracker.set(STR_isForeground, !document[visibilityHiddenProperty]);
    });
    _onEnter();
    _onVisibilityChanged();
    document[STR_addEventListener] && document[STR_addEventListener](visibilityChangeEvent, _onVisibilityChanged);
  }
  else {
    _forEachTracker(function (tracker) {
      tracker.set(STR_isForegroundUnsupported, true);
    });
    _onEnter();
  }
  
  function _onWindowUnload() {
    _forEachTracker(function (tracker) {
      if (tracker.get(STR_trackEnterExit)) {
        var fieldObject = {};
        fieldObject[STR_eventCategory] = C5T_EVENT_CATEGORY;
        fieldObject[STR_eventAction] = C5T_EVENT_ACTION_EXIT;
        fieldObject[STR_transport] = STR_beacon;
        tracker.send(STR_event, fieldObject);
      }
    });
  }
  
  window[STR_addEventListener] && window[STR_addEventListener]('unload', _onWindowUnload);
}(window));