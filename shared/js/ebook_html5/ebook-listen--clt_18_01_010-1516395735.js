/*****************************************************************
 *
 * Book class and functions
 *
 ****************************************************************/
var Book = function(completedPages, readFromQuiz, playerData, activityId, htmlListenAnimationsActive, studentAssignmentId) {
    this.playerData = playerData;
    this.deferredBookAudio = new $j.Deferred();
    this.deferredAnimation = new $j.Deferred();
    this.bookPageLoadTimer;
    this.revertToNonAnimated = false;

    this.player = null;
    this.player = new Player(playerData, this);

    if (htmlListenAnimationsActive) {
        this.htmlListenAnimationsActive = true;
    } else {
        this.htmlListenAnimationsActive = false;
    }
    this.readFromQuiz = readFromQuiz;
    this.activityId = activityId;

    this.delayIfNoAnimationContent = AUDIO_WAIT_TIME;
    this.foundListenContent = false;
    this.allowLoadTime();
    this.totalPages = playerData.length;
    this.completedPages = parseInt(completedPages);
    this.bookmark = this.completedPages;
    if (!this.completedPages) {
        this.completedPages = 0;
        this.bookmark = 0;
    }
    if (this.completedPages > 0 && isPreview) {
        this.totalPages = this.completedPages;
    }
    this.isComplete = (completedPages === this.totalPages);
    this.bookWidth = playerData[0]['width'];
    this.bookHeight = playerData[0]['height'];
    $j("#back-page").fadeTo(0, .2);
    this.completionStatus = this.startCompletionStatus();
    this.completePercent = parseInt(100 * completedPages / this.totalPages);
    this.displayPages = {};
    this.displayPages.numPages = this.totalPages;
    this.displayPages.pages = this.getPageArray();
    this.preloadedAnimatedImages = [];
    this.preloadedPageImages = [];
    for (i = 0; i < this.totalPages; i++) {
        this.preloadedAnimatedImages[i] = 0;
        this.preloadedPageImages[i] = 0;
    }

    this.curPage = this.completedPages;
    this.curPageIndex = 0;
    if (this.curPage != 0)  this.curPageIndex = Book.prototype.findPageIndex(this.displayPages.pages, this.curPage);
    this.isBookStart = true;
    this.autoPlayStart = false;

    this.resizePage();
    $j("#js-kidsLoader").width(this.bookWidth);
    $j("#js-kidsLoader").height(this.bookHeight);

    if (studentAssignmentId != "false" && studentAssignmentId != null) {
        this.studentAssignmentId = studentAssignmentId;
    }

    this.imageStrings = this.preloadPages(this.curPageIndex);
    if (this.isImageCached(this.playerData[this.curPageIndex].page_image) ||
        this.preloadedPageImages[this.curPageIndex] == 1) {
        this.hideFilterLoader();
    }

    var _this = this;
    _this.updatePlayPause($j("#audio-play-pause"), false);
    _this.audioState = AudioState.pause;
    if (_this.htmlListenAnimationsActive && (_this.curPageIndex + 1 < _this.totalPages)) {
        _this.bookPageLoadTimer =
            new _this.Timer(_this.revertToNonAnimatedBooks(), _this.playerData[0]['ANIMATED_LISTEN_MAX_SECONDS_TO_LOAD'] *
                1000);
        for (this.pageIndex = 0; this.pageIndex < _this.totalPages; this.pageIndex++) {
            if (_this.playerData[this.pageIndex]["animation_content"] &&
                _this.playerData[this.pageIndex]["animation_content"]['url']) {
                _this.setAnimationSrc(_this.playerData[this.pageIndex]["animation_content"]['url']);
                _this.preloadedAnimatedImages[this.pageIndex] = 1;
                break;
            }
        }
        if ((this.pageIndex + 1 != _this.totalPages) &&
            _this.playerData[this.pageIndex + 1]["animation_content"] &&
            _this.playerData[this.pageIndex + 1]["animation_content"]['url']) {
            _this.setAnimationNextSrc(_this.playerData[this.pageIndex + 1]["animation_content"]['url']);
            _this.preloadedAnimatedImages[this.pageIndex + 1] = 1;
        }
    } else {
        this.deferredAnimation.resolve();
    }

    _this.attachResizeHandler();

    $j.when(
        _this.deferredAnimation, preloadImages(_this.imageStrings)
    ).then(function () {
        _this.preloadedPageImages[_this.curPageIndex] = 1;
        _this.preloadedPageImages[_this.curPageIndex + 1] = 1;
        if (_this.bookPageLoadTimer != undefined) {
            if (_this.bookPageLoadTimer.getTimeLeft() > 0) {
                _this.bookPageLoadTimer.getTimeLeft();
            } else {
                _this.htmlListenAnimationsActive = false;
                _this.revertToNonAnimated = true;
            }
        }
        _this.hideFilterLoader();
        _this.updateCompletionStatus(1);
        _this.setPageSelectButton();
        _this.setControls();
        _this.goToPage(_this.curPageIndex, _this.isBookStart);
        _this.playerLoaded = true;
        _this.setForwardBack();

        if (_this.foundListenContent) {
            _this.setAudioCompleted(false, _this.curPageIndex == 0);
        }
    }, function (reason) {
        console.log(reason); //todo::log
    });

    _this.registerBookMarkListener();
    _this.registerAnimationReadyListener();
    _this.registerAudioPlayingListener();
    _this.registerAudioEndedListener();
};

Book.prototype.registerBookMarkListener = function () {
    var _this = this;
    $j(window).on('beforeunload', function () {
        if ((_this.readFromQuiz == '0') && !listenCompletion) {
            recordBookmark(_this.activityId, _this.displayPages.pages[_this.curPageIndex], _this.revertToNonAnimated);
        }
    });
};

Book.prototype.registerAnimationReadyListener = function () {
    var _this = this;
    $j('#book-player').on('animationReady', function () {
        if (_this.bookPageLoadTimer != undefined && _this.bookPageLoadTimer.getTimeLeft() > 0) {
            _this.bookPageLoadTimer.pause();
        }
        _this.deferredAnimation.resolve();
    });
};

Book.prototype.registerAudioPlayingListener = function () {
    var _this = this;
    $j('#book-player').on('playing', function () {
        if ((!this.ended && !this.paused) && this.currentTime == 0) {
            var funcs = _this.player.createTimingFunctions();
            var audioDelayAfter = _this.playerData[_this.curPageIndex]["animation_content"]["audio_delay_after_speaking"];
            _this.player.sectionTimer = new TenthSecondTimer(10000 + (audioDelayAfter * 1000), funcs);
            //This timer is for the highlighting
            _this.player.sectionTimer.start();
        }

    });
};

Book.prototype.registerAudioEndedListener = function () {
    var _this = this;
    $j('#book-player').on('ended', function () {
        _this.player.audioEnded = true;
        _this.deferredBookAudio.resolve();

        if (_this.htmlListenAnimationsActive &&
            _this.playerData[_this.curPageIndex]["animation_content"] != undefined &&
            _this.playerData[_this.curPageIndex]["animation_content"] != false) {
            $j.when(
                _this.deferredBookAudio.promise(), _this.player.deferredBackgroundAudio.promise()
            ).then(function () {
                _this.setAudioCompleted(true, false);
            });
        } else {
            $j.when(
                _this.deferredBookAudio.promise()
            ).then(function () {
                if (!_this.player.sectionIterator.hasNext()) {
                    _this.setAudioCompleted(true, false);
                }
            });
        }
    });
};

Book.prototype.isImageCached = function (src) {
    var image = new Image();
    image.src = src;
    return image.complete;
};

Book.prototype.revertToNonAnimatedBooks = function () {
    var _this = this;
    if (_this.bookPageLoadTimer != undefined) {
        if (_this.bookPageLoadTimer.getTimeLeft() > 0) {
            _this.bookPageLoadTimer.pause();
        }
    }
};

Book.prototype.showFilterLoader = function () {
    var filterLoader = $j('#js-kidsLoader');
    if (filterLoader) {
        filterLoader.show();
    }
};

Book.prototype.hideFilterLoader = function () {
    var filterLoader = $j('#js-kidsLoader');
    if (filterLoader) {
        filterLoader.hide();
    }
};

Book.prototype.allowLoadTime = function() {
    var waitTime = (this.audioState === AudioState.none) ? 500 : 2500;
    window.setTimeout(function() {
        $j("#page-load-cover").css("z-index", "-50");
    }, waitTime);
};

Book.prototype.startCompletionStatus = function() {
    var retArray = [];
    for (var i = 1; i <= this.totalPages; i++) {
        retArray[i] = (i <= this.completedPages);
    }
    return retArray;
};

Book.prototype.preloadPages = function (currentPageIndex) {
    var imageStrings = [];
    var endIndex = (currentPageIndex >= this.totalPages - 1 || currentPageIndex == this.totalPages) ?
        this.totalPages : currentPageIndex + 2;
    for (var i = currentPageIndex; i < endIndex; i++) {
        var str = this.playerData[i].page_image;
        imageStrings.push(str);
    }

    $j(window).on('ready', function() {
        $j('forward-page').attr('disabled', 'false');
    });
    return imageStrings;
};

Book.prototype.setAnimationSrc = function (animationLink) {
    var animationUrl = animationLink;
    $j('#animationIframe').hide();
    if (animationUrl != undefined) {
        animationUrl = animationUrl.substring(animationUrl.indexOf("animation") - 1);
        $j('#animationIframe').attr('src', animationUrl);
    } else {
        this.deferredAnimation.resolve();
    }
};

Book.prototype.setAnimationNextSrc = function (animationLink) {
    var animationUrl = animationLink;
    if (animationUrl != undefined) {
        animationUrl = animationUrl.substring(animationUrl.indexOf("animation") - 1);
        $j('#prefetchNextFrame').attr('src', animationUrl);
    }
};

Book.prototype.drawPage = function(isBookStart, currentPage) {
    var _this = this;
    this.displayPages.pages = this.getPageArray();

    if (currentPage != undefined) {
        $j('.ebookHeader').show();
        var htmlString = this.getPageHtmlString();
        $j("#book-page-img").html(htmlString);
    }
    $j("#page-" + currentPage).addClass("page-outline");
    this.attachNewPageClick();

    $j("#theImageListen").on("load", function() {
        _this.resizePage();
    });
};

Book.prototype.getPageHtmlString = function() {
    var htmlString = "";
    var imgSrc = this.playerData[this.curPageIndex].page_image;
    htmlString += "<div class='book-page book-page-listen'" +
        " id='page-" + this.playerData[this.curPageIndex].page_number + "'><img " +
        "id='theImageListen' class='theImage theImage-listen' draggable='false' src='" + imgSrc +  "'/></div>";
    return htmlString;
};

Book.prototype.attachNewPageClick = function() {
    var _this = this;
    $j(".book-page").on("click", function() {
        if (!$j(this).hasClass("page-outline")) {
            _this.goToPage($j(this).attr("id").split("-")[1]);
        } else if (_this.audioState === AudioState.play) {
            _this.pauseAudio();
        } else if (_this.audioState === AudioState.stop ||
            _this.audioState === AudioState.pause) {
            _this.playAudio();
        }
    });
};

Book.prototype.getPageArray = function() {
    var retArray = [];
    for (var i = 0; i < this.playerData.length; i++) {
        retArray.push(this.playerData[i].page_number);
        if (i === this.totalPages) {
            break;
        }
    }
    return retArray;
};

Book.prototype.attachResizeHandler = function() {
    var self = this;
    $j(window).on('resize', _.debounce(function () {
        self.resizePage();
    }, 200))
};

Book.prototype.resizePage = function() {
    var book = $j('#book-page');
    var header = $j('.ebookHeader');
    var bookRatio = this.bookHeight / this.bookWidth;
    var bookNavWidth = 140;
    var bookHeaderHeight = $j(".ebookHeader").outerHeight();
    var padding = 20;
    var windowHeight = $j(window).height();
    var windowWidth = $j(window).width();
    var bookSize = new Array();

    bookSize = pageResizer(header, book, padding, bookRatio, bookHeaderHeight, bookNavWidth, windowWidth, windowHeight, 0);
    $j("#js-kidsLoader").width(bookSize['bookWidth']);
    $j("#js-kidsLoader").height(bookSize['bookHeight']);
    this.resizeIFrame(bookSize);

    $j('.bookPage-listen').css({'visibility': 'visible'});
    $j(header).css({'visibility': 'visible'});
    $j(book).show();
}

Book.prototype.resizeIFrame = function(bookSize) {
    if (this.player.book.playerData[this.curPageIndex].animation_content) {
        var firstWordFromTop = this.player.book.playerData[this.curPageIndex].sections[0].phrases[0].words[0].top;
        var totalSections = this.player.book.playerData[this.curPageIndex].sections.length;
        var totalPhrases = this.player.book.playerData[this.curPageIndex].sections[totalSections-1].phrases.length;
        var totalWords = this.player.book.playerData[this.curPageIndex].sections[totalSections-1].phrases[totalPhrases-1].words.length;

        var lastWordTop = this.player.book.playerData[this.curPageIndex].sections[totalSections-1].phrases[totalPhrases-1].words[totalWords-1].top;
        var lastWordHeight = this.player.book.playerData[this.curPageIndex].sections[totalSections-1].phrases[totalPhrases-1].words[totalWords-1].height;
        var lastWordFromBottom = parseInt(this.bookHeight) - (parseInt(lastWordTop) + parseInt(lastWordHeight));

        if (parseInt(firstWordFromTop) < parseInt(lastWordFromBottom)) {
            //put image on bottom of page
            var textHeightPercent = (parseInt(lastWordTop) + parseInt(lastWordHeight)) / parseInt(this.bookHeight);
            var imageHeightPercent = 1 - textHeightPercent - .14;
            var scaledIFrameHeight = parseInt(bookSize.bookHeight) * imageHeightPercent;
            var scaledIFrameWidth = Math.floor(parseInt(bookSize.bookWidth) * .9);
            $j("#animationIframe").css({'position': 'absolute', 'top': '', 'bottom': '11.5%', 'left': '5%', 'height':scaledIFrameHeight, 'width':scaledIFrameWidth});
        } else {
            //put image on top of page
            var scaledHeight = ((this.player.book.playerData[this.curPageIndex].sections[0].phrases[0].words[0].top - 30) / this.player.book.playerData[this.curPageIndex].height);
            $j("#animationIframe").width(Math.floor(parseInt(bookSize.bookWidth) * .9));
            $j("#animationIframe").height(parseInt(bookSize.bookHeight) * scaledHeight);
            $j("#animationIframe").css({'position': 'absolute', 'top': '2%', 'bottom': '', 'left': '5%'});
            if (this.player.book.playerData[this.curPageIndex].height <
                this.player.book.playerData[this.curPageIndex].width) {
                $j("#animationIframe").css({'position': 'absolute', 'top': '4%', 'bottom': '', 'left': '5%'});
            }
        }
    }
}

Book.prototype.setControls = function() {
    if (IS_MOBILE) {
        this.setMobileSelectPage();
        $j("#lock-menu").remove();
    } else {
        this.setSelectPage();
    }

    this.attachAudioControls();
    var _this = this;

};

Book.prototype.attachAudioControls = function() {
    var _this = this;
    $j("#audio-play-pause").on("click", function() {
        if(_this.audioState === AudioState.pause || _this.audioState === AudioState.stop) {
            _this.playAudio();
        } else if (_this.audioState === AudioState.play) {
            _this.pauseAudio();
        }
    });
};

Book.prototype.playAudio = function() {
    var _this = this;
    _this.setAudioWhenAudioStateStopped();
    _this.setPlayForAnimationsAfterPaused();
    _this.setPlayNonAnimationsAfterPaused();
    _this.setAudioForAutoPlayPolicy();
    _this.audioState = AudioState.play;
    var animationIframeUrl = document.getElementById("animationIframe").src;
    if (animationIframeUrl.length > 0) {
        if (_this.autoPlayStart ||
            $j("#animationIframe").css('display') == "block" && $j("#audio-play-pause").hasClass('tool-play')) {
            document.getElementById("animationIframe").contentWindow.togglePlay();
        }
    }

    if(_this.player.timerBeforeSectionAudio != undefined && this.player.timerBeforeSectionAudio.remaining() > 0) {
        _this.player.timerBeforeSectionAudio.resume();
    }

    if (_this.player.backgroundAudio != undefined)
        _this.player.backgroundAudio.play().catch(function(e) {
        });
    _this.updatePlayPause($j("#audio-play-pause"), true);
};

Book.prototype.setAudioWhenAudioStateStopped = function () {
    var _this = this;
    if (_this.audioState === AudioState.stop) {
        _this.player.setAudio(false, $j("#audio-play-pause").hasClass('tool-pause'));
    }
};

Book.prototype.setPlayForAnimationsAfterPaused = function () {
    var _this = this;
    if (this.autoPlayStart && _this.htmlListenAnimationsActive &&
        (_this.player.timerBeforeSectionAudio != undefined && _this.player.timerBeforeSectionAudio.remaining() <= 0)) {
        if (!this.player.audioEnded) {
            $j("#book-player").trigger("play");
            _this.audioState = AudioState.play;
        }
        if (_this.player.sectionTimer != null) {
            _this.player.sectionTimer.start();
        }
    }
};

Book.prototype.setPlayNonAnimationsAfterPaused = function () {
    var _this = this;
    if (!_this.htmlListenAnimationsActive && _this.player.sectionTimer != undefined) {
        $j("#book-player").trigger("play");
        _this.player.sectionTimer.start();
    }
};

Book.prototype.setAudioForAutoPlayPolicy = function () {
    var _this = this;
    if (_this.htmlListenAnimationsActive && _this.audioState === AudioState.pause) {
        _this.updatePlayPause($j("#audio-play-pause"), true);
        _this.player.setAudio(_this.isBookStart, _this.autoPlayStart);
        if (!_this.autoPlayStart) {
            this.autoPlayStart = true;
        }
        $j("#book-player").trigger("play");
        if (_this.player.sectionTimer != null) {
            _this.player.sectionTimer.start();
        }
    }
};

Book.prototype.pauseAudio = function() {
    var _this = this;
    var isPlay = true;
    $j("#book-player").trigger("pause");
    if (_this.player.sectionTimer != null) {
        _this.player.sectionTimer.pause();
        isPlay = false;
    }

    _this.audioState = AudioState.pause;
    var animationIframeUrl = document.getElementById("animationIframe").src;
    if (animationIframeUrl.length > 0) {
        if ($j("#animationIframe").css('display') == "block" && $j("#audio-play-pause").hasClass('tool-pause')) {
            document.getElementById("animationIframe").contentWindow.togglePlay();
        }
    }

    if(_this.player.timerBeforeSectionAudio != null && this.player.timerBeforeSectionAudio.remaining() > 0) {
        _this.player.timerBeforeSectionAudio.pause();
    }

    if(_this.player.backgroundAudio != undefined) {
        _this.player.backgroundAudio.pause();
        var isPlay = false;
    }

    _this.updatePlayPause($j("#audio-play-pause"), isPlay);
};

Book.prototype.updatePlayPause = function(obj, isPlay) {
    if (isPlay) {
        obj.addClass("tool-pause").removeClass("tool-play");
        obj.find('span').removeClass("icon-play").addClass("icon-pause");
    } else {
        obj.removeClass("tool-pause").addClass("tool-play");
        obj.find('span').removeClass("icon-pause").addClass("icon-play");
    }
};

Book.prototype.setForwardBack = function() {
    var _this = this;
    $j('body').on('click','#forward-page',function() {
        if (!_this.playerLoaded || _this.curPageIndex == 0) {
            return;
        }
        if (!listenCompletion)
            _this.forwardPage();
    });

    $j('body').on('click','#back-page',function() {
        if (!_this.playerLoaded || _this.curPageIndex == 0) {
            return;
        }
        _this.backPage();
    });

    $j(document).keyup(function(e) {
        if (e.keyCode == 13 || e.keyCode == 33 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 102 || e.keyCode == 104 || e.keyCode == 105) { //next (right arrow, up arrow, page up)
            $j('#forward-page').trigger('click');
        }
        if (e.keyCode == 8 || e.keyCode == 34 || e.keyCode == 37 || e.keyCode == 40 || e.keyCode == 98 || e.keyCode == 99 || e.keyCode == 100) { //previous (left arrow. down arrow, page down)
            $j('#back-page').trigger('click');
        }
    });

    if (IS_MOBILE) {
        _this.attachMobilePageTurn();
    }
};

Book.prototype.setAudioCompleted = function (userTimerDelayBeforeNextPage, autoTurnPage) {
    var _this = this;
    if (_this.player.audioEnded)
        if (_this.curPage < _this.totalPages - 1) {
            if (userTimerDelayBeforeNextPage) {
                $j("#audio-play-pause").hide();
                _this.timerBeforeNextPageRequestWhenAudio = window.setTimeout(function () {
                    _this.goToPage(_this.curPageIndex += 1, false);
                }, AUDIO_WAIT_TIME);
            } else if (autoTurnPage) {
                _this.goToPage(_this.curPageIndex += 1, false);
            }
        } else if (isPreview && parseInt(_this.book.bookmark) > 0) {
        } else {
            _this.forwardPage();
        }
};

Book.prototype.attachMobilePageTurn = function() {
    var _this = this;
    window.addEventListener('load', function() {

        var touchsurface = document.getElementById('book-wrapper'),
            startX,
            startY,
            dist,
            threshold = 80, //required min distance traveled to be considered swipe
            allowedTime = 300, // maximum time allowed to travel that distance
            elapsedTime,
            startTime;

        function handleswipe(isrightswipe, isleftswipe) {
            if (!_this.playerLoaded) {
                return;
            }
            if (isrightswipe) {
                _this.backPage();
            }
            else if (isleftswipe) {
                _this.forwardPage();
            }
        }

        touchsurface.addEventListener('touchstart', function(e) {
            var touchobj = e.changedTouches[0];
            dist = 0;

            startX = touchobj.pageX;
            startY = touchobj.pageY;
            startTime = Date.now(); // record time when finger first makes contact with surface
            e.preventDefault();

        }, false);

        touchsurface.addEventListener('touchmove', function(e) {
            e.preventDefault(); // prevent scrolling when inside DIV
        }, false);

        touchsurface.addEventListener('touchend', function(e) {
            var touchobj = e.changedTouches[0];
            dist = touchobj.pageX - startX ;// get total dist traveled by finger while in contact with surface
            elapsedTime = Date.now() - startTime; // get time elapsed
            // check that elapsed time is within specified, horizontal dist traveled >= threshold, and vertical dist traveled <= 100
            var swiperightBol = (elapsedTime <= allowedTime && dist >= threshold && Math.abs(touchobj.pageY - startY) <= 100),
                swiperleftBol = (elapsedTime <= allowedTime && dist <= -1 * threshold && Math.abs(touchobj.pageY - startY) <= 100);
            handleswipe(swiperightBol, swiperleftBol);
            e.preventDefault();
        }, false);
    }, false);
};

Book.prototype.setSelectPage = function() {
    var _this = this;
    $j("#select-page").on("mouseenter", function(e) {
        var xpos = e.pageX;
        var htmlString = "";
        var widthPercent = 0;
        for (var i = 0; i < _this.totalPages; i++) {
            htmlString += "<div id='navigate_" + i +
                "' class='nav-button'>" + _this.playerData[i].page_number
                + "</div>";
            widthPercent += 3;
        }
        $j("#navigate-page").css({
            "left":xpos / 2,
            "width": widthPercent + "%"
        });
        $j("#navigate-page").html(htmlString);
        $j("#navigate-page").show();
        $j(".nav-button").on("click", function() {
            var pageNo = $j(this).attr("id").split("_")[1];
            _this.goToPage(pageNo);
        });

    });
    $j("#navigate-page").on("mouseleave", function() {
        $j(this).hide();
    });

};

Book.prototype.setMobileSelectPage = function() {
    var _this = this;
    $j("#select-page").on("touchstart", function(e) {
        var xpos = e.pageX;
        var htmlString = "";
        var widthPercent = 0;
        for (var i = 0; i < _this.totalPages; i++) {
            htmlString += "<div id='navigate_" + i +
                "' class='nav-button'>" + _this.playerData[i].page_number
                + "</div>";
            widthPercent += 3;
        }
        $j("#navigate-page").css({
            "left":xpos / 2,
            "width": widthPercent + "%"
        });
        $j("#navigate-page").html(htmlString);
        $j("#navigate-page").show();
        $j(".nav-button").on("click", function() {
            var pageNo = $j(this).attr("id").split("_")[1];
            _this.goToPage(pageNo);
        });

    });
    $j("#book-wrapper").on("touchstart", function() {
        $j("#navigate-page").hide();
    });

};

Book.prototype.goToPage = function(pageIndex, isBookStart) {
    var _this = this;
    _this.deferredAnimation = new $j.Deferred();
    this.isBookStart = false;
    this.updateCompletionStatus(pageIndex);
    this.curPage = parseInt(pageIndex);

    $j("#js-kidsLoader").width($j("#book-page").width());
    $j("#js-kidsLoader").height($j("#book-page").height());
    if ((_this.playerData[pageIndex] != undefined && _this.isImageCached(_this.playerData[pageIndex].page_image)) ||
        (_this.preloadedPageImages[pageIndex] != undefined && _this.preloadedPageImages[pageIndex] == 1)) {
        _this.hideFilterLoader();
    } else {
        _this.showFilterLoader();
    }

    _this.imageStrings = _this.preloadPages(pageIndex);
    if (_this.imageStrings.length > 0 && _this.htmlListenAnimationsActive &&
        (_this.curPageIndex + 1 < _this.totalPages)) {
        _this.bookPageLoadTimer =
            new _this.Timer(_this.revertToNonAnimatedBooks(), _this.playerData[0]['ANIMATED_LISTEN_MAX_SECONDS_TO_LOAD'] *
                1000);
        if (_this.playerData[pageIndex]["animation_content"] &&
            _this.playerData[pageIndex]["animation_content"]['url']) {
            _this.setAnimationSrc(_this.playerData[pageIndex]["animation_content"]['url']);
            _this.preloadedAnimatedImages[pageIndex] = 1;
        }
        if ((pageIndex + 1 != _this.totalPages) &&
            _this.playerData[pageIndex + 1]["animation_content"] &&
            _this.playerData[pageIndex + 1]["animation_content"]['url']) {
            _this.setAnimationNextSrc(this.playerData[pageIndex + 1]["animation_content"]['url']);
            _this.preloadedAnimatedImages[pageIndex + 1] = 1;
        }
        if (_this.preloadedAnimatedImages[pageIndex] == 0) {
            _this.deferredAnimation.resolve();
        }
    } else {
        _this.deferredAnimation.resolve();
    }

    $j.when(
        _this.deferredAnimation, preloadImages(_this.imageStrings)
    ).then(function () {
        _this.preloadedPageImages[pageIndex] = 1;
        _this.preloadedPageImages[pageIndex + 1] = 1;
        if (_this.bookPageLoadTimer != undefined) {
            if (_this.bookPageLoadTimer.getTimeLeft() > 0) {
                _this.bookPageLoadTimer.getTimeLeft();
            } else if (pageIndex != _this.totalPages) {
                _this.htmlListenAnimationsActive = false;
                _this.revertToNonAnimated = true;
            }
        }
        _this.hideFilterLoader();
        _this.drawPage(isBookStart, _this.displayPages.pages[pageIndex]);

        _this.foundListenContent =
            Player.prototype.hasListenData(_this.displayPages.pages[pageIndex], _this.playerData);
        if (_this.foundListenContent && (_this.audioState != AudioState.pause)) {
            _this.audioState = AudioState.play;
        }

        if (_this.foundListenContent) {
            $j("#audio-play-pause").show();
        } else {
            $j("#audio-play-pause").hide();
        }

        if ($j("#forward-page") && (pageIndex + 1 >= this.totalPages) && isPreview) {
            $j("#forward-page").hide();
        } else if ($j("#forward-page")) {
            $j("#forward-page").fadeTo(0, 1);
        }

        if (($j("#back-page") && (_this.curPage === 0)) || (isPreview && parseInt(_this.bookmark) > 0)) {
            $j("#back-page").fadeTo(0, 0).css("cursor", "default");
            $j("#back-page").attr("disabled", true);
        } else if ($j("#back-page")) {
            $j("#back-page").fadeTo(0, 1).css("cursor", "pointer");
            $j("#back-page").attr("disabled", false);
        }

        if (pageIndex + 1 >= _this.totalPages && !isPreview) {
            $j('#forward-page').addClass('pageArrowNext-done').text('Done');
        }

        if (_this.player) {
            if (isBookStart || pageIndex == 0) {
                _this.player.goToPage(pageIndex, true);
            } else {
                _this.player.goToPage(pageIndex, false);
            }
        }
    });
};

Book.prototype.findPageIndex = function(displayPages, curPage) {
    for (var i = 0; i <= displayPages.length; i++) {
        if (displayPages[i] == curPage) {
            return i;
        }
    }
};

Book.prototype.updateCompletionStatus = function(pageIndex) {
    if (this.completionStatus[pageIndex] === false) {
        this.completionStatus[pageIndex] = true;
        this.completedPages ++;

        this.completionPercentage = parseInt(
            this.completedPages / this.totalPages * 100);
    }
};

Book.prototype.forwardPage = function() {
    if (this.curPage != this.totalPages) {
        this.curPageIndex++;
    } else if (this.curPage == this.totalPages) {
        this.curPageIndex--;
    }

    var newPage = this.displayPages.pages[this.curPageIndex];

    if (this.curPageIndex-1 == this.totalPages) {
        $j('#forward-page').addClass('pageArrowNext-done').text('Done');
    }

    if (this.curPageIndex >= this.totalPages) {
        if(isPreview) {
            return false;
        } else if (this.readFromQuiz != '0') {
            window.location.replace("/main/Activity/id/" + $j('#quizResourceDeploymentId').val());
        } else if (!listenCompletion) {
            listenCompletion = true;
            var activityAddedAt = $j('#activityAddedAt').val();
            var recordNonQuizCompletionUrl = "/main/RecordStudentNonQuizActivityCompletion";
            $j.when(
                $j.ajax({
                    type: "POST",
                    url: recordNonQuizCompletionUrl,
                    data: {
                        "resource_deployment_id": $j('#listenResourceDeploymentId').val(),
                        "assignment_added_at": activityAddedAt,
                        "student-assignment-id": this.studentAssignmentId,
                        "revertToNonAnimated": this.revertToNonAnimated
                    }
                })
            ).done(function(responseText) {
                if (responseText) {
                    if (responseText.badgeNotifications) {
                        clg.commonUtils.setCookie("badgeNotifications", JSON.stringify(responseText.badgeNotifications), 1);
                    }
                    window.location.replace("/main/ActivityReward/id/" + $j('#listenResourceDeploymentId').val());
                } else {
                    window.location.replace("/main/StudentPortal");
                }
            });
        }
        return false;
    }
    if (this.playerData[newPage] != undefined)
        var section = this.playerData[newPage].sections;

    this.goToPage(this.curPageIndex);
};

Book.prototype.backPage = function() {
    if (this.curPageIndex < 0) {
        return;
    } else if (this.curPageIndex != 0) {
        this.curPageIndex--;
    }
    var newPage = this.displayPages.pages[this.curPageIndex];

    $j('#forward-page').removeClass('pageArrowNext-done').text('Next');
    if (this.curPageIndex+1 == this.totalPages) {
        $j('#forward-page').addClass('pageArrowNext-done').text('Done');
    }

    if (this.playerData[newPage] != undefined)
        var section = this.playerData[newPage].sections;

    this.goToPage(this.curPageIndex);
};

Book.prototype.setPageSelectButton = function() {
    $j("#control-inner").prepend("<div id='select-page' class='control-button'></div>");
};

Book.prototype.Timer = function (callback, delay) {
    var timerId, start, running, remaining = delay;

    this.start = function () {
        running = true;
        start = new Date();
        timerId = setTimeout(callback, remaining);
    };

    this.pause = function () {
        running = false;
        clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.getTimeLeft = function () {
        if (running) {
            this.pause();
            this.start();
        }
        return remaining;
    };

    this.getStateRunning = function () {
        return running;
    }

    this.start();
};


/*****************************************************************
 *
 * Player Class and functions
 *
 * @param {json} playerData
 * @param {Object} bookRef
 *      reference to the Book that owns this object
 ****************************************************************/
var Player = function(playerData, bookRef) {
    this.data = playerData;
    this.curPage = 0;
    this.book = bookRef;
    this.pageIterator = new Iterator(this.data);
    this.sectionIterator = null;
    this.phraseIterator = null;
    this.wordIterator = null;
    this.audioUrl = null;
    this.audioEnded = true;
    this.sectionTimer = null;
    this.timerBeforeSectionAudio = null;
    this.timerBeforeNextPageRequestWhenNoAudio = null;
    this.timerBeforeNextPageRequestWhenAudio = null;
    this.backgroundAudio = null;
    this.phraseHighlight = {};
    this.deferredBackgroundAudio = $j.Deferred();
    this.previousWord = null;
    var _this = this;
};

Player.prototype.goToPage = function(pageNo, isBookStart) {
    _this = this;
    this.curPage = pageNo;
    var pageIndex = pageNo;
    if (this.pageIterator.getKey() < pageIndex) {
        while(this.pageIterator.getKey() < pageIndex) {
            this.pageIterator.next();
        }
    } else if (this.pageIterator.getKey() > pageIndex) {
        while(this.pageIterator.getKey() > pageIndex) {
            this.pageIterator.previous();
        }
    }

    if (this.pageIterator.getValue() == undefined) {
        if (!isPreview) {
            _this.book.curPageIndex++;
            _this.book.forwardPage();
        }
    } else if (this.pageIterator.getValue()["sections"] != null && _this.book.foundListenContent) {
        this.endAudio(this.curPage);
        window.clearTimeout(this.timerBeforeNextPageRequestWhenNoAudio);
        window.clearTimeout(this.timerBeforeNextPageRequestWhenAudio);
        _this.resetIteratorsFromPage();
        if ($j("#audio-play-pause").hasClass("tool-play") && isBookStart) {
            this.setAudio(isBookStart, true);
        } else if ($j("#audio-play-pause").hasClass("tool-pause")) {
            this.setAudio(isBookStart, false);
        } else if (_this.book.htmlListenAnimationsActive && $j("#audio-play-pause").hasClass("tool-play")) {
            this.setAudio(isBookStart, true);
        }
        this.phraseHighlight = {};
    } else if (!_this.book.foundListenContent) {
        this.endAudio(this.curPage);
        window.clearTimeout(this.timerBeforeNextPageRequestWhenNoAudio);
        window.clearTimeout(this.timerBeforeNextPageRequestWhenAudio);
        this.timerBeforeNextPageRequestWhenNoAudio = window.setTimeout(function() { _this.goToBookNextPage(pageNo); }, AUDIO_WAIT_TIME);
    }
};

Player.prototype.goToBookNextPage = function(pageNo) {
    _this = this;
    _this.book.curPageIndex++;
    _this.book.goToPage(pageNo+1, false);
}

Player.prototype.hasListenData = function(pageNo, playerData) {
    for (var i in playerData) {
        if (playerData[i].page_number == pageNo) {
            if (playerData[i].sections != undefined) {
                return true;
            } else {
                return false;
            }
        }
    }
    return false;
};

Player.prototype.resetIteratorsFromPage = function() {
    this.sectionIterator = new Iterator(this.pageIterator.getValue()["sections"]);
    this.phraseIterator = new Iterator(this.sectionIterator.getValue()["phrases"]);
    this.wordIterator = new Iterator(this.phraseIterator.getValue()["words"]);
};

Player.prototype.setAudio = function(isBookStart, isPaused) {
    var _this = this;
    _this.deferredBackgroundAudio = $j.Deferred();
    var sectionAudioFile = this.sectionIterator.getValue().section_audio;
    if(_this.book.htmlListenAnimationsActive && _this.data[_this.book.curPageIndex]["animation_content"] != false) {
        var audioDelayBefore = 0;
        if (isBookStart) {
            if (isPaused) {
                this.book.audioState = AudioState.pause;
            } else {
                this.book.audioState = AudioState.play;
            }
        }
        if (_this.book.htmlListenAnimationsActive && _this.data[_this.book.curPageIndex]["animation_content"] != undefined) {
            audioDelayBefore = _this.data[_this.book.curPageIndex]["animation_content"]["audio_delay_before_speaking"];
            var audioDelayAfter = _this.data[_this.book.curPageIndex]["animation_content"]["audio_delay_after_speaking"];
            var contentDirectoryUrl = _this.data[_this.book.curPageIndex]["animation_content"]["url"];
            contentDirectoryUrl = contentDirectoryUrl.substring(contentDirectoryUrl.indexOf("animation") - 1);
            var topOfWordPosition = _this.data[_this.book.curPageIndex]["sections"][0]["phrases"][0]["words"][0]["top"];

            $j('#animationIframe').show();

            if (contentDirectoryUrl != undefined) {
                if (_this.backgroundAudio != null && !_this.backgroundAudio.paused) {
                    _this.backgroundAudio.pause();
                    _this.backgroundAudio.currentTime = 0;
                }
                if (_this.data[_this.book.curPageIndex]["animation_content"] != undefined &&
                    _this.data[_this.book.curPageIndex]["animation_content"] != false &&
                    ($j("#audio-play-pause").is(':visible') && !$j("#audio-play-pause").hasClass("tool-play"))) {
                    var audioUrl = Player.prototype.getBackgroundAudioFilePath(contentDirectoryUrl,
                        _this.data[_this.book.curPageIndex]["animation_content"]["content_directory"]);
                    _this.fetchBackgroundAudioAndPlay(audioUrl);
                }

                if (!isPaused) {
                    if(audioDelayBefore == 0) {
                        _this.playSectionAudio(isBookStart, sectionAudioFile);
                    } else {
                        _this.timerBeforeSectionAudio = new _this.Timer(function () {
                            _this.playSectionAudio(isBookStart, sectionAudioFile);
                        }, audioDelayBefore);
                    }
                } else {
                    new _this.Timer(function () {
                        if (isBookStart) {
                            document.getElementById("animationIframe").contentWindow.togglePlay();
                        }
                    }, audioDelayBefore);
                }
            }
        }
    } else {
        $j('#animationIframe').hide();
        if (!isPaused) {
            _this.timerBeforeSectionAudio = new this.Timer(function () {
                _this.playSectionAudio(isBookStart, sectionAudioFile);
            }, this.delayIfNoAnimationContent);
        }
    }
};

Player.prototype.fetchBackgroundAudioAndPlay = function (audioUrl) {
    var _this = this;
    _this.backgroundAudio = new Audio(audioUrl);
    const playBackground = _this.backgroundAudio.play();
    if (playBackground && (typeof Promise !== 'undefined') && (playBackground instanceof Promise)) {
        playBackground.then(function () {
            _this.backgroundAudio.onended = function (e) {
                _this.deferredBackgroundAudio.resolve(e);
            }
        }).catch(function (reason) {
            _this.deferredBackgroundAudio.resolve();
        });
    }
}

Player.prototype.endAudio = function(pageIndex) {
    var _this = this;
    _this.book.audioState = AudioState.stop;  //NON ANIMATED, THIS NEEDS TO BE PAUSE
    _this.audioEnded = true;
    $j("#book-player").trigger("pause");
    var audioPlayer = $j(".curTrack");
    if (_this.data[pageIndex].sections && _this.data[pageIndex].sections[0].section_audio) $j(".curTrack").attr('src',_this.data[pageIndex].sections[0].section_audio);
    if (_this.sectionTimer)
        _this.sectionTimer.destroy();
        _this.sectionTimer = undefined;
    if (_this.timerBeforeSectionAudio)
        _this.timerBeforeSectionAudio.pause();
    if (_this.backgroundAudio) {
        $j('#animationIframe').attr('src', $j('#animationIframe').attr('src'));
        $j('#animationIframe').hide();
        _this.backgroundAudio.pause();
    }
};

Player.prototype.Timer = function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };

    this.remaining = function() {
        return remaining;
    };

    this.resume();
};

Player.prototype.playSectionAudio = function (isBookStart, audioUrl) {
    this.audioUrl = audioUrl;
    if (!this.audioEnded) {
        $j("#book-player").trigger("pause");
    }
    $j(".curTrack").remove();
    $j(".highlighted").remove();

    this.audioEnded = false;
    $j("#book-player").html("<source class='curTrack' src='" + this.audioUrl + "'/>").load();
    if (this.sectionTimer) {
        this.sectionTimer.destroy();
    }

    this.safeStartAudio(isBookStart);
};

Player.prototype.getHeightOfIframe = function(topOfWordPosition) {
    return Math.floor((topOfWordPosition - 15) * 1);
};

Player.prototype.getBackgroundAudioFilePath = function(contentDirectoryUrl, contentDirectory) {
    newUri = contentDirectoryUrl.substring(0, contentDirectoryUrl.lastIndexOf('/'));
    path = newUri.substring(0, newUri.lastIndexOf('/'));
    return path + "/audio/" +contentDirectory+".mp3";
};

Player.prototype.safeStartAudio = function(isBookStart) {
    var _this = this;
    if (($j("#audio-play-pause").is(':visible') && $j("#audio-play-pause").hasClass("tool-pause")) || isBookStart) {
        this.book.audioState = AudioState.play;
        $j("#book-player").trigger("play");
    } else {
        if (_this.sectionTimer != undefined) {
            _this.sectionTimer.stop();
        }
        $j("#book-player").trigger("pause");
    }
};

Player.prototype.createTimingFunctions = function() {
    var _this = this;
    var funcs = {};
    var tempSection = this.sectionIterator.clone();
    var tempPhrase = new Iterator(tempSection.getValue()["phrases"]);
    var tempWord = new Iterator(tempPhrase.getValue()["words"]);
    while(1) {
        var phraseKey = tempPhrase.getKey();
        _this.constructPhraseHighlight(tempWord, phraseKey, tempSection.getKey());

        (function(key, value, next, prevWord, phraseKey, sectionKey, hasNextSection) {
            funcs[Math.round(value.cue_start_ms / 100)] = function() {
                _this.updateHighlight(key, phraseKey, sectionKey);
           };
            _this.highlightWord(value, key, phraseKey, sectionKey);
            if (!next) {
                var endTime = (parseInt(value.cue_end_ms) > parseInt(value.cue_start_ms)) ? parseInt(value.cue_end_ms) : parseInt(value.cue_start_ms) + AUDIO_WAIT_TIME / 2;
                _this.setAudioSync(funcs, endTime);
                funcs[Math.round(endTime / 100)] = function() {
                    if (hasNextSection) {
                        _this.sectionIterator.next();
                        _this.setAudio();
                    } else {
                        _this.sectionTimer.stop();
                        $j(".highlighted").remove();
                    }
                };
            }
        }(tempWord.getKey(),
            tempWord.getValue(),
            tempPhrase.hasNext() || tempWord.hasNext(),
            tempWord.hasPrevious(),
            phraseKey,
            tempSection.getKey(),
            tempSection.hasNext()));

        if (tempWord.hasNext()) {
            tempWord.next();
        } else if (tempPhrase.hasNext()) {
            tempPhrase.next();
            tempWord = new Iterator(tempPhrase.getValue()["words"]);
        } else {
            break;
        }
    }
    this.highlightPhrase();
    return funcs;
};

Player.prototype.setAudioSync = function(funcs, endTime) {
    var _this = this;
    var previousCounter = 0;
    for (var i = 0; i * 100 < endTime; i += 10) {
        if (!funcs[i]) {
            funcs[i] = function() {
                if (parseInt($j("#book-player").prop("currentTime") * 10) == previousCounter) {
                    return;
                }
                previousCounter = parseInt($j("#book-player").prop("currentTime") * 10);
                _this.sectionTimer.setCounter(parseInt($j("#book-player").prop("currentTime") * 10));
            };
        }
    }
};

Player.prototype.updateHighlight = function (key, phraseKey, sectionKey) {
    var firstWord = $j("#word-highlight-" + "0" + "-" + phraseKey + "-" + sectionKey);
    if (firstWord.length > 0 && firstWord.css("z-index") < 0) {
        this.setupPhrase(phraseKey, sectionKey);
    }
    if (this.previousWord != null && this.previousWord.length > 0) {
        this.previousWord.removeClass('highlighted-word');
        this.previousWord.addClass('highlighted-phrase');
        this.previousWord = null;
    }
    var thisWord = $j("#word-highlight-" + key + "-" + phraseKey + "-" + sectionKey);
    if (thisWord.length > 0) {
        this.previousWord = thisWord;
        thisWord.removeClass('highlighted-phrase');
        thisWord.addClass('highlighted-word');
    }
};

Player.prototype.setupPhrase = function (phraseKey, sectionKey) {
    $j(".highlighted-word").css("z-index", "-10");
    $j(".highlighted-phrase").css("z-index", "-10");
    var padding = 0;
    var firstWord = $j("#word-highlight-" + "0" + "-" + phraseKey + "-" + sectionKey);
    var secondWord = $j("#word-highlight-" + "1" + "-" + phraseKey + "-" + sectionKey);
    if (firstWord.length > 0 && secondWord.length > 0 && parseFloat(secondWord.css('top')) != parseFloat(firstWord.css('top'))) {
        // The second word is on a new line, use the second and third word instead
        firstWord = secondWord;
        secondWord = $j("#word-highlight-" + "2" + "-" + phraseKey + "-" + sectionKey);
    }
    if (firstWord.length > 0 && secondWord.length > 0 && parseFloat(secondWord.css('top')) == parseFloat(firstWord.css('top'))) {
        padding = (parseFloat(secondWord.css('left')) - (parseFloat(firstWord.css('left')) + parseFloat(firstWord.css('width')))) / 2;
        padding = Math.round(padding * 10000) / 10000;
    }
    padding = Math.max(padding,0);
    var wordKey = 0;
    var wordObject = $j("#word-highlight-" + wordKey + "-" + phraseKey + "-" + sectionKey);
    while (wordObject.length > 0) {
        var width = parseFloat(wordObject.css('width')) + padding + padding;
        var left = parseFloat(wordObject.css('left')) - padding;
        var previousWord = $j("#word-highlight-" + (wordKey - 1) + "-" + phraseKey + "-" + sectionKey);
        if (previousWord.length > 0 && parseFloat(previousWord.css('top')) == parseFloat(wordObject.css('top'))) {
            // this resolves any overlap or gaps.
            var newLeft = parseFloat(previousWord.css('left')) + parseFloat(previousWord.css('width'));
            var diff = newLeft - left;
            left += diff;
            width -= diff;
        }
        width = (Math.round(width * 10000) / 10000) + 'px';
        left = (Math.round(left * 10000) / 10000) + 'px';
        wordObject.removeClass('highlighted-word');
        wordObject.addClass('highlighted-phrase');
        wordObject.css({"z-index": "10", "width" : width, "left":left});
        wordKey++;
        wordObject = $j("#word-highlight-" + wordKey + "-" + phraseKey + "-" + sectionKey);
    }
};

Player.prototype.highlightWord = function(word, key, phraseKey, sectionKey) {
    var _this = this;
    var newDivId = "word-highlight-" + key + "-" + phraseKey + "-" + sectionKey;

    $j(".page-outline").append("<div id='" + newDivId + "' class='highlighted highlighted-word'></div>");
    $j("#" + newDivId).css({
        "height": (word.height / _this.book.bookHeight) * 100 + "%",
        "width": (word.width / _this.book.bookWidth) * 100 + "%",
        "left": (word.left / _this.book.bookWidth) * 100 + "%",
        "top": (word.top / _this.book.bookHeight) * 100 + "%"
    });
};

Player.prototype.constructPhraseHighlight = function(word, phraseKey, sectionKey) {
    var obj = this.phraseHighlight;
    var wordVal = word.getValue();
    var curLine = wordVal["line"];
    var outerKey = sectionKey + "-" + phraseKey;
    if (!obj[outerKey]) {
        obj[outerKey] = {};
    }
    var phrase = obj[outerKey];
    if (!(curLine in obj[outerKey])) {
        phrase[curLine] = {};
        phrase[curLine].startPos = parseInt(wordVal.left);
        phrase[curLine].height = parseInt(wordVal.height);
        phrase[curLine].top = parseInt(wordVal.top);
    }
    phrase[curLine].endPos = parseInt(wordVal.left) + (parseInt(wordVal.width));
    phrase[curLine].height = Math.max(parseInt(wordVal.height), phrase[curLine].height);
};

Player.prototype.highlightPhrase = function() {
    var _this = this;
    for (var phrases in this.phraseHighlight) {
        var tempPhrases = this.phraseHighlight[phrases];
        for (var phrase in tempPhrases) {
            var info = tempPhrases[phrase];
            var newDivId = "phrase-" + phrases + "-" + phrase;
            var htmlString = "<div id='" + newDivId +
                "' class = 'highlighted highlighted-phrase phrase-highlight-" +
                phrases + "'></div>";
            $j(".page-outline").append(htmlString);
            $j("#" + newDivId).css({
                "height": (info.height / _this.book.bookHeight) * 100 + "%",
                "width": ((info.endPos - info.startPos) / _this.book.bookWidth) * 100 + "%",
                "left": (info.startPos / _this.book.bookWidth) * 100 + "%",
                "top": (info.top / _this.book.bookHeight) * 100 + "%"
            });
        }
    }
};
