 var EXPORT_INTERVAL = 30000;//ms between each uploaded file
 
 /*****************************************************************
 * 
 * Iterator Class and functions
 * 
 ****************************************************************/
var Iterator = function(array){
     function setKeymap(){
         this.keymap = null;
         if (typeof this.data === "object"){
             this.keymap = Object.keys(this.data);
             this.isObject = true;
         }
     }

     this.data = array;
     this.keymap = setKeymap();
     this.index = 0;
 };

 Iterator.prototype.at = function(index){
     if (this.keymap){
         return this.data[this.keymap[index]];
     } else {
         return this.data[index];
     }
 };

 Iterator.prototype.getKey = function(){
     if (this.keymap){
         return this.keymap[this.index];
     } else {
         return this.index;
     }
 };

 Iterator.prototype.getValue = function(){
     return this.at([this.index]);
 };

 Iterator.prototype.next = function(){
     this.index++;
     if (this.isObject){
         return (this.index < this.keymap.length);
     } else {
         return (this.index < this.data.length);
     }

 };

 Iterator.prototype.hasNext = function(){
     if (this.isObject){
         return (this.index + 1 < this.keymap.length);
     } else {
         return (this.index + 1 < this.data.length);
     }
 };

 Iterator.prototype.previous = function(){
     this.index--;
     return (this.index >= 0);

 };

 Iterator.prototype.hasPrevious = function(){
     return (this.index > 0);
 };
 
 Iterator.prototype.clone = function(){
     var retIt = new Iterator(this.data);
     retIt.index = this.index;
     return retIt;
 };
 
 /*****************************************************************
 * 
 * TenthSecondTimer Class and functions
 * 
 ****************************************************************/
 var TenthSecondTimer = function(stoptime, functions){
     this.curTime = 0;
     this.funcs = functions;
     this.clock = {};
     this.stoptime = stoptime;
 };

 TenthSecondTimer.prototype.start = function(){
     var _this = this;
     this.clock = window.setInterval(function(){
         if (!_this.funcs){
             return;
         }
         if (_this.curTime in _this.funcs){
             _this.funcs[_this.curTime]();
         }
         if (_this.curTime >= _this.stoptime){
             clearInterval(_this.clock);
         }
         _this.curTime++;
     }, 100);
 };

 TenthSecondTimer.prototype.destroy = function(){
     this.stop();
     this.funcs = null;
     this.clock = null;
 };

 TenthSecondTimer.prototype.stop = function(){
     clearInterval(this.clock);
     this.curTime = 0;
 };

 TenthSecondTimer.prototype.pause = function(){
     clearInterval(this.clock);
 };
 
 TenthSecondTimer.prototype.setCounter = function(newTime){
     this.curTime = newTime;
 };
 
 TenthSecondTimer.prototype.getCounter = function(){
     return this.curTime;
 };
 
 
 /*****************************************************************
 * 
 * AudioRecorder Class and functions
 * 
 ****************************************************************/
var AudioRecorder = function(exportCallback, stopCallBack){
    this.audioContext = null;
    this.audioInput = null;
    this.recorder1 = null;
    this.recorder2 = null;
    this.activeRecorder = null;
    this.recorderNumber = null;
    this.bufferSwitchFunc = null;
    this.initialize();
    this.hasAudio = false;
    this.isRecording = false;
    this.playback = null;
    this.exportFunc = exportCallback;
    this.stopFunc = stopCallBack;
    this.seriesNumber = 0;
};

AudioRecorder.prototype.initialize = function(){
    var _this = this;
     if (!navigator.getUserMedia)
         navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    navigator.getUserMedia({audio: true}, function(stream){
        _this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        _this.audioInput = _this.audioContext.createMediaStreamSource(stream);
        _this.recorder1 = new Recorder(_this.audioInput);
        _this.recorder2 = new Recorder(_this.audioInput);
        _this.activeRecorder = _this.recorder1;
        _this.recorderNumber = 1;
    }, function(e) {
        console.log("error");
    });
};

AudioRecorder.prototype.startRecording = function(){
    var _this = this;
    this.isRecording = true;
    this.hasAudio = true;
    //this.audioInput.connect(this.audioContext.destination);
    this.activeRecorder.record();
    this.bufferSwitchFunc = window.setTimeout(function(){
        console.log("switch");
        _this.activeRecorder.stop();
        _this.activeRecorder.exportWAV(_this.exportFunc);
        _this.activeRecorder.clear();
        _this.switchRecorders();
        _this.startRecording();
    }, EXPORT_INTERVAL);
};

AudioRecorder.prototype.switchRecorders = function(){
    if (this.recorderNumber === 1){
            this.activeRecorder = this.recorder2;
            this.recorderNumber = 2;
        } else {
            this.activeRecorder = this.recorder1;
            this.recorderNumber = 1;
        }
};

AudioRecorder.prototype.stopRecording = function(){
    this.isRecording = false;
    this.activeRecorder.stop();
    //this.audioInput.disconnect();
    clearInterval(this.bufferSwitchFunc);
    this.activeRecorder.exportWAV(this.exportFunc);
    this.activeRecorder.clear();
    this.switchRecorders();
};

AudioRecorder.prototype.saveRecording = function(){
    this.activeRecorder.exportWAV(this.stopFunc);
};

AudioRecorder.prototype.removeRecording = function(){
    this.isRecording = false;
    this.hasAudio = false;
    this.audioInput.disconnect();
    this.recorder.clear();
};

AudioRecorder.prototype.initPlayback = function(){
    var _this = this;
    if (this.isRecording){
        throw "playBackInit called while Audio Still Recording";
    }
    this.activeRecorder.exportWAV(function(blob){
        var url = URL.createObjectURL(blob);
        _this.playback = new Audio(url);
        _this.playback.play();
    });
};

AudioRecorder.prototype.stopPlayback = function(){
    this.playback.pause();
    this.playback.currentTime = 0;
};

AudioRecorder.prototype.getPlaybackObject = function(){
    return this.playback;
};

 /*****************************************************************
  *
  * ResizePage
  *
  ****************************************************************/
 function pageResizer(header, book, padding, bookRatio, bookHeaderHeight, bookNavWidth, windowWidth, windowHeight) {
     // portrait and landscape data is available for some resources, but the existing data
     // is not working consistently everywhere, so portrait and landscape are determined here instead.
     if( bookRatio > 1 ) {
         book.addClass("book-portrait");
     } else {
         book.addClass("book-landscape");
     }
     // set the min and max widths
     if( book.hasClass("book-portrait") ) {
         var minBookWidth = 250;
         var maxBookWidth = 800;

     } else { // book-landscape
         var minBookWidth = 450;
         var maxBookWidth = 1400;
     }
     var maxBookHeight = maxBookWidth * bookRatio;

     // set book dimensions based on screen width
     var bookWidth = windowWidth - bookNavWidth - padding;
     var bookHeight = bookWidth * bookRatio;

     // make sure book height fits within screen height
     if (bookHeight > windowHeight - bookHeaderHeight - padding) {
         bookHeight = windowHeight - bookHeaderHeight - padding;
         bookWidth = bookHeight / bookRatio;
     }
     // check whether min or max width need to be used
     if (bookWidth < minBookWidth) {
         bookWidth = minBookWidth;
         bookHeight = bookWidth * bookRatio;
     } else if (bookWidth > maxBookWidth) {
         bookWidth = maxBookWidth;
         bookHeight = bookWidth * bookRatio;
     }
     // set css values
     book.css("width", bookWidth);
     book.css("height", bookHeight);
     book.css("left", windowWidth / 2 - bookWidth / 2);
     book.css("top", bookHeaderHeight); //below ebook header
     header.css("width", bookWidth );
     $j("#toolbarContent").css("width", bookWidth );

     var bookSize = new Array();
     bookSize['bookWidth'] = bookWidth;
     bookSize['bookHeight'] = bookHeight;
     return bookSize;
 }