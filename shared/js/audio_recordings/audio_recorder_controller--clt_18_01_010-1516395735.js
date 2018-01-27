window.clg = window.clg || {};
window.clg.audio = window.clg.audio || {};
window.clg.audio.recorder = window.clg.audio.recorder || {};

(function (ns) {
    'use strict';

    ns.RecordingErrorHandler = function () {
        var displayError = function (errorCode) {
            $j('#recording-message'+' > #error-msg').empty();
            switch(errorCode) {
                case 'AUDIO_INACTIVITY_ERROR':
                    $j('#recording-message'+' > #error-msg').append('No activity. The recorder has been stopped.</br></br> Ask your teacher for help.');
                    break;
                case 'SERVER_CONNECTION_ERROR':
                    $j('#recording-message'+' > #error-msg').append('The recorder is not available.</br></br> Ask your teacher for help.');
                    break;
                case 'RECORDING_UNAVAILABLE_ERROR':
                    $j('#recording-message'+' > #error-msg').append('The recording is not available.</br></br> Ask your teacher for help.');
                    break;
                case 'MISSING_MICROPHONE_ERROR':
                    $j('#recording-message'+' > #error-msg').append('You are missing a microphone.</br></br> Ask your teacher for help.');
                    break;
                case 'MICROPHONE_PERMISSION_ERROR':
                    $j('#recording-message'+' > #error-msg').append('Microphone blocked in browser settings.</br></br> Ask your teacher for help.');
                    break;
                case 'UNSUPPORTED_BROWSER_ERROR':
                    $j('#recording-message'+' > #error-msg').append('This browser does not support the recorder.</br></br> Ask your teacher for help.');
                    break;
                case 'MAX_AUDIO_LENGTH_ERROR':
                    $j('#recording-message'+' > #error-msg').append('You have reached the max audio length.</br></br> Ask your teacher for help.');
                    break;
                default:
                    $j('#recording-message'+' > #error-msg').append('The recorder is not available.</br></br> Ask your teacher for help.');

            }
            $j('#recordButton').webuiPopover('show');
        };

        var eventListener = function (topic) {
            if (
                (topic === audioRecorderEvents.AUDIO_INACTIVITY_ERROR) ||
                (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
                (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
                (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
                (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR) ||
                (topic === audioRecorderEvents.UNSUPPORTED_BROWSER_ERROR) ||
                (topic === audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR)
            ) {
                displayError(topic);
            }
        };

        (function () {
            audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_INACTIVITY_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.UNSUPPORTED_BROWSER_ERROR, eventListener, 200);
            audioRecorderEventBus.subscribe(audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR, eventListener, 200);
        }());

        function getErrorMessage() {
            return errorMessage;
        }
    };

    ns.RecordingController = function () {
        var execute;

        var initialize = function (recordingInfo) {
            var recordingData = JSON.parse(recordingInfo);
            var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
            var maxSeconds = recordingData.max_recording_seconds;
            if (isIE11) maxSeconds = recordingData.max_recording_seconds_IE;
            audioRecording.initialize(recordingData.state, parseInt(recordingData.total_ms_recorded), maxSeconds, recordingData.max_inactivity_seconds);

            var timer = new ns.Timer("timer");
            var playbackSlider = ns.PlaybackSlider("playbackSliderAxis", "playbackSliderHandle", "noselect");
            var volumeDisplay = initializeVolumeDisplay("volumeDisplay", 100, 26);

            var newButton = new ns.NewButton("newButton", "", "", "is-disabled", false);
            var recordButton = new ns.RecordButton("recordButton", "", "", "is-disabled", false);
            var stopRecordingButton = new ns.StopRecordingButton("stopRecordingButton", "", "", "is-disabled", true);
            var pauseRecordingButton = new ns.PauseRecordingButton("pauseRecordingButton", "", "", "is-disabled", true);
            var playButton = new ns.PlayButton("playButton", "", "", "is-disabled", false);
            var pausePlayingButton = new ns.PausePlayingButton("pausePlayingButton", "", "", "is-disabled", true);
            var stopPlayingButton = new ns.StopPlayingButton("stopPlayingButton", "", "", "is-disabled", true);

            execute = new ns.Execute(recordingData.archive_url, true);
            var mediaServer = new ns.MediaServer(recordingData.media_server_url, recordingData.authorize_recording_url);
            var jsMicrophone = new ns.JsMicrophone();
            //The SWF microphone polyfill must have global scope for AS3 ExternalInterface.call()
            window.swfMicrophone = new ns.SwfMicrophone("swfMicrophone", "/flash/microphone.swf", "swfMicrophone", "embeddedMicrophone");
            var recorder = new ns.Recorder(mediaServer, jsMicrophone, swfMicrophone);

            var player = new ns.Player(recordingData.authorize_playback_url);
        };

        var initializeVolumeDisplay = function (voiceVolume, width, height) {
            var canvas = $j('#' + voiceVolume)[0];
            canvas.width = new String(width);
            canvas.height = new String(height);

            var canvasContext = canvas.getContext("2d");
            var gradient = canvasContext.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(.95, 'red');
            gradient.addColorStop(0.75, 'orange');
            gradient.addColorStop(0.65, 'yellow');
            gradient.addColorStop(0, 'green');

            canvasContext.fillStyle = gradient;
            canvasContext.fillRect(0, 0, 0, height);

            return new ns.VolumeDisplay(voiceVolume, canvasContext, width, height);
        };

        return {
            get execute() {
                return execute
            },

            initialize: initialize
        };
    };

    ns.doneReading = function (completed) {
        var d = $j.Deferred();
        recordingController.execute.archiveRecording(completed).then(
            function () {
                d.resolve("success");
            }
        ).catch(
            function (error) {
                console.log(error.message);
                d.reject(error.message);
            }
        ).finally(
        );
        return d.promise();
    };
}(window.clg.audio.recorder));