(function (window, document) {
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
  
  var _defaultTrackerName = "";
  var _trackerDataPropertyName = "d";
  
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
  
  // Get everything from the stub object that will be replaced.
  var c5t_name = (window.CurrentIntelligenceObject || "c5t");
  var c5t = ((_isString(c5t_name) && window[c5t_name]) || {});
  var c5t_queue = (c5t.q || []);
  var c5t_snippetTime = (c5t.l || 1*new Date());
  
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
   * @returns {Object} The destinatin object.
   */
  function _extendPrimitive(dst, src) {
    if (src) {
      for (var x in src) {
        if (_hasOwnProperty[str_call](src, x) && _isPrimitiveType(src[x])) {
          dst[x] = src[x];
        }
      }
    }
    return dst;
  }
  
  /**
   * The tracker constructor.
   *
   * @param {Object} [data] The tracker initial data.
   */
  function Tracker(data) {
    this[_trackerDataPropertyName] = _extendPrimitive({}, data);
    
    _DEBUG_log(c5t_name, str_create, this[_trackerDataPropertyName]);
  }
  
  var TrackerProto = Tracker[str_prototype];
  
  /**
   * @param {string} hitType Hit type (e.g. 'event').
   * @param {Object} [opt_fieldObject] The `fieldObject` overrides for this particular hit.
   */
  TrackerProto[str_send] = function (hitType, opt_fieldObject) {
    _DEBUG_log(c5t_name, str_send, this[_trackerDataPropertyName], arguments);
  };
  
  /**
   * Sets a property on the tracker.
   *
   * @param {string|Object} arg0 Either `fieldName` or `fieldObject` (and no arguments after it).
   * @param {string} [arg1] Either `fieldValue` for the `fieldName` or nothing.
   */
  TrackerProto[str_set] = function () {
    var args = _toArray[str_call](arguments);
    var data = this[_trackerDataPropertyName];
    if (_isString(args[0])) {
      data[args[0]] = args[1];
    }
    else {
      _extendPrimitive(data, args[0]);
    }
  };
  
  /**
   * Gets a property on the tracker.
   *
   * @param {string} fieldName The `fieldName`.
   */
  TrackerProto[str_get] = function (fieldName) {
    return this[_trackerDataPropertyName][fieldName];
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
    _extendPrimitive(data, args[0]);
    return (_trackersByName[data[str_name] || _defaultTrackerName] = new Tracker(data));
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
  
  // Replace with the function that makes immediate calls.
  c5t = window[c5t_name] = function () {
    return _call(arguments);
  };
  
  // Put the library methods on the `c5t` object itself.
  c5t[str_create] = _create;
  
  // Execute the queued calls.
  while (c5t_queue.length > 0) {
    _call(c5t_queue[str_shift]());
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
  
  function _onVisibilityChange() {
    var v = !!document[visibilityHiddenProperty];
    if (v !== visibilityIsHidden) {
      visibilityIsHidden = v;
      c5t('send', 'event', {
        'eventCategory': 'c5t.io',
        'eventAction': (visibilityIsHidden ? 'Background' : 'Foreground')
      });
    }
  }
  
  if (visibilityChangeEvent) {
    document[str_addEventListener] && document[str_addEventListener](visibilityChangeEvent, _onVisibilityChange);
    _onVisibilityChange();
  }
}(window, document));