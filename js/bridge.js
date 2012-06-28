// This code is copyright 24/7, Inc. and is fully protected under copyright law.
// This code may only be used pursuant to a valid license by 24/7, Inc.

var _bridge_version = "1.0"
var _bridge_build = 6;
var _bridge_iframe;

function NativeBridgeClass() {
    this.state = new Object();
    this.state.prompts = new Array();
    this.state.log = new Array();
    this.state.cancelPrompts = false;
    this.state.grammar = null;
    this.state.startRecognition = false;
    this.state.message = null;
    this.state.recoParams = null;
    this.state.getLocation = false;
    this.state.events = null;
    this.state.sendMessage = null;
    this.state.contactName = null;
    this.state.scanBarcode = null;
    this.state.hasInfo = null;

    this.stateChanged = false;
    this.grammarCallback = null;
    this.locationCallback = null;
    this.eventsCallback = null;
    this.initCallback = null;
    this.activeCallback = null;
    this.notificationCallback = null;
    this.contactsCallback = null;
    this.barcodeCallback = null;
    this.infoCallback = null;

    this.reportLogQueue = new Array();
}

NativeBridgeClass.prototype.onInitialize = function(callback) {
    this.initCallback = callback;
};

NativeBridgeClass.prototype.onActiveStateChange = function(callback) {
    this.activeCallback = callback;                                  
}
  
NativeBridgeClass.prototype.onNotification = function(callback) {
    this.notificationCallback = callback;
};

NativeBridgeClass.prototype.onInfo = function(callback) {
    this.state.hasInfo = callback == null ? false : true;                                  
    this.infoCallback = callback;
    this._notifyNative();
};

NativeBridgeClass.prototype.scanBarcode = function(params, callback) {
    this.state.scanBarcode = new Object();
    this.state.scanBarcode.params = params;
    this.barcodeCallback = callback;                                    
    this._notifyNative();
}
  
NativeBridgeClass.prototype.startRecognition = function() {
    this.state.startRecognition = true;
    this._notifyNative();
};
  
NativeBridgeClass.prototype.log = function(msg) {
    if (typeof msg == 'string')
      this.state.log.push(msg);                         
    else
      this.state.log.push(JSON.stringify(msg));                         
    this._notifyNative();
};

NativeBridgeClass.prototype.playAudio = function(prompt, voice, locale, text) {
    var obj = new Object();
    obj.url = prompt;
    obj.voice = voice;
    obj.locale = locale;
    obj.text = text
    this.state.prompts.push("prompt:"+JSON.stringify(obj));
    this._notifyNative();
};

NativeBridgeClass.prototype.playTTS = function(voice, locale, text) {
    var obj = new Object();
    obj.voice = voice;
    obj.locale = locale;
    obj.text = text
    this.state.prompts.push("tts:"+JSON.stringify(obj));
    this._notifyNative();
};

NativeBridgeClass.prototype.playSilence = function(millis) {
    var obj = new Object();
    obj.silence = millis;
    this.state.prompts.push("tts:"+JSON.stringify(obj));
    this._notifyNative();
};
  
NativeBridgeClass.prototype.cancelAudio = function() {
    this.state.cancelPrompts = true;
    this.state.prompts.length = 0;
    this._notifyNative();
};

NativeBridgeClass.prototype.setMessage = function(t) {
    this.state.message = t;
    this._notifyNative();
};

NativeBridgeClass.prototype.setGrammar = function(g, p, callback) {
    this.state.grammar = g;
    this.state.recoParams = p;
    this.grammarCallback = callback;
    this._notifyNative();
};
  
NativeBridgeClass.prototype.getLocation = function(callback) {
    this.locationCallback = callback;
    this.state.getLocation = true;
    this._notifyNative();
 };

NativeBridgeClass.prototype.getEvents = function(from, to, callback) {
    this.state.events = new Object();
    this.state.events.from = from;
    this.state.events.to = to;
    this.eventsCallback = callback;
    this._notifyNative();
};

NativeBridgeClass.prototype.getContacts = function(name, callback) {
    this.contactsCallback = callback;
    this.state.contactName = name;
    this._notifyNative();
};

NativeBridgeClass.prototype.sendMail = function(recipients, subject, body) {
    this.state.sendMessage = new Object();
    this.state.sendMessage.type = "mail";
    if (typeof recipients === "string")
      this.state.sendMessage.recipients = [ recipients ];
    else
      this.state.sendMessage.recipients = recipients;
    this.state.sendMessage.subject = subject;
    this.state.sendMessage.body = body;
    this._notifyNative();
};
  
NativeBridgeClass.prototype.sendText = function(recipients, body) {
    this.state.sendMessage = new Object();;
    this.state.sendMessage.type = "text";
    if (typeof recipients === "string")
      this.state.sendMessage.recipients = [ recipients ];
    else
      this.state.sendMessage.recipients = recipients;
    this.state.sendMessage.body = body;
    this._notifyNative();
};

NativeBridgeClass.prototype.reportLogStartSession = function() {
  var initObj = JSON.parse(localStorage.getItem("NativeBridge.initObj"));
  initObj.userAgent = navigator.userAgent;
  this._reportLog("SESSION_START", initObj);
};  

NativeBridgeClass.prototype.reportLogLocation = function(loc) {
  this._reportLog("LOCATION", o);
};  

NativeBridgeClass.prototype.reportLogScreen = function(screenId) {
  localStorage.setItem("NativeBridge.currentScreen",screenId);
  this._reportLog("SCREEN", {
    screenId : screenId
  });
};

NativeBridgeClass.prototype.reportLogEvent = function(eventName,eventType,eventAttrs) {
  var screenId = localStorage.getItem("NativeBridge.currentScreen");
  this._reportLog("EVENT", {
    screenId : screenId,
    eventName : eventName,
    eventType : eventType,
    eventAttrs : eventAttrs
  });
};

NativeBridgeClass.prototype.reportLogSurvey = function(question,answer) {
  this._reportLog("SURVEY", {
    question:question,
    answer:answer
  });
};

NativeBridgeClass.prototype.reportLogEndSession = function() {
  this._reportLog("SESSION_END", null);
};  


// The functions below are intended to be invoked only from the Native side. 
// Do not call them directly from javascript
NativeBridgeClass.prototype._initialize = function(o) {
    if (this.initCallback != null) {
      var _this = this;
      setTimeout(function(){
        localStorage.removeItem("NativeBridge.sessionId",null);
        localStorage.removeItem("NativeBridge.pendingSessionId",null);
        localStorage.removeItem("NativeBridge.currentScreen",null);
        localStorage.setItem("NativeBridge.initObj",JSON.stringify(o));
        o.bridge = new Object();
        o.bridge.version = _bridge_version;
        o.bridge.build = _bridge_build;
        _this.initCallback(o);
      }, 1);
    }
    return _bridge_version+"."+_bridge_build;
};
  
NativeBridgeClass.prototype._setActiveState = function(o) {
    if (this.activeCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.activeCallback(o);
      }, 1);
    }
};
  
NativeBridgeClass.prototype._setGrammarResult = function(result) {
    this.state.grammar = null;
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

NativeBridgeClass.prototype._setContacts = function(result) {
    if (this.contactsCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.contactsCallback(result);
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

NativeBridgeClass.prototype._setInfo = function() {
    if (this.infoCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.infoCallback();
      }, 1);
    }
};

NativeBridgeClass.prototype._setBarcode = function(result) {
    if (this.barcodeCallback != null) {
      var _this = this;
      setTimeout(function(){
        _this.barcodeCallback(result);
      }, 1);
    }
};


NativeBridgeClass.prototype._initFrame = function() {
  if (document.getElementById('NativeBridge.iframe') == null) {
    _bridge_iframe = document.createElement('iframe');
    _bridge_iframe.id = 'NativeBridge.iframe';
    _bridge_iframe.src = "about:blank";
    _bridge_iframe.style.display = 'none';
    _bridge_iframe.style.visibility = 'hidden';
    _bridge_iframe.style.width = '0';
    _bridge_iframe.style.height = '0';
    _bridge_iframe.style.border= '0';
    document.body.appendChild(_bridge_iframe);
  }
};


NativeBridgeClass.prototype._notifyNative = function() {
  if (!this.stateChanged) {                                       
    this.stateChanged = true;
    setTimeout(function() {
      if (_bridge_iframe != null) {
        _bridge_iframe.src = "about:blank";
      }
    }, 1);
  }
};


NativeBridgeClass.prototype._getState = function() {
    if (this.stateChanged) {
      this.stateChanged = false;
      var ret = JSON.stringify(this.state);
      this.state.prompts.length = 0;
      this.state.log.length = 0;
      this.state.startRecognition = false;
      this.state.cancelPrompts = false;
      this.state.getLocation = false;
      this.state.scanBarcode = null;
      this.state.events = null;
      this.state.contactName = null;
      this.state.sendMessage = null;
      this.state.hasInfo = null;
      return ret;
    }
    return null;
};

NativeBridgeClass.prototype._reportLog = function(logType, data) {
  var o = new Object();
  o.logType = logType;
  o.data = data;
  o.ts = new Date().getTime();
  this.reportLogQueue.push(o);
  this._processReportLogQueue();
};

NativeBridgeClass.prototype._processReportLogQueue = function() {
  var sessionId = localStorage.getItem("NativeBridge.sessionId");
  var initObj = JSON.parse(localStorage.getItem("NativeBridge.initObj"));
  var pendingSessionId = localStorage.getItem("NativeBridge.pendingSessionId");
  var _this = this;
  
  if (initObj == null || (pendingSessionId != null && parseInt(pendingSessionId))) {
    return;       
  } else {
    if (this.reportLogQueue.length == 0) return;
    var o = this.reportLogQueue.shift();
    if (pendingSessionId == null)
      localStorage.setItem("NativeBridge.pendingSessionId",1);
    var req=new XMLHttpRequest();
    req.open("POST", initObj.mobileservicesUrl+"/report-log", true);
    req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    req.onreadystatechange = function() {
      if (req.readyState != 4) return;
      if (req.status == 200 && req.responseText != null) {
        var sessionId = req.responseText;
        if (sessionId == null)
          localStorage.removeItem("NativeBridge.sessionId");
        else
          localStorage.setItem("NativeBridge.sessionId", sessionId);
      } 
      localStorage.setItem("NativeBridge.pendingSessionId",0);
      _this._processReportLogQueue();
    };
    req.send("ani="+encodeURIComponent(initObj.ani)+"&type="+encodeURIComponent(o.logType)+"&ts="+encodeURIComponent(o.ts)+"&data="+encodeURIComponent(JSON.stringify(o.data))+(sessionId==null?"":"&sessionId="+encodeURIComponent(sessionId)));;
  }
};

var NativeBridge = new NativeBridgeClass();




