/*
 * commonUtils.js contains a list of commonly used utilities that can be used across all sites
 * Prototype.js version 1.6 or above is required
 * Script.aculo.us is required
 */

window.clg = window.clg || {};
window.clg.commonUtils = window.clg.commonUtils || {};

(function(ns) {
	ns.addOption = function(selectObj, text, value) {
		newOptionObj = new Element('option', {value: value}).update(text);
		$(selectObj).appendChild(newOptionObj);
	};

	ns.removeOption = function(selectObj, value) {	
		$(selectObj).childElements().each(function(optionObj) {
			if (optionObj.value == value) {
				optionObj.remove();
			}
		});		
	};
	
	ns.containsOption = function(selectObj, value) {
		var hasOption = false;
		$(selectObj).childElements().each(function(optionObj) {
			if (optionObj.value == value) {
				hasOption = true;
				$break;
			}
		});
		return hasOption;
	};

	ns.formatCurrency = function(total){
		var neg = false;
		if(total < 0) {
			neg = true;
			total = Math.abs(total);
		}
		return (neg ? "-$" : '$') + parseFloat(total, 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
	};

	ns.dateDiffInDays = function(a, b) {
		// a and b are javascript Date objects
		// Discard the time and time-zone information.
		var _MS_PER_DAY = 1000 * 60 * 60 * 24;
		var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
		var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

		return Math.floor((utc2 - utc1) / _MS_PER_DAY);
	};

	ns.setCookie = function(cName, value, exdays) {
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value = escape(value) + ((exdays==null) ? "" : "; expires=" + exdate.toUTCString());	
		c_value += "; path=/";			
		document.cookie = cName + "=" + c_value;
	};

	ns.deleteCookie = function(cName) {
		ns.setCookie(cName, "", -1);
	};

	ns.getCookie = function(cName) {
		var nameEQ = cName + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	};
	
	ns.scrollTo = function(elementId) {
		if ($(elementId)) {
			Effect.ScrollTo(elementId, {duration: 0.5});
		}
	};
	
	ns.submitFormWithAction = function(form, action, disableAllButtons) {
		form = $(form);
		var hiddenAction = new Element('input', {type: 'hidden', name: 'action', value: action});
		form.appendChild(hiddenAction);
		if (disableAllButtons) {
			var buttonArray = $$('input[type="submit"]', 'input[type="button"]');
			buttonArray.each(function(button) {			
				button.value = 'Please Wait';			
				button.disable();			
			});
		}
		form.submit();
	};
	
	/*
	 * Submits the form object and sets one or all buttons to the 'newValue' parameter and optionally disables the buttons.
	 * Checks to see if a hidden form input with the attribute name matching the button name exists and sets this hidden input value equal
	 * to the initial submit button value.  If a hidden attribute with the button name does not exist in the form it will
	 * be created, appended to the form, and assigned the initial value of the submit button.
	 *
	 * form - required
	 * submitButton - required
	 * newValue - required
	 * shouldDisable - optional (defaults to true)
	 * changeAllButtons - optional (defaults to false)
	 */
	ns.submitForm = function(form, submitButton, newValue, shouldDisable, changeAllButtons) {
		//extend objects
		form = $(form);
		submitButton = $(submitButton);		
		shouldDisable = (Object.isUndefined(shouldDisable)) ? true : shouldDisable;
		
		var hiddenAction = form.down('input[type="hidden"][name="' + submitButton.name + '"]');
		if (hiddenAction != null) {				
			hiddenAction.value = submitButton.value;
		}
		else {				
			hiddenAction = new Element('input', {type: 'hidden', name: submitButton.name, value: submitButton.value});
			form.appendChild(hiddenAction);
		}

		if (changeAllButtons) {
			var buttonArray = $$('input[type="submit"]', 'input[type="button"]');
			buttonArray.each(function(button) {
				button.name = 'pleaseWait';
				button.value = newValue;			
				if (shouldDisable) {
					button.disable();
				}
			});
		}
		else {
			submitButton.name = 'pleaseWait';
			submitButton.value = newValue;
			if (shouldDisable) {
				submitButton.disable();
			}
		}	
		
		form.submit();				
	};
	
	ns.getRemainingChars = function(maxChars, textarea) {
		var input;
		var isChrome = window.chrome;
		if(isChrome) {
		    input = $(textarea).value.replace(/\r\n/g, '\n')    
	        .replace(/\r/g, '\n')       
	        .replace(/\n/g, '\r\n');	
		} else {
			input = $(textarea).value;
		}

		var currentCharCount = input.length;
		var remainingChars = maxChars - currentCharCount;
		return remainingChars;
	};

	ns.updateWordCount = function(maxChars, textarea, wordCount, button) {
		var remainingChars = ns.getRemainingChars(maxChars, textarea);
		wordCount = $(wordCount);
		button = $(button);
		wordCount.innerHTML = remainingChars;
		if (remainingChars < 0) {
			wordCount.addClassName("over-limit");
			button.disabled = true;
		} else {
			if (wordCount.hasClassName("over-limit")) {
				wordCount.removeClassName("over-limit");
			}
			button.disabled = false;
		}
	};
	
	ns.textAreaWordCountDown = function(maxChars, textarea, wordCount) {
		var remainingChars = ns.getRemainingChars(maxChars, textarea);
		wordCount = $(wordCount);
		wordCount.innerHTML = remainingChars;
		if (remainingChars < 0) {
			wordCount.addClassName("over-limit");
		} else {
			if (wordCount.hasClassName("over-limit")) {
				wordCount.removeClassName("over-limit");
			}
		}
	};
	
	/*
	 * Disables all form elements that are descendants of the parent element. 
	 * If a form or form element has the class name 'allowReadOnly', it will not be disabled.
	 */
	ns.disableFormElements = function(parentElement) {
		var formList = null;
		if ($(parentElement)) {
			formList = $(parentElement).select('form');
		}
		
		if (formList != null) {
			formList.each(function(formElem) {
				if (!formElem.hasClassName('allowReadOnly')) {
					var formElementList = formElem.getElements();
					if (formElementList != null) {
						formElementList.each(function(element) {
							if ((!element.hasClassName('allowReadOnly')) && (element.type != 'hidden')) {
								element.disable();
							}
						});
					}
				}
			});
		}
	};
	
	/**
	 * @param tagName
	 * @param pattern
	 * @param matchPosition start or end
	 * @returns {Array}
	 */
	ns.getElementsWithIdLike = function(tagName, pattern, matchPosition) {
		var likeElements = new Array();
		$$(tagName).each(function(element) {
			if (matchPosition == 'end') {
				if (element.id.endsWith(pattern)) {
					likeElements.push(element);
				}
			}else {
				if (element.id.startsWith(pattern)) {
					likeElements.push(element);
				}
			}
		});	
		return likeElements;	
	};
	
	ns.isTouchDevice = function() {
		return !!('ontouchstart' in window) || (window.MSPointerEvent) || (window.PointerEvent);
	};
	
	ns.toggleBlind = function(controlObj, targetObj, duration) {
		if (!duration) {
			duration = 0.4;
		}
		$(controlObj).toggleClassName('active');
		Effect.toggle($(targetObj), 'blind', { duration: duration });	
	};
	
    ns.hideOtherSimplePopouts = function(element) {
        var ancestors = element.ancestors();
        $$('a[rel="simplePopout"]').each(function(item) {
            var properties = item.retrieve('properties');
            if (properties && properties.targetObj.visible() && (-1 == ancestors.indexOf(properties.targetObj))) {
                properties.controlObj.simulate('click');
            }
        });
	};
	
	ns.createCustomEventHandler = function(eventName, callbackFn) { 
		if(!callbackFn) {
			return function() { return true; };
		}
		else {
			return function(target) {
				var args = Array.prototype.slice.call(arguments, 1);
				var defaultPrevented = false;
				var event = {
					type: eventName,
					target: target,
					preventDefault: function() { defaultPrevented = true }
				};
				
				args.unshift(event);
				callbackFn.apply(this, args);
				
				return !defaultPrevented;
			}
		}
	};
	
	ns.simplePopout = function(item) { 
	    var targetObj = $(item.target);
	    var closeObjArray = targetObj.select('.close');
	    var actionEvent = Prototype.Browser.MobileSafari ? 'touchstart' : 'click';
	    var properties = {
            targetObj: targetObj,
            controlObj: item,
            onclick: item.onclick,
            closeObjArray: closeObjArray,
            actionEvent: actionEvent,
            activeTarget: $(item.readAttribute('data-activeTarget')),
	    	onClose: ns.createCustomEventHandler('popoutClose', null)
        };
	    
	    if (targetObj.visible()) {  
	        properties.documentClickEventHandler = document.on(actionEvent, ns.simplePopoutDocumentClickHandler.bind(properties));        
	    }
	    // store a reference to properties on the item
	    item.store('properties', properties);
	    
	    // remove the onclick. It will be executed after the click event.
	    item.onclick = function() { return false; };
	    item.on('click', function(event) {
	        //cancel any previous click events on the document
	        if (this.documentClickEventHandler) {        	     
	            this.documentClickEventHandler.stop();
	        }        
	        
            // prevent this event from bubbling up to the document click event
            event.stop();
	        if (this.targetObj.visible()) {
	        	if(this.onClose(item)) {
	        		this.targetObj.hide();
		            this.controlObj.removeClassName('active');
		            if (this.activeTarget)
		                this.activeTarget.removeClassName('active');
	        	}
	        	else {
	        		this.documentClickEventHandler = document.on(this.actionEvent, ns.simplePopoutDocumentClickHandler.bind(this));
	        	}
	        }else {
	            ns.hideOtherSimplePopouts(this.controlObj);
	        	var position = this.controlObj.readAttribute('data-position');
	        	if (position == 'above') {
	        		this.targetObj.setStyle({top: '-' + this.targetObj.getHeight()-10 + 'px'});
	        	}
	            this.targetObj.show();            
	            this.controlObj.addClassName('active');                                    
                if (this.activeTarget)
                    this.activeTarget.addClassName('active');
                this.documentClickEventHandler = document.on(this.actionEvent, ns.simplePopoutDocumentClickHandler.bind(this));            
	        }
	        
	        //run onclick code
	        if (Object.isFunction(this.onclick)) {
	            this.onclick();
	        }
	    }.bind(properties));
	    //Prevent mouseup bubbling to avoid interaction with tablesorter
	    item.on('mouseup', function(event) {
	        event.stop();
	    });
	};
	
	ns.simplePopoutDocumentClickHandler = function(event, element) {						
		if (this.closeObjArray.indexOf(element) != -1 || (element != this.controlObj && element != this.targetObj && !element.descendantOf(this.controlObj) && !element.descendantOf(this.targetObj))) {						
			// Handles clicking outside the popup
			this.controlObj.simulate('click');
		}
	};
	
	ns.resetSimplePopout = function() {
		$$('a[rel="simplePopout"]').each(function(item) {	
			var properties = item.retrieve('properties');
			if (properties && properties.documentClickEventHandler) {
				properties.documentClickEventHandler.stop();
			}
			item.stopObserving();
			ns.simplePopout(item);
		});
	};
	
	ns.hideSimplePopout = function(element) {
		var item = $(element);
		var properties = item.retrieve('properties');
        if (properties && properties.targetObj.visible()) {
            properties.controlObj.simulate('click');
        }
	};
	
	ns.setSimplePopoutCloseCallback = function(element, onCloseFn) {
		var item = $(element);
		
		var properties = item.retrieve('properties');
		if(properties) {
			properties.onClose = ns.createCustomEventHandler('popoutClose', onCloseFn);
		}
	};
	
	ns.embedVideo = function(replaceElemId, width, height, flashvars, params, attributes, setVideoCompleteCallback, disallowStudentDownloadOnPlay) {
        // Flashvars parameter (a misnomer right now) contains information for flash videos, but the code changes the extension to .mp4 as desired
		// Another cleanup task might be changing the contents of this parameter and renaming it so this extension change isn't needed
		// This wasn't done at this time because there might be nesting of javascript or otherwise that depends on this naming
		// FB 31206 was to remove fallback code for the flash player, which is what this function reflects at this moment
		var videoFileName = null;
		var flashVideoFileName = flashvars['file'];

		if (flashVideoFileName != null) {
			var extensionStart = flashVideoFileName.lastIndexOf('.');

			if (extensionStart >= 0) {
				videoFileName = flashVideoFileName.substring(0, extensionStart) + ".mp4";
			}
		}

		if (videoFileName != null) {
			var trackingInfo = null;
			var streamer = flashvars['streamer'];

			if (streamer != null) {
				var re = new RegExp("^.*tracking_info=(.*)$", "gi");
				var matches = re.exec(streamer);
				if (matches[1] != null) {
					trackingInfo = matches[1].split("&")[0];
				}
			}

			var autoStart = (flashvars['autostart'] == 'true');
			var allowFullScreen = (params['allowfullscreen'] == 'true');

			var parentElem = $(replaceElemId).up();
			var originalParentHTML = parentElem.innerHTML;

			var errorCallback = function () {
				parentElem.update(originalParentHTML);
			};

			clg.commonUtils.embedHTML5Video(videoFileName, flashvars['image'], width, height, autoStart, allowFullScreen, $(replaceElemId), trackingInfo, flashvars['captionfiles'], errorCallback, setVideoCompleteCallback, disallowStudentDownloadOnPlay);
		}
	};
	
	ns.embedHTML5Video = function(videoFileName, poster, width, height, autoPlay, allowFullScreen, replaceElem, trackingInfo, captionfiles, errorCallback, setVideoCompleteCallback, disallowStudentDownloadOnPlay) {
		var videoElem = new Element('video', { width: width, height: height, controls: 'controls' } );

		if (poster != null) {
			videoElem.setAttribute('poster', poster);
		}
		
		if (autoPlay) {
			videoElem.setAttribute('autoplay', 'autoplay');
		}
		
		var sourceElem = new Element('source', { src: videoFileName, type: 'video/mp4' });
        videoElem.appendChild(sourceElem);
        videoElem.hide();

        var playCount = 0;

        var videoCompleteCallback = function () {
            clg.video.completeVideoActivity();
        };
        
        videoElem.addEventListener('play', function(event) {
        	if (playCount == 0) {
        		var params = { file : videoFileName };
        		
        		if (trackingInfo != null) {
        			params['tracking_info'] = trackingInfo;
        		}

        		if (! disallowStudentDownloadOnPlay) {
                    var myAjax = new Ajax.Request('/shared/php/ajax-video-download-tracking.php',
                        {
                            parameters: params,
                            method: 'get'
                        });
                }
        	}
        	
        	playCount++;
        }, true);

        if(captionfiles != null && captionfiles.length > 0){
            var index;
            for (index = 0; index < captionfiles.length; index++) {

                if(captionfiles[index].abbrev == "en"){
                    var captionElem = new Element('track', { src: '/videocontent/' + captionfiles[index].file, kind: 'captions', srclang: captionfiles[index].abbrev, label: captionfiles[index].language_name, default : 'default'});
                }else{
                    var captionElem = new Element('track', { src: '/videocontent/' + captionfiles[index].file, kind: 'captions', srclang: captionfiles[index].abbrev, label: captionfiles[index].language_name});
                }
                videoElem.appendChild(captionElem);
            }
        }

        videoElem.addEventListener('loadstart', function(event) {
        	videoElem.show();
        }, true);

        videoElem.addEventListener('error', function(event) {
        	errorCallback();
        }, true);

        if (setVideoCompleteCallback) {
            videoElem.addEventListener('ended', function(event) {
        	    videoCompleteCallback();
            }, true);
        }

        replaceElem.insert({ after: videoElem });
        replaceElem.remove();
	};

    ns.getAuthGoUrl = function(site, authorizer, targetUri) {
        return "/main/AuthGo/site/" + site + "/authorizer/" + authorizer + "/uri/" + encodeURIComponent( window.btoa( targetUri));
    };

    /**
     * Convert a SQL Date format string to one that is supported across all browsers
     * SQL date format                  : "2017-04-11 10:58:30"
     * Browser supported date format    : "2017/04/11 10:58:30"
     */
    ns.getBrowserSupportableDateTimeStringFromSqlDateFormatString = function( sql_date_time_string){
        return sql_date_time_string.replace(/-/ig, '/');
    };

    ns.getShortDateFromDate = function( date){
        if( isNaN( date)) {return undefined;}
        return new Date ( new Date( date).setHours(0, 0, 0, 0));
    };

    ns.camelCaseToKebabCase = function( camelCaseString){
        return camelCaseString.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
    };

    ns.kebabCaseToCamelCase = function( kebabCaseSting){
        return kebabCaseSting.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
    }


}(window.clg.commonUtils));

document.observe('dom:loaded', function(event) {
	$$('a[rel="simplePopout"]').each(function(item) {
		clg.commonUtils.simplePopout(item);
	});
});
