window.clg = window.clg || {};
window.clg.audio = window.clg.audio || {};
window.clg.audio.recorder = window.clg.audio.recorder || {};

//Globals
var audioRecorderEvents;
var audioRecorderEventBus;
var audioRecording;

(function (ns) {
  'use strict';
  /*jslint plusplus: true */
  /*jslint nomen: true */
  /*jslint es5: true */
  /*global Int16Array  */
  /*global BinaryClient */
  /*global Promise */
  /*global swfobject */
  /*global Audio */
  /*global Worker */
  /*global console */
  /*global $j */

  audioRecorderEvents = (function () {
    var constants = {
      START_RECORDING: '',
      PAUSE_RECORDING: '',
      STOP_RECORDING: '',
      RESET_RECORDING: '',
      ARCHIVE_RECORDING: '',

      START_PLAYING: '',
      PAUSE_PLAYING: '',
      STOP_PLAYING: '',

      MICROPHONE_VOLUME: '',
      AUDIO_CAPTURE_STARTED: '',
      AUDIO_CAPTURE_PAUSED: '',
      AUDIO_CAPTURE_STOPPED: '',
      AUDIO_CAPTURE_RESET: '',

      PLAYBACK_CURRENT_TIME: '',
      AUDIO_PLAYBACK_STARTED: '',
      AUDIO_PLAYBACK_PAUSED: '',
      AUDIO_PLAYBACK_STOPPED: '',
      SCROLLED_TO_TIME: '',

      SERVER_CONNECTION_ERROR: '',
      RECORDING_UNAVAILABLE_ERROR: '',
      MISSING_MICROPHONE_ERROR: '',
      MICROPHONE_PERMISSION_ERROR: '',
      UNSUPPORTED_BROWSER_ERROR: '',
      MAX_AUDIO_LENGTH_ERROR: '',
      AUDIO_INACTIVITY_ERROR: ''
    };
    Object.keys(constants).forEach(function (item, index, array) {
      Object.defineProperty(constants, item, {
        configurable: false,
        enumerable: true,
        value: item,
        writable: false,
      });
    });
    return constants;
  }());

  audioRecorderEventBus = (function () {
    var topics = {};

    var compareSubscribers = function (a, b) {
      if (a.priority < b.priority) {
        return -1;
      }
      if (a.priority > b.priority) {
        return 1;
      }
      return 0;
    };

    var subscribe = function (topic, listener, priority) {
      if ((typeof topic) !== 'string') {
        throw new Error("audioRecorderEventBus.subscribe() topic paramenter must be a string.");
      }

      if ((typeof listener) !== 'function') {
        throw new Error("audioRecorderEventBus.subscribe() listener paramenter must be a function.");
      }

      if ((typeof priority) !== 'number') {
        throw new Error("audioRecorderEventBus.subscribe() priority paramenter must be a number");
      }

      var subscriber = {
        listener: listener,
        priority: priority
      };

      topics[topic] = topics[topic] || [];
      topics[topic].push(subscriber);
      topics[topic] = topics[topic].sort(compareSubscribers);
    };

    var publish = function (topic, data) {
      try {
        if ((typeof topic) !== 'string') {
          throw new Error("audioRecorderEventBus.publish() topic paramenter must be a string.");
        }

        data = data || {};

        if (topics[topic]) {
          var counter = topics[topic].length;
          while (counter--) {
            topics[topic][counter].listener(topic, data);
          }
        }
      } catch (error) {
        var message = (error.name || "Error") + ": " + (error.message || "audioRecorderEventBus.publish()");
        if (error.stack) {
          message = error.stack;
        }
        console.log(message);
      }
    };

    return {
      subscribe: subscribe,
      publish: publish
    };
  }());

  var AudioLength = function (totalLengthMs, maxLengthSeconds) {
    var execute;
    var maxLengthMs;
    var currentLengthMs;
    var lastStartedRecordingAt;
    var timerIntervalId;

    var milliseconds = function () {
      return (totalLengthMs + currentLengthMs);
    };

    var isMaxLength = function () {
      return (milliseconds() > maxLengthMs);
    };

    var updateLength = function () {
      currentLengthMs = (Date.now() - lastStartedRecordingAt);
      if (isMaxLength()) {
        execute.stopRecording();
        audioRecorderEventBus.publish(audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR);
      }
    };

    var eventListener = function (topic) {
      if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
        lastStartedRecordingAt = Date.now();
        timerIntervalId = window.setInterval(updateLength, 100);
      } else if (
        (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
      ) {
        if (timerIntervalId) {
          window.clearInterval(timerIntervalId);
          timerIntervalId = undefined;
          totalLengthMs += currentLengthMs;
          currentLengthMs = 0;
        }
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET) {
        totalLengthMs = 0;
      }
    };

    (function () {
      execute = new ns.Execute();
      maxLengthMs = (maxLengthSeconds * 1000);
      currentLengthMs = 0;

      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 300);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, eventListener, 300);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, eventListener, 300);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, eventListener, 300);
    }());

    return {
      milliseconds: milliseconds,
      isMaxLength: isMaxLength
    };
  };

  var AudioActivity = function (maxInactivitySeconds) {
    var execute;
    var timerIntervalId;
    var hasActivity;

    var track = function (volume) {
      if ((!hasActivity) && (Math.round(volume * 1000) / 1000 !== 0)) {
        hasActivity = true;
      }
    };

    var check = function () {
      if (hasActivity) {
        hasActivity = false;
      } else {
        execute.stopRecording();
        audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_INACTIVITY_ERROR);
      }
    };

    var eventListener = function (topic, data) {
      if (topic === audioRecorderEvents.MICROPHONE_VOLUME) {
        track(data.volume);
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
        timerIntervalId = window.setInterval(check, (maxInactivitySeconds * 1000));
      } else if (
        (topic === audioRecorderEvents.STOP_RECORDING) ||
        (topic === audioRecorderEvents.PAUSE_RECORDING)
      ) {
        if (timerIntervalId) {
          window.clearInterval(timerIntervalId);
          timerIntervalId = undefined;
        }
      } else if (
        (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
      ) {
        hasActivity = false;
      }
    };

    (function () {
      execute = new ns.Execute();
      hasActivity = false;
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_VOLUME, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, eventListener, 200);
    }());
  };

  audioRecording = (function () {
    var NEW = "new";
    var PARTIAL = "partial";
    var COMPLETE = "complete";

    var state;
    var shouldArchive;
    var audioLength;
    var audioActivity;

    var isNonnegativeInt = function (value) {
      return ((typeof value === "number") && isFinite(value) && (value >= 0) && (Math.floor(value) === value));
    };

    var initialize = function (recordingState, recordingMilliseconds, maxLengthSeconds, maxInactivitySeconds) {
      if (recordingState === NEW ||
        recordingState === PARTIAL ||
        recordingState === COMPLETE) {
        state = recordingState;
        shouldArchive = false;
      } else {
        throw new Error("Invalid recordingState: " + recordingState);
      }

      if (isNonnegativeInt(recordingMilliseconds)) {
        if (isNonnegativeInt(maxLengthSeconds)) {
          audioLength = new AudioLength(recordingMilliseconds, maxLengthSeconds);
        } else {
          throw new Error("Invalid maxLengthSeconds: " + maxLengthSeconds);
        }
      } else {
        throw new Error("Invalid recordingMilliseconds: " + recordingMilliseconds);
      }

      if (isNonnegativeInt(maxInactivitySeconds)) {
        audioActivity = new AudioActivity(maxInactivitySeconds);
      } else {
        throw new Error("Invalid maxInactivitySeconds: " + maxInactivitySeconds);
      }
    };

    var eventListener = function (topic, data) {
      if (!state) {
        throw new Error("audioRecording was not initialized.");
      }

      if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
        state = PARTIAL;
        shouldArchive = true;
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET) {
        state = NEW;
        shouldArchive = false;
      } else if (
          ((topic === audioRecorderEvents.ARCHIVE_RECORDING) &&
            (data.markRecordingCompleted) &&
            (state === PARTIAL)) ||
          (topic === audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR)
      ) {
        state = COMPLETE;
        shouldArchive = true;
      }
    };

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 250);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, eventListener, 250);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, eventListener, 250);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR, eventListener, 250);
    }());

    return {
      get NEW() {
        return NEW;
      },

      set NEW(value) {
        throw new Error("Invalid operation.");
      },

      get PARTIAL() {
        return PARTIAL;
      },

      set PARTIAL(value) {
        throw new Error("Invalid operation.");
      },

      get COMPLETE() {
        return COMPLETE;
      },

      set COMPLETE(value) {
        throw new Error("Invalid operation.");
      },

      get state() {
        return state;
      },

      set state(value) {
        throw new Error("Invalid operation.");
      },

      get lengthMs() {
        return audioLength.milliseconds();
      },

      set lengthMs(value) {
        throw new Error("Invalid operation.");
      },

      get isMaxLength() {
        return audioLength.isMaxLength();
      },

      set isMaxLength(value) {
        throw new Error("Invalid operation.");
      },

      get shouldArchive() {
        return shouldArchive;
      },

      set shouldArchive(value) {
        throw new Error("Invalid operation.");
      },

      initialize: initialize
    };
  }());

  ns.ServerConnectionError = function (message) {
    this.message = message;
    this.name = "ServerConnectionError";
  };
  ns.ServerConnectionError.prototype = Object.create(Error.prototype);
  ns.ServerConnectionError.prototype.constructor = ns.ServerConnectionError;

  ns.RecordingUnavailableError = function (message) {
    this.message = message;
    this.name = "RecordingUnavailableError";
  };
  ns.RecordingUnavailableError.prototype = Object.create(Error.prototype);
  ns.RecordingUnavailableError.prototype.constructor = ns.RecordingUnavailableError;

  ns.UnsupportedMicrophoneError = function (message) {
    this.message = message;
    this.name = "UnsupportedMicrophoneError";
  };
  ns.UnsupportedMicrophoneError.prototype = Object.create(Error.prototype);
  ns.UnsupportedMicrophoneError.prototype.constructor = ns.UnsupportedMicrophoneError;

  ns.MissingMicrophoneError = function (message) {
    this.message = message;
    this.name = "MissingMicrophoneError";
  };
  ns.MissingMicrophoneError.prototype = Object.create(Error.prototype);
  ns.MissingMicrophoneError.prototype.constructor = ns.MissingMicrophoneError;

  ns.MicrophonePermissionError = function (message) {
    this.message = message;
    this.name = "MicrophonePermissionError";
  };
  ns.MicrophonePermissionError.prototype = Object.create(Error.prototype);
  ns.MicrophonePermissionError.prototype.constructor = ns.MicrophonePermissionError;

  ns.Button = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    this.buttonId = buttonId;
    this.enableClass = enableClass;
    this.hoverClass = hoverClass;
    this.disableClass = disableClass;
    this.hideWhenDisabled = hideWhenDisabled;
    this.isEnabled = false;

    (function () {
      this.disable();
    }.call(this));
  };
  ns.Button.prototype = (function () {
    var F = function () {
      this.enable = function () {
        if (!this.isEnabled) {
          this.isEnabled = true;
          $j('#' + this.buttonId).removeClass(this.hoverClass).removeClass(this.disableClass).addClass(this.enableClass);
          $j('#' + this.buttonId).on({
            mouseenter: this._onEnter.bind(this),
            mouseleave: this._onLeave.bind(this),
            click: this._onClick.bind(this)
          });
          $j('#' + this.buttonId).show();
        }
      };

      this.disable = function () {
        $j('#' + this.buttonId).off();
        $j('#' + this.buttonId).removeClass(this.hoverClass).removeClass(this.enableClass).addClass(this.disableClass);
        this.isEnabled = false;
      };

      this.hide = function () {
        if (this.hideWhenDisabled) {
          $j('#' + this.buttonId).hide();
        }
      };

      this._onEnter = function () {
        $j('#' + this.buttonId).removeClass(this.enableClass).removeClass(this.disableClass).addClass(this.hoverClass);
      };

      this._onLeave = function () {
        $j('#' + this.buttonId).removeClass(this.hoverClass).removeClass(this.disableClass).addClass(this.enableClass);
      };

      this._onClick = function () {
        this.disable();
        this._notify();
      };

      this._notify = function () {
        throw new Error("Objects inheriting from Button must define _notify().");
      };
    };
    F.prototype = null;
    return new F();
  }());
  ns.Button.prototype.constructor = ns.Button;

  ns.NewButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.NewButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        if (audioRecording.state === audioRecording.NEW) {
          this.hide();
        } else {
          this.enable();
        }
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.RESET_RECORDING);
      };

      this._eventListener = function (topic) {
        if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED)
        ) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.START_RECORDING) ||
          (topic === audioRecorderEvents.START_PLAYING)) {
          this.disable();
        } else if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET)) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.NewButton.prototype.constructor = ns.NewButton;

  ns.RecordButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RESET_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.RecordButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        if ((audioRecording.state === audioRecording.NEW) ||
          (audioRecording.state === audioRecording.PARTIAL)) {
          this.enable();
        }
      };

      this._notify = function () {
        if (audioRecording.isMaxLength) {
          audioRecorderEventBus.publish(audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR);
        } else {
          audioRecorderEventBus.publish(audioRecorderEvents.START_RECORDING);
        }
      };

      this._eventListener = function (topic) {
        if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED) ||
          (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET)
        ) {
          this.enable();
        } else if (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) {
          if (audioRecording.state === audioRecording.COMPLETE) {
            this.disable();
          } else {
            this.enable();
          }
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.RESET_RECORDING) ||
          (topic === audioRecorderEvents.STOP_RECORDING) ||
          (topic === audioRecorderEvents.START_PLAYING) ||
          (topic === audioRecorderEvents.MAX_AUDIO_LENGTH_ERROR)
        ) {
          this.disable();
        } else if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED)
        ) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.RecordButton.prototype.constructor = ns.RecordButton;

  ns.StopRecordingButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.StopRecordingButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        this.hide();
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.STOP_RECORDING);
      };

      this._eventListener = function (topic) {
        if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
        ) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.STOP_RECORDING) ||
          (topic === audioRecorderEvents.PAUSE_RECORDING)
        ) {
          this.disable();
        } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.StopRecordingButton.prototype.constructor = ns.StopRecordingButton;

  ns.PauseRecordingButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.PauseRecordingButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        this.hide();
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.PAUSE_RECORDING);
      };

      this._eventListener = function (topic) {
        if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.STOP_RECORDING)
        ) {
          this.disable();
        } else if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
        ) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.PauseRecordingButton.prototype.constructor = ns.PauseRecordingButton;

  ns.PlayButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RESET_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.PlayButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        if ((audioRecording.state === audioRecording.PARTIAL) ||
          (audioRecording.state === audioRecording.COMPLETE)) {
          this.enable();
        }
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.START_PLAYING);
      };

      this._eventListener = function (topic) {
        if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED)
        ) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.START_RECORDING) ||
          (topic === audioRecorderEvents.RESET_RECORDING) ||
          (topic === audioRecorderEvents.START_PLAYING)
        ) {
          this.disable();
        } else if (
          (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED)
        ) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.PlayButton.prototype.constructor = ns.PlayButton;

  ns.StopPlayingButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.StopPlayingButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        this.hide();
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.STOP_PLAYING);
      };

      this._eventListener = function (topic) {
        if (
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED)
        ) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.STOP_PLAYING) ||
          (topic === audioRecorderEvents.PAUSE_PLAYING)
        ) {
          this.disable();
        } else if (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.StopPlayingButton.prototype.constructor = ns.StopPlayingButton;

  ns.PausePlayingButton = function (buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled) {
    ns.Button.call(this, buttonId, enableClass, hoverClass, disableClass, hideWhenDisabled);

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.ARCHIVE_RECORDING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_PLAYING, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SERVER_CONNECTION_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MISSING_MICROPHONE_ERROR, this._eventListener.bind(this), 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR, this._eventListener.bind(this), 200);
      this.reset();
    }.call(this));
  };
  ns.PausePlayingButton.prototype = (function () {
    var F = function () {
      this.reset = function () {
        this.hide();
      };

      this._notify = function () {
        audioRecorderEventBus.publish(audioRecorderEvents.PAUSE_PLAYING);
      };

      this._eventListener = function (topic) {
        if (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) {
          this.enable();
        } else if (
          (topic === audioRecorderEvents.ARCHIVE_RECORDING) ||
          (topic === audioRecorderEvents.STOP_PLAYING) ||
          (topic === audioRecorderEvents.PAUSE_PLAYING)
        ) {
          this.disable();
        } else if (
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) ||
          (topic === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED)
        ) {
          this.hide();
        } else if (
          (topic === audioRecorderEvents.SERVER_CONNECTION_ERROR) ||
          (topic === audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR) ||
          (topic === audioRecorderEvents.MISSING_MICROPHONE_ERROR) ||
          (topic === audioRecorderEvents.MICROPHONE_PERMISSION_ERROR)) {
          this.reset();
        }
      };
    };
    F.prototype = Object.create(ns.Button.prototype);
    return new F();
  }());
  ns.PausePlayingButton.prototype.constructor = ns.PausePlayingButton;

  ns.Timer = function (timerId) {
    var unformattedTimeMs;
    var timerIntervalId;

    var displayFormattedTime = function () {
      var formattedTime = "";

      var minutes = Math.floor(unformattedTimeMs / 60000);
      if (minutes < 10) {
        formattedTime += "&nbsp;";
      }
      formattedTime += (minutes + ":");

      var seconds = Math.floor(unformattedTimeMs / 1000 % 60);
      if (seconds < 10) {
        formattedTime += "0";
      }
      formattedTime += seconds;

      if ($j('#' + timerId)) {
        $j('#' + timerId).html(formattedTime);
      }
    };

    var eventListener = function (topic, data) {
      if (topic === audioRecorderEvents.PLAYBACK_CURRENT_TIME) {
        unformattedTimeMs = data.currentTimeSecs * 1000;
        displayFormattedTime();
      } else if (topic === audioRecorderEvents.SCROLLED_TO_TIME) {
        unformattedTimeMs = data.timeMs;
        displayFormattedTime();
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
        timerIntervalId = window.setInterval(function () {
          unformattedTimeMs = audioRecording.lengthMs;
          displayFormattedTime();
        }, 200);
      } else if (
        (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
      ) {
        if (timerIntervalId) {
          window.clearInterval(timerIntervalId);
          timerIntervalId = undefined;
          unformattedTimeMs = audioRecording.lengthMs;
          displayFormattedTime();
        }
      } else if (
        (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET)
      ) {
        unformattedTimeMs = audioRecording.lengthMs;
        displayFormattedTime();
      }
    };

    (function () {
      unformattedTimeMs = audioRecording.lengthMs;
      displayFormattedTime();
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PLAYBACK_CURRENT_TIME, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.SCROLLED_TO_TIME, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, eventListener, 200);
    }());
  };

  ns.VolumeDisplay = function (canvasId, canvasContext, maxWidth, height) {
    var timerIntervalId;
    var averageVolume = 0;
    var smoothingCounter = 0;

    var updateDisplay = function () {
      canvasContext.clearRect(0, 0, maxWidth, height);
      var boost = Math.log(10 - ((averageVolume - 0.3) * 10)); //Boosting for meaningful display
      canvasContext.fillRect(0, 0, Math.round(averageVolume * maxWidth * boost), height);
    };

    var eventListener = function (topic, volumeInfo) {
      if (topic === audioRecorderEvents.MICROPHONE_VOLUME) {
        averageVolume = Math.max(volumeInfo.volume, (averageVolume * 0.9)); //Smoothing for between word pausing
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) {
        $j('#' + canvasId).show();
        timerIntervalId = window.setInterval(updateDisplay, 100);
      } else if (
        (topic === audioRecorderEvents.STOP_RECORDING) ||
        (topic === audioRecorderEvents.PAUSE_RECORDING)
      ) {
        if (timerIntervalId) {
          window.clearInterval(timerIntervalId);
          timerIntervalId = undefined;
          averageVolume = 0;
          updateDisplay();
        }
      } else if (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) {
        $j('#' + canvasId).hide();
      }
    };

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.MICROPHONE_VOLUME, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, eventListener, 200);
    }());
  };

  ns.SliderAxis = function (axisId) {
    var axis;
    var isInitialized;
    var width;
    var minOffset;

    var show = function () {
      axis.show();
      if (!isInitialized) {
        isInitialized = true;
        width = axis.width();
        minOffset = axis.offset().left;
      }
    };

    var hide = function () {
      axis.hide();
    };

    var enable = function (onMouseDown) {
      show();

      axis.on({
        mousedown: onMouseDown
      });

      axis.css('cursor', "pointer");
    };

    var disable = function () {
      axis.off();
      axis.css('cursor', "default");
    };

    (function () {
      axis = $j('#' + axisId);
    }());

    return {
      get width() {
        return width;
      },

      set width(value) {
        console.log("SliderAxis.width is only readable");
      },

      get minOffset() {
        return minOffset;
      },

      set minOffset(value) {
        console.log("SliderAxis.minOffset is only readable");
      },

      show: show,
      hide: hide,
      enable: enable,
      disable: disable
    };
  };

  ns.SliderHandle = function (handleId, sliderAxis) {
    var handle;
    var isInitialized;
    var origin;
    var minOffset;
    var maxOffset;
    var defaultCalibration;
    var calibration;

    var show = function () {
      handle.show();
      if (!isInitialized) {
        isInitialized = true;
        origin = handle.position().left;
        minOffset = handle.offset().left;
        maxOffset = minOffset + sliderAxis.width;
        defaultCalibration = minOffset - sliderAxis.minOffset;
      }
    };

    var hide = function () {
      handle.hide();
    };

    var enable = function (onMouseDown) {
      show();

      calibration = defaultCalibration;
      handle.on({
        mousedown: function (event) {
          calibration = handle.offset().left - event.pageX;
          onMouseDown(event);
        }
      });

      handle.css('cursor', "pointer");
    };

    var disable = function () {
      handle.off();
      handle.css('cursor', "default");
    };

    var moveTo = function (offset) {
      offset += calibration;

      if (offset < minOffset) {
        offset = minOffset;
      } else if (offset > maxOffset) {
        offset = maxOffset;
      }

      handle.css("left", (origin + (offset - minOffset)));
    };

    var reset = function () {
      handle.css("left", origin);
    };

    (function () {
      handle = $j('#' + handleId);
    }());

    return {
      get minOffset() {
        return minOffset;
      },

      set minOffset(value) {
        console.log("SliderHandle.minOffset is only readable");
      },

      get currentOffset() {
        return handle.offset().left;
      },

      set currentOffset(value) {
        console.log("SliderHandle.currentOffset is only readable");
      },

      show: show,
      hide: hide,
      enable: enable,
      disable: disable,
      moveTo: moveTo,
      reset: reset
    };
  };

  ns.PlaybackSlider = function (axisId, handleId, noSelectCssClass) {
    var axis;
    var handle;

    var isPlaying;
    var isScrolling;
    var listenForPlayback;
    var mouseUpOffset;

    var calculateTimeMs = function () {
      return Math.floor((handle.currentOffset - handle.minOffset) / axis.width * audioRecording.lengthMs);
    };

    var onMouseMove = function (event) {
      handle.moveTo(event.pageX);

      var scrollInfo = {};
      scrollInfo.timeMs = calculateTimeMs();
      audioRecorderEventBus.publish(audioRecorderEvents.SCROLLED_TO_TIME, scrollInfo);
    };

    var onMouseUp = function (event) {
      $j('body').off({
        mousemove: onMouseMove,
        mouseup: onMouseUp
      });

      $j('body').removeClass(noSelectCssClass);

      isScrolling = false;
      mouseUpOffset = event.pageX;

      var playbackInfo = {};
      playbackInfo.seekToTimeSecs = Math.floor(calculateTimeMs() / 1000);
      audioRecorderEventBus.publish(audioRecorderEvents.START_PLAYING, playbackInfo);
    };

    var onMouseDown = function (event) {
      listenForPlayback = false;
      $j('body').addClass(noSelectCssClass);

      $j('body').on({
        mousemove: onMouseMove,
        mouseup: onMouseUp
      });

      if (isPlaying) {
        isScrolling = true;
        audioRecorderEventBus.publish(audioRecorderEvents.PAUSE_PLAYING);
      }

      onMouseMove(event);
    };

    var enable = function (hasPlaybackStarted) {
      isPlaying = hasPlaybackStarted;
      axis.enable(onMouseDown);
      handle.enable(onMouseDown);
      listenForPlayback = true;
    };

    var disable = function (shouldReset) {
      listenForPlayback = false;
      handle.disable();
      axis.disable();
      if (shouldReset) {
        mouseUpOffset = 0;
        handle.reset();
      }
    };

    var hide = function () {
      handle.hide();
      axis.hide();
    };

    var updatePlaybackPosition = function (currentTimeSecs) {
      if (listenForPlayback) {
        var newOffset = Math.floor(axis.minOffset + (currentTimeSecs * axis.width / (audioRecording.lengthMs / 1000)));
        if (newOffset > mouseUpOffset) {
          handle.moveTo(newOffset);
        }
      }
    };

    var eventListener = function (topic, data) {
      if (topic === audioRecorderEvents.PLAYBACK_CURRENT_TIME) {
        updatePlaybackPosition(data.currentTimeSecs);
      } else if (
        (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) ||
        ((topic === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED) && !isScrolling)
      ) {
        enable(topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED);
      } else if (
        (topic === audioRecorderEvents.START_PLAYING) ||
        (topic === audioRecorderEvents.STOP_PLAYING) ||
        ((topic === audioRecorderEvents.PAUSE_PLAYING) && !isScrolling)
      ) {
        disable(topic === audioRecorderEvents.STOP_PLAYING);
      } else if (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED) {
        hide();
      }
    };

    (function () {
      axis = new ns.SliderAxis(axisId);
      handle = new ns.SliderHandle(handleId, axis);
      mouseUpOffset = 0;

      audioRecorderEventBus.subscribe(audioRecorderEvents.PLAYBACK_CURRENT_TIME, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, eventListener, 200);
    }());
  };

  ns.Execute = function (archiveUrl, usePathRequestFormat) {
    var state;

    var stopRecording = function () {
      if (
        (state === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
        (state === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
      ) {
        audioRecorderEventBus.publish(audioRecorderEvents.STOP_RECORDING);
      }
    };

    var archiveRecording = function (markRecordingCompleted) {
      if (
        (state === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
        (state === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED)
      ) {
        var completionInfo = {};
        completionInfo.markRecordingCompleted = (markRecordingCompleted === true);
        audioRecorderEventBus.publish(audioRecorderEvents.ARCHIVE_RECORDING, completionInfo);

        if (audioRecording.shouldArchive) {
          return new Promise(
            function (resolve, reject) {
              var url = archiveUrl + "&total_milliseconds=" + audioRecording.lengthMs + "&state=" + audioRecording.state;
              if (usePathRequestFormat) {
                url = archiveUrl + "/totalMillisecondsRecorded/" + audioRecording.lengthMs + "/state/" + audioRecording.state;
              }

              $j.getJSON(url)
                .done(function (response) {
                  if (response.status === 'success') {
                    resolve(response);
                  } else {
                    reject(new ns.ServerConnectionError("Recording archival failed. Error: " + response.reason));
                  }
                })
                .fail(function (jqxhr, textStatus, error) {
                  reject(new ns.ServerConnectionError("Recording archival failed. Error: " + textStatus + ", " + error));
                });
            });
        } else {
          return Promise.resolve();
        }
      } else if (
        (state === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
        (state === audioRecorderEvents.AUDIO_CAPTURE_PAUSED)
      ) {
        audioRecorderEventBus.publish(audioRecorderEvents.STOP_RECORDING);
        return archiveRecording(markRecordingCompleted);
      } else if (
        (state === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) ||
        (state === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED)
      ) {
        audioRecorderEventBus.publish(audioRecorderEvents.STOP_PLAYING);
        return archiveRecording(markRecordingCompleted);
      } else if (
        (state === audioRecorderEvents.START_RECORDING) ||
        (state === audioRecorderEvents.PAUSE_RECORDING) ||
        (state === audioRecorderEvents.STOP_RECORDING) ||
        (state === audioRecorderEvents.START_PLAYING) ||
        (state === audioRecorderEvents.PAUSE_PLAYING) ||
        (state === audioRecorderEvents.STOP_PLAYING)
      ) {
        return new Promise(
          function (resolve, reject) {
            window.setTimeout(function () {
              resolve();
            }, 100);
          }
        ).then(
          function () {
            return archiveRecording(markRecordingCompleted);
          }
        );
      } else {
        return Promise.resolve();
      }
    };

    var eventListener = function (topic) {
      if (
        (topic === audioRecorderEvents.START_RECORDING) ||
        (topic === audioRecorderEvents.PAUSE_RECORDING) ||
        (topic === audioRecorderEvents.STOP_RECORDING) ||
        (topic === audioRecorderEvents.RESET_RECORDING) ||
        (topic === audioRecorderEvents.START_PLAYING) ||
        (topic === audioRecorderEvents.PAUSE_PLAYING) ||
        (topic === audioRecorderEvents.STOP_PLAYING) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_STARTED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_PAUSED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_STOPPED) ||
        (topic === audioRecorderEvents.AUDIO_CAPTURE_RESET) ||
        (topic === audioRecorderEvents.AUDIO_PLAYBACK_STARTED) ||
        (topic === audioRecorderEvents.AUDIO_PLAYBACK_PAUSED) ||
        (topic === audioRecorderEvents.AUDIO_PLAYBACK_STOPPED)
      ) {
        state = topic;
      }
    };

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RESET_RECORDING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_PLAYING, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_PAUSED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_STOPPED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_CAPTURE_RESET, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STARTED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED, eventListener, 200);
      audioRecorderEventBus.subscribe(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED, eventListener, 200);
    }());

    return {
      archiveRecording: archiveRecording,
      stopRecording: stopRecording
    };
  };

  ns.MediaServer = function (serverUrl, authorizeUrl) {
    var client;
    var stream;

    var authorize = function () {
      return new Promise(
        function (resolve, reject) {
          $j.getJSON(authorizeUrl + audioRecording.state)
            .done(function (response) {
              if (response.status === 'success') {
                resolve(response.certificate);
              } else {
                reject(new ns.RecordingUnavailableError("Unable to authorize recording through media server. Error: " + response.reason));
              }
            })
            .fail(function (jqxhr, textStatus, error) {
              reject(new ns.ServerConnectionError("Unable to connect to media server (http). Error: " + error + " (" + textStatus + ")"));
            });
        });
    };

    var isConnected = function () {
      return ((stream !== undefined) ? true : false);
    };

    var connect = function () {
      return new Promise(
        function (resolve, reject) {
          if (isConnected()) {
            resolve();
          } else {
            client = new BinaryClient(serverUrl);
            client.on('open', function () {
              authorize().then(
                function (certificate) {
                  var meta = {
                    certificate: certificate,
                    recordingState: audioRecording.state
                  };
                  stream = client.createStream(meta);
                  resolve();
                },
                function (error) {
                  client.close();
                  reject(error);
                }
              );
            });
            client.on('error', function () {
              client.close();
              reject(new ns.ServerConnectionError("Unable to connect to media server (socket)."));
            });
            client.on('close', function () {
              console.log("WebSocket connection closed.");
              stream = undefined;
            });
          }
        }
      );
    };

    var save = function (buffer) {
      stream.write(buffer);
    };

    var reset = function () {
      if (stream) {
        stream.end();
        stream = client.createStream();
      }
    };

    return {
      isConnected: isConnected,
      connect: connect,
      save: save,
      reset: reset
    };
  };

  ns.JsMicrophone = function () {
    var shouldCapture;
    var processAudio;
    var sampleRate;

    //There is an issue with garbage collection that necessitates scoping these on the object instead of only the preferred "background" scriptProcessor
    var mediaStreamSource;
    var audioContext;
    var scriptProcessor;

    var getUserMedia = function () {
      return new Promise(
        function (resolve, reject) {
          var mediaConfig = {
            audio: true
          };

          if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia(mediaConfig).then(
              function (mediaStream) {
                resolve(mediaStream);
              }
            ).catch(
              function (error) {
                if (
                  (error.name === 'NotAllowedError') ||
                  (error.name === 'PermissionDeniedError') ||
                  (error.name === 'SecurityError')) {
                  reject(new ns.MicrophonePermissionError("Microphone permission denied (navigator.mediaDevices [" + error.name + "])."));
                } else {
                  reject(new ns.MissingMicrophoneError("Microphone not found (navigator.mediaDevices [" + error.name + "])."));
                }
              }
            );
          } else {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (navigator.getUserMedia) {
              navigator.getUserMedia(
                mediaConfig,
                function (mediaStream) {
                  resolve(mediaStream);
                },
                function (error) {
                  if (
                    (error.name === 'NotAllowedError') ||
                    (error.name === 'PermissionDeniedError') ||
                    (error.name === 'SecurityError')) {
                    reject(new ns.MicrophonePermissionError("Microphone permission denied (navigator.getUserMedia [" + error.name + "])."));
                  } else {
                    reject(new ns.MissingMicrophoneError("Microphone not found (navigator.getUserMedia [" + error.name + "])."));
                  }
                }
              );
            } else {
              reject(new ns.UnsupportedMicrophoneError("navigator microphone access not supported."));
            }
          }
        }
      );
    };

    var configureAudioProcessing = function (mediaStream) {
      try {
        if (window.AudioContext) {
          audioContext = new window.AudioContext();
        } else if (window.webkitAudioContext) {
          audioContext = new window.webkitAudioContext();
        } else {
          throw new Error("AudioContext not supported.");
        }
        sampleRate = audioContext.sampleRate;

        scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        scriptProcessor.onaudioprocess = function (audioProcessingEvent) {
          if (shouldCapture) {
            processAudio(audioProcessingEvent.inputBuffer.getChannelData(0));
          }
        };

        mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
        mediaStreamSource.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
      } catch (error) {
        throw new ns.UnsupportedMicrophoneError(error.message || "Failed to connect audio processor.");
      }
    };

    var connect = function () {
      return getUserMedia().then(
        function (mediaStream) {
          configureAudioProcessing(mediaStream);
        }
      );
    };

    var on = function () {
      shouldCapture = true;
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_STARTED);
    };

    var mute = function () {
      shouldCapture = false;
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_PAUSED);
    };

    var off = function () {
      shouldCapture = false;
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_STOPPED);
    };

    var setAudioProcessor = function (processor) {
      if ((typeof processor) !== "function") {
        throw new Error("setAudioProcessor must be called with a function.");
      }
      processAudio = processor;
    };

    (function () {
      shouldCapture = false;
    }());

    return {
      get sampleRate() {
        return sampleRate;
      },

      set sampleRate(value) {
        throw new Error("Invalid operation.");
      },

      setAudioProcessor: setAudioProcessor,
      connect: connect,
      on: on,
      mute: mute,
      off: off
    };
  };

  ns.SwfMicrophone = function (referenceName, swfPath, swfId, replacementId) {
    var resolveConnectionRequest;
    var rejectConnectionRequest;
    var swfContainer;
    var swf;
    var processAudio;
    var sampleRate;

    var reset = function () {
      swfobject.removeSWF(swfId);
      swfContainer.html('<div id="' + replacementId + '"></div>');
    };

    var connect = function () {
      return new Promise(
        function (resolve, reject) {
          try {
            var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
            if (!isSafari && !swfobject.getFlashPlayerVersion().major) {
              throw new Error("Flash player not found.");
            }

            resolveConnectionRequest = resolve;
            rejectConnectionRequest = reject;

            var flashvars = {
              afterSwfInitialized: (referenceName + ".afterSwfInitialized"),
              processSwfAudio: (referenceName + ".processSwfAudio")
            };

            var params = {
              wmode: "transparent",
              AllowScriptAccess: "always"
            };

            var attributes = {
              id: swfId
            };
            swfobject.embedSWF(swfPath, replacementId, "215", "138", "11", false, flashvars, params, attributes);
          } catch (error) {
            reset();
            reject(new ns.UnsupportedMicrophoneError("Failed to embed swf. " + (error.message || "")));
          }
        }
      );
    };

    var afterSwfInitialized = function (statusCode) {
      if (statusCode === "READY") {
        swf = $j('#' + swfId).get(0);
        $j('#' + swfId).width(1);
        $j('#' + swfId).height(1);
        resolveConnectionRequest();
      } else {
        reset();
        if (statusCode === "MISSING") {
          rejectConnectionRequest(new ns.MissingMicrophoneError("Microphone not found (swf)."));
        } else if (statusCode === "PERMISSION") {
          rejectConnectionRequest(new ns.MicrophonePermissionError("Microphone permission denied (swf)."));
        } else {
          rejectConnectionRequest(new ns.UnsupportedMicrophoneError("Failed to inialize swf. " + (statusCode || "")));
        }
      }
    };

    var processSwfAudio = function (float32Samples) {
      processAudio(float32Samples);
    };

    var on = function () {
      swf.on();
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_STARTED);
    };

    var mute = function () {
      swf.off();
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_PAUSED);
    };

    var off = function () {
      swf.off();
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_STOPPED);
    };

    var setAudioProcessor = function (processor) {
      if ((typeof processor) !== "function") {
        throw new Error("setAudioProcessor must be called with a function.");
      }
      processAudio = processor;
    };

    (function () {
      sampleRate = 44100;
      swfContainer = $j('#' + replacementId).parent();
    }());

    return {
      get sampleRate() {
        return sampleRate;
      },

      set sampleRate(value) {
        throw new Error("Invalid operation.");
      },

      setAudioProcessor: setAudioProcessor,
      connect: connect,
      afterSwfInitialized: afterSwfInitialized,
      processSwfAudio: processSwfAudio,
      on: on,
      mute: mute,
      off: off
    };
  };

  ns.Mp3Encoder = function (mp3Processor, sampleRate) {
    var worker;

    var logTimings = function (message) {
      var timings = message.timings;

      var total = timings[(timings.length - 1)].finished - timings[0].posted;
      var results = "segment:" + message.segment + ",total:" + total;

      var counter;
      for (counter = 0; counter < (timings.length - 1); counter++) {
        var currentAttribute = Object.keys(timings[counter]).pop();
        var currentAttributeStartedAt = timings[counter][currentAttribute];

        var nextAttribute = Object.keys(timings[counter + 1]).pop();
        var nextAttributeStartedAt = timings[counter + 1][nextAttribute];

        results += "," + currentAttribute + ":" + (nextAttributeStartedAt - currentAttributeStartedAt);
      }
      console.log(results);
    };

    var convert = function (segment, pcmSamples) {
      var message = {
        action: "convert",
        segment: segment,
        samples: pcmSamples,
        timings: []
      };

      message.timings.push({
        posted: Date.now()
      });

      worker.postMessage(message);
    };

    var processWorkerResponse = function (event) {
      var message = event.data;

      message.timings.push({
        finished: Date.now()
      });
      /*
      if ((message.segment % 100) === 0) {
        logTimings(message);
      }
      */

      mp3Processor(message.mp3Data);
    };

    (function () {
      worker = new Worker("/shared/js/audio_recordings/mp3_encoder.js");
      worker.onmessage = processWorkerResponse;
      worker.postMessage({
        action: "init",
        config: {
          sampleRate: sampleRate,
          bitRate: 64,
          chunkSize: 1152
        }
      });
    }());

    return {
      convert: convert
    };
  };

  ns.Recorder = function (mediaServer, jsMicrophone, swfMicrophone) {
    var mp3Encoder;
    var segment;
    var microphone;

    var processAudio = function (float32Samples) {
      var counter = float32Samples.length;
      var int16Samples = new Int16Array(counter);

      var total = 0;
      while (counter--) {
        var float32Sample = Math.max(-1, Math.min(1, float32Samples[counter]));
        int16Samples[counter] = float32Sample < 0 ? float32Sample * 0x8000 : float32Sample * 0x7FFF;
        total += Math.pow(Math.min(Math.abs(float32Sample), 1), 2);
      }

      mp3Encoder.convert(segment++, int16Samples);

      var volumeInfo = {};
      volumeInfo.volume = Math.sqrt(total / float32Samples.length); //root mean square
      audioRecorderEventBus.publish(audioRecorderEvents.MICROPHONE_VOLUME, volumeInfo);
    };

    var connect = function () {
      return mediaServer.connect().then(
        function () {
          if (microphone) {
            console.log("Re-established WebSocket connection.");
          } else {
            return (microphone = (jsMicrophone || swfMicrophone)).connect().then(
              function () {
                if (jsMicrophone) {
                  console.log("Using JS microphone (" + microphone.sampleRate + ").");
                } else {
                  console.log("Using SWF microphone (" + microphone.sampleRate + ").");
                }
                mp3Encoder = new ns.Mp3Encoder(mediaServer.save, microphone.sampleRate);
              }
            );
          }
        }
      ).catch(ns.UnsupportedMicrophoneError, ns.MissingMicrophoneError, ns.MicrophonePermissionError, ns.RecordingUnavailableError,
        function (error) {
          microphone = undefined;
          var logMessage = "Failed to connect " + (jsMicrophone ? 'js' : 'swf') + " microphone. " + error.name + ": " + error.message;

          if (error instanceof ns.MissingMicrophoneError) {
            audioRecorderEventBus.publish(audioRecorderEvents.MISSING_MICROPHONE_ERROR);
            return Promise.reject(new Error(logMessage));
          } else if (error instanceof ns.MicrophonePermissionError) {
            audioRecorderEventBus.publish(audioRecorderEvents.MICROPHONE_PERMISSION_ERROR);
            return Promise.reject(new Error(logMessage));
          } else if (error instanceof ns.RecordingUnavailableError) {
            audioRecorderEventBus.publish(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR);
            return Promise.reject(new Error(logMessage));
          } else {
            if (jsMicrophone) {
              jsMicrophone = undefined;
            } else {
              swfMicrophone = undefined;
            }

            console.log(logMessage);

            if (jsMicrophone || swfMicrophone) {
              return connect();
            } else {
              audioRecorderEventBus.publish(audioRecorderEvents.UNSUPPORTED_BROWSER_ERROR);
              return Promise.reject(new Error("No microphone available to connect."));
            }
          }
        }
      ).catch(ns.ServerConnectionError,
        function (error) {
          audioRecorderEventBus.publish(audioRecorderEvents.SERVER_CONNECTION_ERROR);
          return Promise.reject(new Error(error.message));
        }
      );
    };

    var isConnected = function () {
      return (mediaServer.isConnected() && microphone);
    };

    var start = function () {
      if (isConnected()) {
        microphone.on();
      } else {
        connect().then(
          function () {
            microphone.on();
          }
        ).catch(
          function (error) {
            console.log(error.message);
          }
        );
      }
    };

    var stop = function () {
      microphone.off();
    };

    var pause = function () {
      microphone.mute();
    };

    var reset = function () {
      mediaServer.reset();
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_CAPTURE_RESET);
    };

    var eventListener = function (topic) {
      if (topic === audioRecorderEvents.START_RECORDING) {
        start();
      } else if (topic === audioRecorderEvents.STOP_RECORDING) {
        stop();
      } else if (topic === audioRecorderEvents.PAUSE_RECORDING) {
        pause();
      } else if (topic === audioRecorderEvents.RESET_RECORDING) {
        reset();
      }
    };

    (function () {
      segment = 0;

      if (jsMicrophone) {
        jsMicrophone.setAudioProcessor(processAudio);
      }

      if (swfMicrophone) {
        swfMicrophone.setAudioProcessor(processAudio);
      }

      audioRecorderEventBus.subscribe(audioRecorderEvents.START_RECORDING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_RECORDING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_RECORDING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.RESET_RECORDING, eventListener, 100);
    }());
  };

  ns.Player = function (authorizeUrl) {
    var PLAYING_STATE = "PLAYING";
    var PAUSED_STATE = "PAUSED";
    var STOPPED_STATE = "STOPPED";
    var ENDED_STATE = "ENDED";

    var state;
    var audio;
    var timerIntervalId;
    var seekToTimeSecs;

    //JSLint declarations ('{a}' was used before it was defined)
    var durationChangeAudioEvent;
    var canPlayAudioEvent;
    var playAudioEvent;
    var pauseAudioEvent;
    var endedAudioEvent;
    var authorize;
    var reset;
    var initialize;
    var start;
    var pause;
    var stop;
    var publishPlaybackTime;
    var clearTimer;
    var eventListener;

    authorize = function () {
      return new Promise(
        function (resolve, reject) {
          $j.getJSON(authorizeUrl)
            .done(function (response) {
              if (response.status === 'success') {
                resolve(response.certificate);
              } else {
                reject(new ns.RecordingUnavailableError("Unable to authorize playing through media server. Error: " + response.reason));
              }
            })
            .fail(function (jqxhr, textStatus, error) {
              reject(new ns.ServerConnectionError("Unable to connect to media server (http). Error: " + error + " (" + textStatus + ")"));
            });
        });
    };

    reset = function () {
      if (audio) {
        audio.removeEventListener("play", playAudioEvent);
        audio.removeEventListener("pause", pauseAudioEvent);
        audio.removeEventListener("ended", endedAudioEvent);
        audio = undefined;
      }
    };

    initialize = function () {
      if (!audio) {
        authorize().then(
          function (certificate) {
            audio = new Audio();
            audio.addEventListener("durationchange", durationChangeAudioEvent);
            audio.addEventListener("canplay", canPlayAudioEvent);
            audio.src = certificate.path + "?expires=" + encodeURIComponent(certificate.expiration) + "&hash=" + certificate.hash + "&t=" + Date.now();
          },
          function (error) {
            if (error instanceof ns.RecordingUnavailableError) {
              audioRecorderEventBus.publish(audioRecorderEvents.RECORDING_UNAVAILABLE_ERROR);
            } else if (error instanceof ns.ServerConnectionError) {
              audioRecorderEventBus.publish(audioRecorderEvents.SERVER_CONNECTION_ERROR);
            }
            console.log(error.name + ": " + error.message);
          }
        );
      } else {
        audio.addEventListener("play", playAudioEvent);
        audio.addEventListener("pause", pauseAudioEvent);
        audio.addEventListener("ended", endedAudioEvent);
        start();
      }
    };

    durationChangeAudioEvent = function () {
      audio.removeEventListener("durationchange", durationChangeAudioEvent);
      console.log("audio duration: " + audio.duration);
    };

    canPlayAudioEvent = function () {
      audio.removeEventListener("canplay", canPlayAudioEvent);
      initialize();
    };

    playAudioEvent = function () {
      if (!timerIntervalId) {
        timerIntervalId = window.setInterval(publishPlaybackTime, 200);
      }
      audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_PLAYBACK_STARTED);
    };

    endedAudioEvent = function () {
      if (audio.paused) {
        state = ENDED_STATE;
      }
      audioRecorderEventBus.publish(audioRecorderEvents.STOP_PLAYING);
    };

    pauseAudioEvent = function () {
      if (state === PAUSED_STATE) {
        audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_PLAYBACK_PAUSED);
      } else if (state === STOPPED_STATE) {
        audio.currentTime = 0;
        audioRecorderEventBus.publish(audioRecorderEvents.AUDIO_PLAYBACK_STOPPED);
      }
    };

    publishPlaybackTime = function () {
      var playbackInfo = {};
      playbackInfo.currentTimeSecs = audio.currentTime;
      audioRecorderEventBus.publish(audioRecorderEvents.PLAYBACK_CURRENT_TIME, playbackInfo);
    };

    start = function () {
      if (!audio) {
        initialize();
      } else {
        state = PLAYING_STATE;
        if (seekToTimeSecs !== undefined) {
          audio.currentTime = seekToTimeSecs;
          seekToTimeSecs = undefined;
        }
        audio.play();
      }
    };

    pause = function () {
      if (timerIntervalId) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = undefined;
      }

      state = PAUSED_STATE;
      audio.pause();
    };

    stop = function () {
      if (timerIntervalId) {
        window.clearInterval(timerIntervalId);
        timerIntervalId = undefined;
      }

      var previousState = state;
      state = STOPPED_STATE;

      if (previousState === PLAYING_STATE) {
        audio.pause();
      } else if (
        (previousState === PAUSED_STATE) ||
        (previousState === ENDED_STATE)) {
        pauseAudioEvent();
      }
    };

    eventListener = function (topic, data) {
      if (topic === audioRecorderEvents.START_PLAYING) {
        if (data && (data.seekToTimeSecs !== undefined)) {
          seekToTimeSecs = data.seekToTimeSecs;
        }
        start();
      } else if (topic === audioRecorderEvents.PAUSE_PLAYING) {
        pause();
      } else if (topic === audioRecorderEvents.STOP_PLAYING) {
        stop();
      } else if (topic === audioRecorderEvents.START_RECORDING) {
        reset();
      }
    };

    (function () {
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_PLAYING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.PAUSE_PLAYING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.STOP_PLAYING, eventListener, 100);
      audioRecorderEventBus.subscribe(audioRecorderEvents.START_RECORDING, eventListener, 100);
    }());
  };

}(window.clg.audio.recorder));