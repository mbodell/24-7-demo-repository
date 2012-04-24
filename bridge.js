
var _bridge_version = "1.0"
var _bridge_build = 1;

function NativeBridgeClass() {
    this.state = new Object();
    this.state.prompts = new Array();
    this.state.cancelPrompts = false;
    this.state.grammar = "";
    this.state.startRecognition = false;
    this.state.message = "";
    this.state.recoParams = null;
    this.state.getLocation = false;
    this.state.eventsFrom = -1;
    this.state.eventsTo = -1;

    this.stateChanged = false;
    this.grammarCallback = null;
    this.locationCallback = null;
    this.eventsCallback = null;
    this.initCallback = null;
    this.notificationCallback = null;
}

NativeBridgeClass.prototype.onInitialize = function(callback) {
    this.initCallback = callback;
};
  
NativeBridgeClass.prototype.onNotification = function(callback) {
    this.notificationCallback = callback;
};
  
NativeBridgeClass.prototype.startRecognition = function() {
    this.stateChanged = true;
    this.state.startRecognition = true;
};
  
NativeBridgeClass.prototype.playAudio = function(prompt) {
    this.stateChanged = true;
    this.state.prompts.push(prompt);
};

NativeBridgeClass.prototype.playTTS = function(voice, locale, text) {
    this.stateChanged = true;
    var obj = new Object();
    obj.voice = voice;
    obj.locale = locale;
    obj.text = text
    this.state.prompts.push("tts:"+JSON.stringify(obj));
};

NativeBridgeClass.prototype.playSilence = function(millis) {
    this.stateChanged = true;
    var obj = new Object();
    obj.silence = millis;
    this.state.prompts.push("tts:"+JSON.stringify(obj));
};
  
NativeBridgeClass.prototype.cancelAudio = function() {
    this.stateChanged = true;
    this.state.cancelPrompts = true;
    this.state.prompts.length = 0;
};

NativeBridgeClass.prototype.setMessage = function(t) {
    this.stateChanged = true;
    this.state.message = t == null ? "" : t;  		 
};

NativeBridgeClass.prototype.setGrammar = function(g, p, callback) {
    this.stateChanged = true;
    this.state.grammar = g == null ? "" : g;
    this.state.recoParams = p;
    this.grammarCallback = callback;
};
  
NativeBridgeClass.prototype.getLocation = function(callback) {
    this.stateChanged = true;
    this.locationCallback = callback;
    this.state.getLocation = true;
 };

NativeBridgeClass.prototype.getEvents = function(from, to, callback) {
    this.stateChanged = true;
    this.eventsCallback = callback;
    this.state.eventsFrom = from;
    this.state.eventsTo = to;
};
  
  // The functions below are intended to be invoked only from the Native side. 
  // Do not call them directly from javascript
NativeBridgeClass.prototype._initialize = function(o) {
    if (this.initCallback != null) {
      var _this = this;
      setTimeout(function(){
	o.bridge = new Object();
        o.bridge.version = _bridge_version;
	o.bridge.build = _bridge_build;
        _this.initCallback(o);
      }, 1);
    }
};
  
NativeBridgeClass.prototype._setGrammarResult = function(result) {
    this.state.grammar = "";
    this.state.recoParams = null;
    if (this.grammarCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.grammarCallback(result);
      }, 1);
    }
};
  
NativeBridgeClass.prototype._setLocation = function(result) {
    if (this.locationCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.locationCallback(result);
      }, 1);
    }
};

NativeBridgeClass.prototype._setEvents = function(result) {
    if (this.eventsCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.eventsCallback(result);
      }, 1);
    }
};

NativeBridgeClass.prototype._setNotification = function(result) {
    if (this.notificationCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.notificationCallback(result);
      }, 1);
    }
};

NativeBridgeClass.prototype._getState = function() {
    if (this.stateChanged) {
      this.stateChanged = false;
      var ret = JSON.stringify(this.state);
      this.state.prompts.length = 0;
      this.state.startRecognition = false;
      this.state.cancelPrompts = false;
      this.state.getLocation = false;
      this.state.eventsFrom = -1;
      this.state.eventsTo = -1;
      return ret;
    }
    return null;
};

var NativeBridge = new NativeBridgeClass();
NativeBridge.initialize();


