var $j = jQuery.noConflict();
var AUDIO_WAIT_TIME = 1500; //miliseconds needed for audio to load properly
var MAX_PAGES = 2;
var IS_MOBILE = detectmob();
var onMouseMoveFlag = false;
var currentTool = "default";
var currentStamp = "";
var newPageWidth = "";
var naturalPageWidth = "";
var readCompletion = false;
var listenCompletion = false;

//audio state enum
var AudioState = {
    none: 0,
    play: 1,
    pause: 2,
    stop: 3
};

$j('head meta[name=viewport]').remove();
$j('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0" />');

function detectmob() {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ) {
        return true;
    } else {
        return false;
    }
}

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // IE 12 => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

/*****************************************************************
 *
 * RecordBookmark class and functions
 *
 * @param {int} activityId
 ****************************************************************/
function recordBookmark(activityId, currentPage, revertToNonAnimated) {
    if(!isPreview) {
        var page = currentPage;
        var isRevertedAnimation = revertToNonAnimated;
        if (page >= 2) {
            $j.ajax({
                type: "POST",
                data: {"id": activityId, "page": page, "revertToNonAnimated": isRevertedAnimation},
                async: false,
                url: "/main/RecordBookmarkService/"
            })
        }
    }
};

function preloadImages(arr) {
    var arr = (typeof arr != "object") ? [arr] : arr;

    var imageDeferreds = [];
    arr.forEach(function (item) {
        var imageDeferred = $j.Deferred();
        var image = new Image();
        image.src = item;
        image.onload = function () {
            imageDeferred.resolve(image);
        }
        image.onerror = function () {
            imageDeferred.reject("Couldn't load " + item);
        }
        imageDeferreds.push(imageDeferred);
    })

    return $j.when.apply(null, imageDeferreds);
}

$j(document).ready(function(){
    $j("#back-to-quizroom").on("click", function(){
        window.location.assign("/main/RazQuizRoom");
    });

    function adPostWidth() {
        var ovWid = $j('#header').width(); /*We use the header width with min-height of 700px in the style*/
        var postN = Math.floor(ovWid / 250);
        var widFix = Math.floor(ovWid / postN);
    }

    function WidthHead() {
        var ovWid = $j('#header').width(); /*We use the header width with min-height of 700px in the style*/
        var widFixHead = Math.floor(ovWid / 3);
    }

    adPostWidth();
    WidthHead();

    $j(window).resize(function () {
        adPostWidth();
        WidthHead();
    });

});

function disableDrag () {
    document.ondragstart = function () { return false; };
    document.onselectstart = function() { return false; };
}

function startAudio() {
    var e = $j.Event("animationReady");
    $j('#book-player').trigger(e);
}

window.clg = window.clg || {};
window.clg.swfRecording = window.clg.swfRecording || {};
(function(ns, $){
    var WAITING_STATUS = "waiting";
    var ERROR_STATUS = "Error";
    var RECORDING_STATUS = "recording";
    var RECORDING_STOPPED_STATUS = "recording_stopped";
    var RECORDING_SUBMITTED_STATUS = "recording_submitted";
    var RECORDING_RESET_STATUS = "recording_reset";
    var PLAYING_STATUS = "playing";
    var PLAYING_PAUSED_STATUS = "playing_paused";
    var PLAYING_STOPPED_STATUS = "playing_stopped";
    var ALL_STATES = [ WAITING_STATUS, , ERROR_STATUS,
        RECORDING_STATUS, RECORDING_STOPPED_STATUS, RECORDING_SUBMITTED_STATUS, RECORDING_RESET_STATUS,
        PLAYING_STATUS, PLAYING_PAUSED_STATUS, PLAYING_STOPPED_STATUS];
    var ACTIVE_STATES = [ WAITING_STATUS, RECORDING_STATUS, PLAYING_STATUS];
    var SUBMITTED_RESOLUTION = "submitted";
    ns.getSubmittedResolution = function () { return SUBMITTED_RESOLUTION; }
    var TIMEOUT_RESOLUTION = "timeout";
    ns.getTimeoutResolution = function () { return TIMEOUT_RESOLUTION; }

    ns.normalizeStatus = function (status) {
        if (-1 !== $.inArray(status, ALL_STATES)) {
            return status;
        } else if (0 === status.indexOf(ERROR_STATUS)) {
            return ERROR_STATUS;
        }
    }

    ns.isActiveStatus = function (status) {
        return -1 !== $.inArray(status, ACTIVE_STATES);
    }

    ns.onRecordingStatusChange = function (objectId, oldStatus, newStatus) {
        updateToolbarRecordingStatus(ns.isActiveStatus(ns.normalizeStatus(newStatus)));
    }

    ns.onShowVoiceDialog = function (swf) {
        updateToolbarRecordingStatus(true);
    }

    ns.getRecordingSwf = function () {
        return $('#readRecordingSwf')[0];
    }

    ns.isRecordingSwfActive = function () {
        var recordingSwf = ns.getRecordingSwf();
        return recordingSwf === undefined
        || !recordingSwf.hasOwnProperty("getRecordingStatus")
            ? false
            : ns.isActiveStatus(recordingSwf.getRecordingStatus())
    }

    ns.onHideVoiceDialog = function () {
        if (!ns.isRecordingSwfActive()) {
            updateToolbarRecordingStatus(false);
        }
    }

    var recordingDeferreds = {
        counter: 0
    };
    ns.doneRecording = function (config) {
        var options = $.extend({
            timeoutInterval: 2000
        }, config);
        var recordingSwf = ns.getRecordingSwf();
        if (recordingSwf === undefined)
            return $.Deferred().resolve().promise();
        var id = recordingDeferreds.counter ++;

        var deferred = recordingDeferreds[id] = $.Deferred();
        recordingSwf.doneRecording('clg.swfRecording.resolveDoneRecording(' + id + ')');
        setTimeout(function () {
            deferred.reject(ns.getTimeoutResolution());
        }, options.timeoutInterval);
        return deferred.promise();
    }

    ns.resolveDoneRecording = function (deferredId) {
        recordingDeferreds[deferredId].resolve(ns.getSubmittedResolution());
    }
})(clg.swfRecording, jQuery);