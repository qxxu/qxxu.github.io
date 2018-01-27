/***************************************************/
/****           Activity Base Object            ****/
/***************************************************/
var Activity = function (activityInfo) {
    if (activityInfo) {
        this.type = activityInfo.type;
        this.flashVars = activityInfo.flashVars;
        this.razBookCoverPrefix = activityInfo.razBookCoverPrefix;
        this.buildTag = activityInfo.buildTag;
        this.orientation = activityInfo.orientation;
        this.sizeAvailable = activityInfo.sizeAvailable;
        this.listenResourceDeploymentId = $j('#listenResourceDeploymentId').val();
        this.htmlListenBookActive = activityInfo.htmlListenBookActive;
        this.showFlashAnimatedBooksAsHTMLFallback = activityInfo.showFlashAnimatedBooksAsHTMLFallback;
        for(var ele in this.flashVars) {
            window[ele] = this.flashVars[ele];
            this[ele] = this.flashVars[ele];
        }
    }
};

Activity.prototype.init = function () {
    if (this.type != 'Listen') {
        this.loadContent();
        this.resizeContent();
        this.setWrapperClass();
    }
};

Activity.prototype.loadContent = function () {
    if ($("activityContent"))
        $("activityContent").setStyle({ position: "absolute", top:0, left:0, zIndex: 15 });
};

Activity.prototype.resizeContent = function () {
    var contentDimensions = this.calculateContentDimensions(this.orientation);

    if ($("wrapper")) {
        $("wrapper").style.width = (contentDimensions.width + 24 + ((this.orientation == 'portrait')?300:0)) + "px";
    }
    if ($("mainAreaBackground")) {
        $("mainAreaBackground").style.width = (this.orientation == 'portrait')?((contentDimensions.width + 24) + "px"):"100%";
    }
    if ($("contentArea")) {
        $("contentArea").style.width = contentDimensions.width + "px";
    }
    if ($("contentArea")) {
        $("contentArea").style.height = contentDimensions.height + "px";
    }
    if ($("activityObject")) {
        $("activityObject").style.width = contentDimensions.width + "px";
    }
    if ($("activityObject")) {
        $("activityObject").style.height = contentDimensions.height + "px";
    }

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // RESIZING FOR REDESIGNED 'LISTEN' PLAYER TO MATCH NEW HTML5 'READ' PLAYER
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------

    var book = $j(".new #activityObject");
    var bookRatio = contentDimensions.height / contentDimensions.width;
    var bookNavHeight = 65;
    var bookNavWidth = 140;
    var bookToolbarHeight = 50;
    var windowHeight = $j(window).height();
    var windowWidth = $j(window).width();

    // there are already portrait and landscape classes available for books in the old flash player and reward screen.
    // the same classes should be able to be used for the html5 'read' player as well.
    // but i was not able to make this work, so for now i have added new book-portrait and book-landscape classes below.
    if( bookRatio > 1 ) {
        book.addClass("book-portrait");
    } else {
        book.addClass("book-landscape");
    }

    if( book.hasClass("book-landscape") ) {
        var minBookWidth = 700;
        var maxBookWidth = 1400;
        var minBookHeight = minBookWidth * bookRatio;
        var maxBookHeight = maxBookWidth * bookRatio;

    } else /* book-portrait */ {
        var minBookHeight = 500;
        var maxBookHeight = 1200;
        var minBookWidth = minBookHeight / bookRatio;
        var maxBookWidth = maxBookHeight / bookRatio;
    }

    var padding = 20;
    var bottomPadding = 10;

    // if book nav arrows don't fit anywhere around the book cover
    if ( ((windowHeight - bookToolbarHeight - bookNavHeight) / (windowWidth - padding) <= bookRatio) &&
        ((windowHeight - bookToolbarHeight - padding) / (windowWidth - bookNavWidth) >= bookRatio) &&
        (windowWidth - bookNavWidth < maxBookWidth) &&
        (windowHeight - bookToolbarHeight - bookNavHeight < maxBookHeight) ) {
        book.addClass("forceFitNav").removeClass("bottomNav");

        // if book nav arrows fit on the left and right of the book
    } else if ( ((windowHeight - bookToolbarHeight - padding) / (windowWidth - padding) <= bookRatio) ||
        (windowWidth - bookNavWidth >= maxBookWidth) ) {
        book.removeClass("bottomNav forceFitNav");

        // if book nav arrows fit underneath the book
    } else {
        book.addClass("bottomNav").removeClass("forceFitNav");
    }

    // if window is bigger than max size of book
    if ( (windowWidth >= maxBookWidth + padding) && (windowHeight >= maxBookHeight + bookToolbarHeight + padding) ) {
        if ( book.hasClass("forceFitNav") ) {
            var bookHeight = maxBookHeight - bookNavHeight;
        } else {
            var bookHeight = maxBookHeight;
        }

        // if window is smaller than min size of book
    } else if ( (windowWidth <= minBookWidth + padding) || (windowHeight <= minBookHeight + bookToolbarHeight + padding) ) {
        var bookHeight = minBookHeight;

        // otherwise, resize the book according to the size of the window
    } else {
        if ( book.hasClass("forceFitNav") ) {
            var bookHeight = windowHeight - bookToolbarHeight - bookNavHeight;
        } else if (book.hasClass("bottomNav") ) {
            var bookHeight = (windowWidth - padding) * (bookRatio);
        } else {
            var bookHeight = windowHeight - bookToolbarHeight - bottomPadding;
        }
    }

    var bookWidth = bookHeight / bookRatio;

    book.css("width", bookWidth);
    book.css("height", bookHeight);
    if(activityInfo.type == "Listen") {
        $j("#activityContent").css("left", windowWidth / 2 - bookWidth / 2);
    }
    book.css("top", 50); //below ebook header

    // 'new' class used for 'listen' and for songbooks
    $j(".new.toolbarContent").css("width", bookWidth);
    $j(".new.ebookHeader").css("width", bookWidth);
    
    // toolbar width for videos
    var videoWidth = $j(".video-page #activityContent object, .video-page #activityContent video").attr("width");
    $j(".video-page .ebookHeader").css("width", videoWidth);

    // don't show the header or book until resizing is complete
    $j(".new.ebookHeader").show();
    $j(book).show();

    // -------------------------------------------------

};

Activity.prototype.setWrapperClass = function () {
    if($j("#wrapperInner").length) {
        if(!$j("#wrapperInner").hasClass(this.orientation)){
            $j("#wrapperInner, #header, #topnav, #mainArea").addClass(this.orientation);
        }
    }
};

Activity.prototype.getReferenceDocument = function () {
    var referenceDocument;
    try {
        referenceDocument = window.top.document;
    }
    catch (err) {
        referenceDocument = window.document;
    }
    return referenceDocument;
};

Activity.prototype.calculateContentDimensions = function () {
    if(Prototype.Browser.IE){ //Resetting the overflow style in Firefox reintializes the swf
        $("body").style.overflow = "hidden"; //IE9 is not properly collapsing space when using negative margins
    }

    var viewportWidth = this.getReferenceDocument().documentElement.clientWidth;
    var viewportHeight = this.getReferenceDocument().documentElement.clientHeight;
    var mainAreaPaddingLayout = new Element.Layout("mainAreaPadding");
    var paddingForRecorder = mainAreaPaddingLayout.get("padding-top");
    var baseWidth = 600;
    var baseHeight = 400;
    if(this.orientation == 'portrait'){
        baseWidth = 533;
        baseHeight = 824;
    }

    var width = viewportWidth - ((Prototype.Browser.IE)?58:34) - ((this.orientation == 'portrait')?300:0);
    var height = (width - ((this.orientation == 'portrait')?110:0)) * baseHeight / baseWidth;

    var maxAllowedHeight = viewportHeight - ((Prototype.Browser.IE)?61:58) - ((this.orientation == 'portrait')?0:84);
    if (height > maxAllowedHeight){
        height = maxAllowedHeight;
        width = (height * baseWidth / baseHeight) + ((this.orientation == 'portrait')?110:0);
    }

    var minWidth = 600;
    var minHeight = 400;
    if(this.orientation == 'portrait'){
        minWidth = 396;
        minHeight = 442;
    }
    if ((width < minWidth) || (height < minHeight)){
        if(Prototype.Browser.IE){ //Resetting the overflow style in Firefox reintializes the swf
            $("body").style.overflow = "visible"; //IE9 is not properly collapsing space when using negative margins
        }
        width = minWidth;
        height = minHeight;
    }

    return {"width":width, "height":height - paddingForRecorder};
};

Activity.prototype.extractFlashVar = function (flashVar, index) {
    if (flashVar == undefined || flashVar.indexOf(index) == -1)
        return null;
    var delimiter = "&";
    var pos = flashVar.indexOf(index) + (index).length + 1;
    var endpos = flashVar.indexOf(delimiter, pos);
    if (endpos == -1)
        endpos = flashVar.length;
    return flashVar.substr(pos, endpos - pos);
};

Activity.prototype.isReadingAloudOneStep = function () {
    return false;
};

Activity.prototype.isReadingAloudThreeStep = function () {
    return false;
};

/***************************************************/
/****            Recorder Base Object           ****/
/***************************************************/

var Recorder = function (activityInfo) {

    Activity.apply(this, arguments);
    if (activityInfo) {
        if (activityInfo.flashVars) {
            this.recorderId = activityInfo.flashVars.recorderId;
            this.attachMic = activityInfo.flashVars.attachMic;
        }
        this.buildTagg = activityInfo.buildTag;
    }
};

Recorder.prototype = new Activity();

Recorder.prototype.init = function () {
    Activity.prototype.init.call(this);
    initVoiceDialog();
    this.loadRecorder();
    if (this.attachMic)
        attachMicrophone();
}

Recorder.prototype.loadRecorder = function () {
    if(!isPreview) {
        if ($("mainAreaPadding")) {
            if (this.orientation == "landscape") {
                $("mainAreaPadding").style.padding = this[this.recorderId + "SwfHeight"] + "px 10px 10px 10px";
            }
            else {
                $("mainAreaPadding").style.padding = "0px 10px";
            }
        }
        $(this.recorderId + "SwfDivOuter").style.height = this[this.recorderId + "SwfHeight"] + "px";
        var appendedBuildTag = this.buildTagg;

        this.flashVars.recorderSwfSource.each(function (ele) {
            swfobject.embedSWF("/flash/audio/" + capitalizeFirstLetter(ele) + appendedBuildTag + ".swf", ele + "SwfDiv", this[ele + "SwfWidth"] || 1, this[ele + "SwfHeight"] || 1, "9", false, {},
                {flashvars: this[ele + "SwfVars"], wmode: "transparent", quality: "best"}, {id: ele + "Swf"});
        });
    }
};

/***************************************************/
/****   OneStepRecordingAssessment Base Object  ****/
/***************************************************/
var OneStepRecordingAssessment = function (activityInfo) {
    Recorder.apply(this, arguments);
    if (activityInfo) {
        this.questionList = activityInfo.assessmentContentList.pages;
        this.maxItems = this.questionList.length;
        this.assessmentType = activityInfo.type;
        this.index = 0;
        this.timer = null;
        this.enableNext = true;
        this.timerOn = activityInfo.timerOn;
        this.doneUrl = activityInfo.doneUrl;
    }
}

OneStepRecordingAssessment.prototype = new Recorder();

OneStepRecordingAssessment.prototype.init = function () {
    Recorder.prototype.init.call(this);
}

OneStepRecordingAssessment.prototype.nextItem = function () {
    this.stopTimer(true);
    if (!this.enableNext) {
        return;
    }

    if (++this.index >= this.maxItems) {
        markAsRead(this.doneUrl);
        this.complete();
    } else {
        this.updateQuestion(this.questionList[this.index]);
        incrementProgressList(this.index);

        if (this.index == this.maxItems - 1) {
            this.startTimer(3500, true);
        } else {
            this.startTimer(3000, true);
        }
    }
}

OneStepRecordingAssessment.prototype.startTimer = function (time, fromHere) {
    if (!fromHere) {
        $('maskQuestion').hide();
        $('nextButton').src = "/images/arrow-next.png";
    }
    if(this.timerOn) {
        clearTimeout(this.timer);
        this.timer = setTimeout(function(_this){_this.nextItem()}, time, this);
    }
    this.enableNext = true;
}

OneStepRecordingAssessment.prototype.stopTimer = function (fromHere) {
    if (!fromHere) {
        if (this.index != this.maxItems) {
            $('maskQuestion').show();
        }
        $('nextButton').src = "/images/arrow-next-light.png";
        this.enableNext = false;
    }
    clearTimeout(this.timer);
}

OneStepRecordingAssessment.prototype.loadContent = function () {
    var assessmentMarkUp = '<div id="activityObject" width="100%" align="center">\
    <form class="assessment">\
        <input id="activityName" name="activityName" type="hidden" value="alphabet_recording"/>\
        <input id="assessmentType" name="assessmentType" type="hidden" value="alphabet"/>\
        <input id="timerOn" name="timerOn" type="hidden" value="n"/>\
        <input id="questionIndex" name="questionIndex" type="hidden" value="1"/>\
        <input id="maxQuestions" name="maxQuestions" type="hidden" value="15"/>\
            <div id="recordingQuestions">\
            </div>\
            <div id="maskQuestion" style="display:none;">\
                <div id="innerMaskQuestion">\
                    <a href="javascript:startRemoteRecording();">\
                        <img id="maskImage" src="/images/alphabet/letter-pause.png"/>\
                    </a>\
                </div>\
            </div>\
        <a href="javascript:activity.nextItem();" name="nextAssessment" id="nextAssessment"><img src="/images/arrow-next.png" alt="Next" border="0" id="nextButton" /></a>\
    	<div id="oneStepProgress"><ul id="progressList" class="progressListClass"></ul></div>\
    </form>\
    </div>';
    $j("#activityContent").html(assessmentMarkUp);

    createProgressList(this.maxItems);
}

OneStepRecordingAssessment.prototype.complete = function () {
    var recorder = getRecorder();
    recorder.doneRecording();
    var completionMarkUp = '<div id="lastPage">You have completed your assessment.\
                            <img src="/images/parrot_quiz_300_quiz_perfect.png" width="100%" style="padding-top: 25%; padding-bottom: 25%">\
                            <a href="/main/ReadingAssignment"><img src="/images/home.png" align="center"></a></div>';
    $j("#activityObject").html(completionMarkUp);
}

/***************************************************/
/****                Read Object                ****/
/***************************************************/
var Read = function () {
    Recorder.apply(this, arguments);
};

Read.prototype = new Recorder();

Read.prototype.init = function () {
    Recorder.prototype.init.call(this);
};

Read.prototype.isReadingAloudOneStep = function () {
    return this.extractFlashVar(this.activitySwfVars, "isRunningRecord") == "1" && this.extractFlashVar(this.retellingSwfVars, "readingLevel") == "1";
};

Read.prototype.isReadingAloudThreeStep = function () {
    return this.extractFlashVar(this.activitySwfVars, "isRunningRecord") == "1" && this.extractFlashVar(this.retellingSwfVars, "readingLevel") != "1";
};

Read.prototype.startRetelling = function () {
    var recorder = getRecorder();
    recorder.doneRecording();
};

Read.prototype.loadEBookContent = function () {
    var kidsBookId = this.extractFlashVar(this.activitySwfVars, "razBookId");

    $("eBookContent").innerHTML = "";
    $j.get("/main/EBookHtml5/id/" + kidsBookId, function(data) {
        //$j("#eBookContent").html(data);
    });
};

/***************************************************/
/****               Listen Object               ****/
/***************************************************/
var Listen = function () {
    Activity.apply(this, arguments);
};

Listen.prototype = new Activity();

Listen.prototype.init = function () {
    Activity.prototype.init.call(this);

    if (!this.htmlListenBookActive)
        $j(window).on('beforeunload', function() {
            var swf = null;
            if ($j('activityObject') != null) {
                swf = document.getElementById('activityObject');
                swf.bookmarkListen();
            }
        });
};

/***************************************************/
/****                Quiz Object                ****/
/***************************************************/

var Quiz = function (activityInfo) {
    Activity.apply(this, arguments);
    this.quizOrientation = "landscape";
    this.orientation = this.quizOrientation;
    this.bookOrientation = activityInfo.orientation;
    this.sizeAvailable = activityInfo.sizeAvailable;
    this.activityId = activityInfo.activityId;
};

Quiz.prototype = new Activity();

Quiz.prototype.init = function () {
    Activity.prototype.init.call(this);
};

Quiz.prototype.loadContent = function () {
    this.loadHTML5Content();
};

Quiz.prototype.toggleQuizContent = function () {
    if(html5QuizPlayerEnabled) {
        if(parseInt($("quizContent").getStyle('zIndex')) > parseInt($("bookFlash").getStyle('zIndex'))){
            $j("#quizContent").css("zIndex", "5");
            $j("#quizContent").hide();
            this.orientation = this.bookOrientation;
        }
        else {
            $j("#quizContent").css("zIndex", "15");
            $j("#quizContent").show();
            $("book").style.width = "1px";
            $("book").style.height = "1px";
            this.orientation = this.quizOrientation;
        }
    } else {
        if(parseInt($("activityContent").getStyle('zIndex')) > parseInt($("bookFlash").getStyle('zIndex'))){
            $("activityContent").style.zIndex = "5";
            $("activityObject").style.width = "1px";
            $("activityObject").style.height = "1px";
            this.orientation = this.bookOrientation;
        }
        else {
            $("activityContent").style.zIndex = "15";
            $("book").style.width = "1px";
            $("book").style.height = "1px";
            this.orientation = this.quizOrientation;
        }
    }
    this.resizeContent();
};

Quiz.prototype.resizeContent = function () {
    var contentDimensions = this.calculateContentDimensions();
    if ($("wrapper")) {
        $("wrapper").style.width = (contentDimensions.width + 24 + ((this.orientation == 'portrait')?300:0)) + "px";
    }
    if ($("mainAreaBackground")) {
        $("mainAreaBackground").style.width = (this.orientation == 'portrait')?((contentDimensions.width + 24) + "px"):"100%";
    }
    $("contentArea").style.width = contentDimensions.width + "px";
    $("contentArea").style.height = contentDimensions.height + "px";

    var isHigherQuizZIndex = false;

    if(html5QuizPlayerEnabled && audioHTML5Enabled) {
        if (this.isQuizInForefront()){
            this.setWrapperClass("landscape");
            isHigherQuizZIndex = true;
        }
    } else {
        if ($("activityContent") && !this.bookToggleAllowed() || (parseInt($("activityContent").getStyle('zIndex')) > parseInt($("bookFlash").getStyle('zIndex')))){
            $("activityObject").style.width = contentDimensions.width + "px";
            $("activityObject").style.height = contentDimensions.height + "px";
            this.setWrapperClass("landscape");
            isHigherQuizZIndex = true;
        }
    }
    if(!isHigherQuizZIndex) {
        $("book").style.width = contentDimensions.width + "px";
        $("book").style.height = contentDimensions.height + "px";
        this.setWrapperClass(this.orientation);
    }
};

Quiz.prototype.isQuizInForefront = function() {
    var isForefront = false;
    if($("quizContent")) {
        if($("bookFlash")) {
            return (parseInt($("quizContent").getStyle('zIndex')) > parseInt($("bookFlash").getStyle('zIndex')));
        }
        else {
            isForefront = true;
        }
    }

    return isForefront;

};

Quiz.prototype.bookToggleAllowed = function () {
    return this.extractFlashVar(this.activitySwfVars, "bookToggleAllowed") == "y";
};

Quiz.prototype.loadHTML5Content = function () {
    kidsBookId = (kidsBookId) ? kidsBookId : 0;
    razBookCoverPrefix = this.razBookCoverPrefix;
    activityId = (activityId) ? activityId : 0;

    var quizService = "HTML5QuizPlayerService";
    if(isPreview) {
        quizService = 'ResourceQuizPlayerService';
    }

    $j("activityContentInner").innerHTML = "";
    layoutHTML5QuizPlayer();
    request = "/main/" + quizService + "/action/get_quiz_info/kids_book_id/" + kidsBookId + "/quiz_type/" + quizType;
    if(setIsInIframe()) {
        request = "/laz-cms/index.php?module=" + quizService + "&action=get_quiz_info&kids_book_id=" + kidsBookId + "&quiz_id=" + cmsQuizId +"&quiz_type=" + quizType + "&CRQuestions=yes&isCMS=true";
    }
    if (activityId > 0) request += "/activity_id/" + activityId;
    
    $j.get(request, function(data) {
        quiz = data;
        if(!fromAssessment || html5QuizPlayerEnabled) {
            if (razBookCoverPrefix != undefined && razBookCoverPrefix.indexOf("non_book") != -1) {
                $j("#coverImg").attr("src",razBookCoverPrefix + ".gif");
            } else {
                $j("#coverImg").attr("src",razBookCoverPrefix + ".jpg");
            }
        } else {
            $j("#coverImg").attr("src","/covers/rk_" + zeroPad(kidsBookId, 6) + "_cover.gif"); // TODO: Update.
        }

        html5ResourceDeploymentId = quiz.resource_deployment_id;
        initializeResponseArray(quiz);
        loadResponseAudio();
        if(isPreview) {
            changeQuizDataForReadOnly();
            generateButtonsForReadOnly();
        } else {
        	generateButtons();
        	if (activityId && activityId > 0)
	        	$j(".bookReference a.returnToBook").each(function() {
					var _href = $j(this).attr("href"); 
					pattern = "/fromResults/"+activityId;
					if(!~_href.indexOf(pattern)) {
						$j(this).attr("href", _href + pattern);
					}
				});
        }
        changeQuestion(validateAndZeroIndexStartQuestionNumber(quiz));
        attachHTML5QuizHandlers();
    });
};

/***************************************************/
/****         Alphabet Recording Object         ****/
/***************************************************/
var AlphabetRecording = function () {
    OneStepRecordingAssessment.apply(this, arguments);
};

AlphabetRecording.prototype = new OneStepRecordingAssessment();

AlphabetRecording.prototype.init = function () {
    OneStepRecordingAssessment.prototype.init.call(this);
    $('recordingQuestions').className = "alphabet-recording";
    $('recordingQuestions').update('<img id="recordingLetter"/>');
    $('maskImage').src = "/images/alphabet/letter-pause.png"
    $('maskImage').className = "alphabet-recording";
    $('innerMaskQuestion').className = "alphabet-recording";
    this.updateQuestion(this.questionList[0]);
    incrementProgressList(0);
};

AlphabetRecording.prototype.updateQuestion = function (question) {
    $('recordingLetter').src = "/images/alphabet/" + question.image;
};

/***************************************************/
/****        High Frequency Word Object         ****/
/***************************************************/
var FrequencyWordsRecording = function (activityInfo) {
    OneStepRecordingAssessment.apply(this, arguments);
};

FrequencyWordsRecording.prototype = new OneStepRecordingAssessment();

FrequencyWordsRecording.prototype.init = function () {
    OneStepRecordingAssessment.prototype.init.call(this);
    $('maskImage').src = "/images/graycard-pause.png";
    $('maskImage').className = "high-frequency-words";
    $('innerMaskQuestion').className = "high-frequency-words";
    $('recordingQuestions').className = "high-frequency-words";

    for(var i = 0; i < this.questionList.length; ++i)
        this.questionList[i].content = this.questionList[i].content.replace("$", "'");

    this.updateQuestion(this.questionList[0]);
};

FrequencyWordsRecording.prototype.updateQuestion = function (question) {
    var size;
    if (question.content.length > 5) {
        size = '75px';
    } else if (question.content.length > 4) {
        size = '85px';
    } else {
        size = '100px';
    }
    $('recordingQuestions').update(question.content);
    $('recordingQuestions').style.fontSize = size;
};

/***************************************************/
/****         Alphabet Matching Object          ****/
/***************************************************/
var AlphabetMatching = function (activityInfo) {
    Activity.apply(this, arguments);
    if (activityInfo) {
        this.questionList = activityInfo.assessmentContentList;
        this.maxQuestions = objectLength(activityInfo.assessmentContentList);
        this.index = 0;
        this.isResized = false;
        this.answerList = {};
        this.doneUrl = activityInfo.doneUrl;
        this.studentAssignmentId = activityInfo.studentAssignmentId;
        this.assignmentAddedAt = activityInfo.assignmentAddedAt
    }
    this.numCorrect = 0;
};

AlphabetMatching.prototype = new Activity();

AlphabetMatching.prototype.init = function () {
    Activity.prototype.init.call(this);
    this.updateQuestion();
};

AlphabetMatching.prototype.resizeContent = function () {
    if (!this.isResized) {
        var fixedWidth = 650;
        var fixedHeight = 550;
        $("wrapper").style.width = fixedWidth + 24 + "px";
        $("mainAreaBackground").style.width = fixedWidth;
        $("contentArea").style.width = fixedWidth + "px";
        $("contentArea").style.height = fixedHeight + "px";
        $("activityObject").style.width = fixedWidth + "px";
        $("activityObject").style.height = fixedHeight + "px";
    }
};

AlphabetMatching.prototype.loadContent = function () {
    var alphabetMatchingMarkUp = '<div id="activityObject" width="100%" align="center">\
        <div id="alphabetAssessment" width="100%" align="center">\
            <div id="matchingQuestions" class="alphabet-matching">\
                <img id="matchingLetter"/>\
            </div>\
            <div class="alphabetLetterChoices" style="font-size: 26px">\
                <ul id="radio" class="optional-answers">\
                </ul>\
            </div>\
            <div id="nextItem" class="nextItem" style="display: none">\
                <a href="javascript: activity.nextItem();" name="nextAssessment" id="nextAssessment"><img src="/images/arrow-next.png" alt="Next Match" name="arrow" id="arrow" border="0"/></a>\
            </div>\
            <div id="nextItemDisabled" class="nextItem"><img src="/images/arrow-next-light.png" border="0"/></div>\
    		<div id="alphabetProgress"><ul id="progressList" class="progressListClass"></ul></div>\
        </div>\
    </div>';
    $j("#activityContent").html(alphabetMatchingMarkUp);

    createProgressList(this.maxQuestions);
};

AlphabetMatching.prototype.updateQuestion = function () {
    $('matchingLetter').src = "/images/alphabet/" + this.questionList[this.index].question_image;
    var nextChoices = this.questionList[this.index].choices;
    $j('#radio').html('');
    for(var i = 0; i < nextChoices.length; ++i) {
        var answerId = nextChoices[i].answer_id;
        var answer = nextChoices[i].answer;
        var choiceMarkUp = '<li><input type="radio" id="radio_'+answerId+'" name="radio"  value="'+answerId+'" onclick="javascript: activity.enableNextItemLink();"/><label for="radio_'+answerId+'" >'+answer+'</label></li>';
        $j('#radio').append(choiceMarkUp);
    }

    incrementProgressList(this.index);
};

AlphabetMatching.prototype.enableNextItemLink = function () {
    document.getElementById("nextItemDisabled").style.display = 'none';
    document.getElementById("nextItem").style.display = 'block';
};

AlphabetMatching.prototype.disableNextItemLink = function () {
    document.getElementById("nextItem").style.display = 'none';
    document.getElementById("nextItemDisabled").style.display = 'block';
};

AlphabetMatching.prototype.nextItem = function () {
    this.disableNextItemLink();
    var answerId = $j('#radio').find('input[name=radio]:checked').val();
    var questionId = this.questionList[this.index].question_id;
    this.numCorrect += (answerId == this.questionList[this.index].correct_answer_id) ? 1 : 0;
    this.answerList['q_' + questionId] = answerId;
    if (this.index == this.maxQuestions - 1) {
        this.complete();
    } else {
        ++this.index;
        this.updateQuestion();
    }
};

AlphabetMatching.prototype.complete = function () {
    var _this = this;
    var studentBack = $j('.backBtn').attr('href');
    $j.ajax({
        type: "GET",
        url: this.doneUrl + this.stringifyAnswerList() + "/assignment_added_at/" + this.assignmentAddedAt,
        success: function() {
            var completionMarkUp = '<div id="lastPage">You have ' + _this.numCorrect + ' out of ' + _this.maxQuestions + ' right answers.\
                <img src="/images/parrot_quiz_300_quiz_perfect.png" width="100%" style="padding-top: 10%; padding-bottom: 10%">\
                <a href="/main/ReadingAssignment"><img src="/images/home.png" align="center"></a></div>';
            $j("#activityObject").html(completionMarkUp);
        }
    });
};

AlphabetMatching.prototype.stringifyAnswerList = function () {
    var stringifiedAnswerList = "";
    for(var question in this.answerList) {
        stringifiedAnswerList += "/" + question;
        stringifiedAnswerList += "/" + this.answerList[question];
    }
    return stringifiedAnswerList;
};


/***************************************************/
/****       Watch Object                        ****/
/***************************************************/
var Watch = function (activityInfo) {
    Activity.apply(this, arguments);
};

Watch.prototype = new Activity();

Watch.prototype.init = function () {
    Activity.prototype.init.call(this);
};

Watch.prototype.loadContent = function () {
    clg.commonUtils.embedVideo("activityContentInner", 640, 500, this.activitySwfVars,
        {
            quality: "best",
            allowScriptAccess: "always"
        },
        {
            id : "activityContentInner",
            name  : "activityContentInner"
        },
        true,
        activityInfo['disallowStudentDownloadOnPlay'] === 'y'
    );

    if (activityInfo['studentFacingDescription']) {
        $j("#activityContent").append("<div id='student-facing-video-description' class=\"videoDescription\">" + activityInfo['studentFacingDescription'] + "</div>");
    }
};

/***************************************************/
/****       Global/Flash Invoked Methods        ****/
/***************************************************/
function toggleQuizContent() {
    activity.toggleQuizContent();
}

function startRemoteRecording(){
    var swf = null;
    if($('assessmentSwf') != null){
        swf = $('assessmentSwf');
    }
    swf.startRecording();
}

function nextItem(){
    activity.nextItem();
}

function startTimer(time, fromHere){
    activity.startTimer(time, fromHere);
}

function stopTimer(fromHere){
    activity.stopTimer(fromHere);
}

function takeQuiz(quizUrl){
    window.location = quizUrl;
}

function goHome(homeUrl){
    window.location = homeUrl;
}

function markAsRead(doneUrl) {
    if (doneUrl.indexOf("/Activity/id/") != -1 || doneUrl.indexOf("/main/ReadingBookRoom") != -1 || doneUrl.indexOf("/main/ReadingAssignment") != -1) {
        location.href = doneUrl;
    } else if (activity.isReadingAloudOneStep() && doneUrl.indexOf("/benchmark") != -1) {
        activity.startRetelling();
    } else {
        new Ajax.Request(doneUrl, {
            onSuccess: function(response) {
                if (activity.isReadingAloudOneStep()) {
                    if ($j('.backBtn').attr('href')) {
                        window.location = $j('.backBtn').attr('href');
                    } else {
                        window.location = '/main/StudentPortal';
                    }
                } else if (activity.isReadingAloudThreeStep()) {
                    activity.startRetelling();
                } else {
                    var recorder = getRecorder();
                    if(recorder) recorder.doneRecording();
                }
            }
        });
    }
}

function getRecorder() {
    var recorder = null;
    if($('practiceSwf')){
        recorder = $('practiceSwf');
    }
    if($('assessmentSwf')){
        recorder = $('assessmentSwf');
    }
    if($('readRecordingSwf')){
        recorder = $('readRecordingSwf');
    }
    return recorder;
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function resizeFlash() {
    activity.resizeContent();
}

function enableNext(){
    $('activityObject').enableNext();
}

function stopRecording() {
    $('assessmentSwf').stopRecording();
}

function objectLength(obj) {
    //work around for i.e. not support Object.keys
    var i, count = 0;
    for (i in obj) {
        if (obj.hasOwnProperty(i)) ++count;
    }
    return count;
}


function createProgressList(numberQuestions) {
    for(var i = 0; i < numberQuestions; ++i) {
        $j("#progressList").append("<li></li>")
    }
}

function incrementProgressList(index) {
    if(index > 0) {
        var previous = $j("#progressList li").get(index - 1);
        $j(previous).removeClass("selected");
    }
    var current = $j("#progressList li").get(index);
    $j(current).addClass("selected");
}

function setIsInIframe() {
    var recordingIframeElt;
    try {
        recordingIframeElt = $j("#activityPreviewIframeForRecordingReview", parent.document);
    } catch (err) {
        return false;
    }
    if(recordingIframeElt.length) {
        return true;
    } else {
        return false;
    }
}

var activity = null;
$j(document).ready(function() {
    if (activityInfo != undefined) {
        if (activityInfo.type == "reading_aloud_3_step"){
            activityInfo.type = "quiz";
        }
        activityInfo.type = capitalizeFirstLetter(activityInfo.type);
        activity = new window[activityInfo.type](activityInfo);
        activity.init();
        if (!activityInfo.htmlListenBookActive && activityInfo.type != "read") {
            $j(window).on('resize', _.debounce(activity.resizeContent.bind(activity), 200));
        }
    }
});

// This is deliberatly Synchronous 
function recordListenBookmark(url) {
	$j.ajax({
	     async: false,
	     type: 'GET',
	     url: url,
	     success: function(data) {
	         console.log("recordingBookmark!");
	     }
	});	
}

