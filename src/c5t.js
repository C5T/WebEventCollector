(function (window, document, navigator) {
  'use strict';
  
  var str_call = "call";
  var str_apply = "apply";
  var str_indexOf = "indexOf";
  var str_prototype = "prototype";
  var str_shift = "shift";
  var str_create = "create";
  var str_send = "send";
  var str_set = "set";
  var str_get = "get";
  var str_trackingId = "trackingId";
  var str_cookieDomain = "cookieDomain";
  var str_name = "name";
  var str_addEventListener = "addEventListener";
  var str_trackEnterExit = "trackEnterExit";
  var str_trackForegroundBackground = "trackForegroundBackground";
  var str_xhr = "xhr";
  var str_image = "image";
  var str_beacon = "beacon";
  var str_transport = "transport";
  var str_hitCallback = "hitCallback";
  var str_useBeacon = "useBeacon";
  var str_hitType = "hitType";
  
  var _defaultTrackerName = "";
  var _trackerStatePropertyName = "s";
  
  var _snippetQueuePropertyName = "q";
  var _snippetTimePropertyName = "l";
  
  // WARNING: Do not use "l" or "q" for this name.
  var _loadedPropertyName = "loaded";
  
  var _hasOwnProperty = {}.hasOwnProperty;
  var _toArray = [].slice;
  
  var _primitiveTypes = [
    "number",
    "string",
    "object",
    "boolean"
  ];
  
  // A collection of trackers by name.
  var _trackersByName = {};
  var _trackersArray = [];
  
  // Get everything from the stub object that will be replaced.
  var c5t_name = (window.CurrentIntelligenceObject || "c5t");
  var c5t = ((_isString(c5t_name) && window[c5t_name]) || {});
  var c5t_snippetQueue = (c5t[_snippetQueuePropertyName] || []);
  var c5t_snippetTime = (c5t[_snippetTimePropertyName] || 1*new Date());
  
  // Do not load and initialize the library twice.
  if (c5t && c5t[_loadedPropertyName]) {
    return;
  }
  
  function _DEBUG_log() {
    try {
      var args = _toArray[str_call](arguments);
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
    return (void 0 != value && -1 < (value.constructor+"")[str_indexOf]("String"));
  }
  
  /**
   * Checks if the passed in value is of a primitive data type (e.g. a 'number' or a 'boolean').
   *
   * @param {*} value The value to check.
   * @returns {boolean}
   */
  function _isPrimitiveType(value) {
    return (-1 < _primitiveTypes.indexOf(typeof value));
  }
  
  /**
   * Shallow extend of one object with another.
   * Does not propagate non-primitive data types to the destination.
   *
   * @param {Object} dst The destination object.
   * @param {Object} [src] The source object.
   * @param {Function} [predicate] The predicate to check if the property should be copied.
   * @returns {Object} The destination object.
   */
  function _extend(dst, src, predicate) {
    if (src) {
      for (var x in src) {
        if (_hasOwnProperty[str_call](src, x) && (predicate ? predicate(src[x], x) : true)) {
          dst[x] = src[x];
        }
      }
    }
    return dst;
  }
  
  var _transports = {};
  
  _transports[str_xhr] = function (baseUrl, payloadString, callbackFn) {
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
  
  _transports[str_image] = function (baseUrl, payloadString, callbackFn) {
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
    _transports[str_beacon] = function (baseUrl, payloadString, callbackFn) {
      navigator.sendBeacon(baseUrl, payloadString);
      setTimeout(callbackFn, 0);
    };
  }
  
  /**
   * Serializes the hit info into application/x-www-form-urlencoded format.
   *
   * @param {Object} trackerState The current state of the tracker.
   * @param {string} hitType The hit type, e.g. 'event' or 'pageview'.
   * @param {Object} [fieldObject] The overrides for this particular hit.
   * @returns {string} The serialized hit info.
   */
  function _serializeHit(trackerState, hitType, fieldObject) {
    var payload = _extend(_extend({}, trackerState), fieldObject);
    payload[str_hitType] = hitType;
    delete payload[str_trackingId];
    delete payload[str_useBeacon];
    delete payload[str_transport];
    var payloadString = '';
    for (var x in payload) {
      if (_hasOwnProperty[str_call](payload, x) && _isPrimitiveType(payload[x])) {
        payloadString += (
          (payloadString ? '&' : '') +
          encodeURIComponent(x) + '=' +
          encodeURIComponent(payload[x])
        );
      }
    }
    return payloadString;
  }
  
  function _determineTransport(baseUrl, payloadString) {
    return _transports[(payloadString.length >= (2048 - baseUrl.length - 1) ? str_xhr : str_image)];
  }
  
  function _noop() {}
  
  /**
   * The tracker constructor.
   */
  function Tracker() {
    this[_trackerStatePropertyName] = {};
  }
  
  var TrackerProto = Tracker[str_prototype];
  
  /**
   * @param {string} hitType Hit type (e.g. 'event').
   * @param {Object} [opt_fieldObject] The `fieldObject` overrides for this particular hit.
   */
  TrackerProto[str_send] = function (hitType, opt_fieldObject) {
    var options = opt_fieldObject || {};
    var trackerState = this[_trackerStatePropertyName];
    // TODO(sompylasar): Update the API endpoint URL when the backend is ready.
    var baseUrl = '//localhost:4000/log/' + trackerState[str_trackingId];
    var payloadString = _serializeHit(trackerState, hitType, opt_fieldObject);
    var transportFn = (
      _transports[options[str_transport] || (options[str_useBeacon] && str_beacon)]
      || _determineTransport(baseUrl, payloadString)
    );
    var callbackFn = options[str_hitCallback];
    if (!callbackFn || !callbackFn[str_apply]) {
      callbackFn = _noop;
    }
    _DEBUG_log(c5t_name, str_send, payloadString);
    transportFn(baseUrl, payloadString, callbackFn);
  };
  
  /**
   * Sets a property on the tracker.
   *
   * @param {string|Object} arg0 Either `fieldName` or `fieldObject` (and no arguments after it).
   * @param {string} [arg1] Either `fieldValue` for the `fieldName` or nothing.
   */
  TrackerProto[str_set] = function () {
    var args = _toArray[str_call](arguments);
    var data = this[_trackerStatePropertyName];
    if (_isString(args[0])) {
      data[args[0]] = args[1];
    }
    else {
      _extend(data, args[0], _isPrimitiveType);
    }
  };
  
  /**
   * Gets a property on the tracker.
   *
   * @param {string} fieldName The `fieldName`.
   */
  TrackerProto[str_get] = function (fieldName) {
    return this[_trackerStatePropertyName][fieldName];
  };
  
  /**
   * Creates a tracker.
   *
   * @param {string|Object} arg0 Either `trackingId` or `opt_configObject` (and no arguments after it).
   * @param {string|Object} [arg1] Either `cookieDomain` or `opt_configObject` (and no arguments after it).
   * @param {Object} [arg2] The `opt_configObject`.
   */
  function _create() {
    var args = _toArray[str_call](arguments);
    var data = {};
    if (_isString(args[0])) {
      data[str_trackingId] = args[str_shift]();
    }
    if (_isString(args[0])) {
      data[str_cookieDomain] = args[str_shift]();
    }
    _extend(data, args[0], _isPrimitiveType);
    var trackerName = (data[str_name] || _defaultTrackerName);
    var tracker = (_trackersByName[trackerName] || new Tracker());
    tracker.set(data);
    if (!_trackersByName[trackerName]) {
      _trackersByName[trackerName] = tracker;
      _trackersArray.push(tracker);
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
    args = _toArray[str_call](args);
    var fnName = args[str_shift]();
    if (fnName === str_create) {
      return _create[str_apply](null, args);
    }
    var tracker = _trackersByName[_defaultTrackerName];
    if (tracker) {
      var fn = tracker[fnName];
      if (fn && fn[str_apply]) {
        return fn[str_apply](tracker, args);
      }
    }
  }
  
  /**
   * Loops through all trackers.
   *
   * @param {function(tracker:Tracker,index:number,trackers:Array.<Tracker>)} callback
   */
  function _forEachTracker(callback) {
    for (var ic = _trackersArray.length, i = 0; i < ic; ++i) {
      callback(_trackersArray[i], i, _trackersArray);
    }
  }
  
  // Replace with the function that makes immediate calls.
  c5t = window[c5t_name] = function () {
    return _call(arguments);
  };
  
  c5t[_loadedPropertyName] = true;
  
  // Put the library methods on the `c5t` object itself.
  c5t[str_create] = _create;
  
  // Execute the queued calls.
  while (c5t_snippetQueue.length > 0) {
    _call(c5t_snippetQueue[str_shift]());
  }
  
  // Start auto-tracking via Page Visibility API.
  var visibilityHiddenProperty = (
    'hidden' in document ? 'hidden' :
    'webkitHidden' in document ? 'webkitHidden' :
    'mozHidden' in document ? 'mozHidden' :
    null
  );
  var visibilityStateProperty = (
    'visibilityState' in document ? 'visibilityState' :
    'webkitVisibilityState' in document ? 'webkitVisibilityState' :
    'mozVisibilityState' in document ? 'mozVisibilityState' :
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
        tracker.set('isForeground', !visibilityIsHidden);
        if (tracker.get(str_trackForegroundBackground)) {
          tracker.send('event', {
            'eventCategory': 'c5t.io',
            'eventAction': (visibilityIsHidden ? 'Background' : 'Foreground')
          });
        }
      });
    }
  }
  
  function _onEnter() {
    // Send 'Enter' event once per library load.
    // Send after draining the queue to give the user time to create at least one tracker.
    _forEachTracker(function (tracker) {
      if (tracker.get(str_trackEnterExit)) {
        tracker.send('event', {
          'eventCategory': 'c5t.io',
          'eventAction': 'Enter'
        });
      }
    });
  }
  
  if (visibilityChangeEvent) {
    _forEachTracker(function (tracker) {
      tracker.set('isForeground', !document[visibilityHiddenProperty]);
    });
    document[str_addEventListener] && document[str_addEventListener](visibilityChangeEvent, _onVisibilityChanged);
    _onEnter();
    _onVisibilityChanged();
  }
  else {
    _forEachTracker(function (tracker) {
      tracker.set('trackForegroundBackgroundUnsupported', true);
    });
    _onEnter();
  }
  
  function _onWindowUnload() {
    _forEachTracker(function (tracker) {
      if (tracker.get(str_trackEnterExit)) {
        tracker.send('event', {
          'eventCategory': 'c5t.io',
          'eventAction': 'Exit',
          'transport': 'beacon'
        });
      }
    });
  }
  
  window[str_addEventListener] && window[str_addEventListener]('unload', _onWindowUnload);
}(window, document, navigator));