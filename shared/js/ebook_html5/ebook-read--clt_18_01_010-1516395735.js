/*****************************************************************
 *
 * Book class and functions
 *
 * @param {int} completedPages
 * @param {json} playerData
 ****************************************************************/
var Book = function(completedPages, ReadFromQuiz, readWithinQuizActivity, hasListenContent, imageData, playerData, noteData, isStartedWithPlayer, bookId, activityId, highlightData, toolbarStatus, isTimedRead, studentAssignmentId){
    this.ReadFromQuiz = ReadFromQuiz;
    this.hasListenContent = hasListenContent;
	this.readWithinQuizActivity = readWithinQuizActivity;
    this.activityId = activityId;
    this.bookId = bookId;
    this.language_id = playerData.language_id;
    this.imageData = imageData;
    this.bookWidth = playerData.book_image_options.large.width;
    naturalPageWidth = this.bookWidth;
    this.bookHeight = playerData.book_image_options.large.height;
    this.playerData = playerData.listenContent;
    if (isPreview)
        this.readCompleted = false;
    else
        this.readCompleted = playerData.delivery.read.completion_status;
    this.bookDrawing;
    this.player = null;
    this.note = null;
    this.wordJournal = null;
    this.reflectionsJournal = null;
    this.highlighter = null;
    this.toolBar = null;
    this.player = new Player(imageData, this);
    this.totalPages = imageData.length;
    this.completedPages = parseInt(completedPages);
    this.bookmarkedPage = this.completedPages;
    this.recordingActive = false;
    this.isTimedRead = isTimedRead;
    this.startTime=Date.now(); this.totalTime=0;
    this.timeInTab=0, this.timeInJournal=0, this.timeInDrawing=0, this.timeInNotes=0;
    this.startTimeInTab=null, this.startTimeInJournal=null, this.startTimeInDrawing=null, this.startTimeInNotes=null;
    this.isStartTimeInDrawing = false, this.isStartTimeInJournal = false, this.isStartTimeInNote = false, this.isStartTimeInTab = false;

    this.bookDrawing = new Drawing(this);
    this.wordJournalNumberOfPages = null;
    this.wordJournal = new WordJournal(this);
    this.reflectionsJournal = new ReflectionsJournal();
    $j( "#journalEdit" ).tabs();
    this.toolBar = new Toolbar(this, toolbarStatus);
    this.isComplete = (this.completedPages === this.totalPages);
    $j("#back-page").fadeTo(0, 0).css("cursor", "default");
    this.completionStatus = this.startCompletionStatus();
    this.completePercent = parseInt(100 * this.completedPages / this.totalPages);
    this.menuLocked = false;
    this.displayPages = {};
    this.displayPages.numPages = this.getNumDisplayPages();
    this.displayPages.pages = this.getPageArray();
    this.preloadedPageImages = [];
    for (i = 0; i < this.totalPages; i++) {
        this.preloadedPageImages[i] = 0;
    }

    this.curPage = (this.completedPages == 0) ? this.displayPages.pages[this.completedPages] : this.completedPages;
    this.curPageIndex = Book.prototype.findPageIndex(this.displayPages.pages, this.curPage);

    this.listenBookPageId = Book.prototype.findListenBookPageId(this.curPage, this.playerData);

    if (noteData) {
    	this.note = new Note(noteData, this);
    }

    this.noteService = "EBookService";
    if(isPreview) {
        this.noteService = "PreviewNoteService";
    }

    this.highlightData = highlightData;

    $j("#js-kidsLoader").width(this.bookWidth);
    $j("#js-kidsLoader").height(this.bookHeight);

    if (studentAssignmentId != "false" && studentAssignmentId != null) {
        this.studentAssignmentId = studentAssignmentId;
    }

    var endIndex = (this.curPageIndex >= this.totalPages - 1 || this.curPageIndex == this.totalPages) ?
        this.totalPages : this.curPageIndex + 2;
    this.imageStrings = this.preloadPages(this.curPageIndex, endIndex);
    if (this.isImageCached(this.imageData[this.curPageIndex].page_image) ||
        this.preloadedPageImages[this.curPageIndex] == 1) {
        this.hideFilterLoader();
    }

    var _this = this;
    _this.attachResizeHandler();

    $j.when(
        preloadImages(_this.imageStrings)
    ).then(function () {
        _this.hideFilterLoader();
        _this.updateCompletionStatus(1);
        _this.attachTimers();
        _this.setPageSelectButton();
        _this.setControls();
        _this.goToPage(_this.curPageIndex, true);
        _this.playerLoaded = true;
        _this.setForwardBack();
    }, function (reason) {
        console.log(reason);
    });

    $j(window).on('beforeunload', function() {
        if (!readCompletion) {
            if ((_this.ReadFromQuiz == '0')) {
                recordBookmark(_this.activityId, _this.displayPages.pages[_this.curPageIndex],
                    _this.revertToNonAnimated);
            }

            if (!isPreview) {
                window.clg.audio.recorder.doneReading(readCompletion);
            }
        }
    });
};

Book.prototype.findPageIndex = function(displayPages, curPage){
	for (var i = 0; i <= displayPages.length; i++){
        if (displayPages[i] == curPage) {
        	return i;
        }
    }
};

Book.prototype.startCompletionStatus = function(){
    var retArray = [];
    for (var i = 1; i <= this.totalPages; i++){
        retArray[i] = (i <= this.completedPages);
    }
    return retArray;
};

Book.prototype.isImageCached = function (src) {
    var image = new Image();
    image.src = src;
    return image.complete;
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

Book.prototype.preloadPages = function (currentPageIndex, endIndex) {
    var imageStrings = [];
    for (var i = currentPageIndex; i < endIndex; i++) {
        var str = this.imageData[i].page_image;
        imageStrings.push(str);
    }

    $j(window).on('ready', function () {
        $j('forward-page').attr('disabled', 'false');
    });
    return imageStrings;
};

Book.prototype.drawPage = function(isBookStart, currentPage){		
	var _this = this;
    this.displayPages.pages = this.getPageArray();  
    
    if (currentPage != undefined) {
    	var htmlString = this.getPageHtmlString();
   		$j("#book-page-img").html(htmlString);   
   	} 
   
    $j("#theImage").on("load", function(){
        _this.resizePage(isBookStart);
        if (!_this.recordingActive) {
            $j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note,#journal").removeAttr('disabled');
            $j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note,#journal").removeClass('disabled');
        }
        _this.bookDrawing.getBookDrawing();
        if (!clg.swfRecording.isRecordingSwfActive()) {
            Toolbar.prototype.enableDrawingAndNoteTools();
        }

        if(isPreview) {
            $j("#recorder").attr('disabled', true);
            $j("#recorder").addClass('disabled');
        }
    });
    
};

Book.prototype.getPageHtmlString = function(){
    var htmlString = "";
    var imgSrc = this.imageData[this.curPageIndex].page_image;  
    htmlString += "<div class='book-page'" + 
        " id='page-" + this.imageData[this.curPageIndex].page_number + "'><img " +
        "id='theImage' class='theImage' draggable='false' src='" + imgSrc + "'/><div id='canvas'></div><div id='editor'></div></div>";
    return htmlString;
};

Book.prototype.resizePage = function(isBookStart){
    var book = $j("#book-page");
    var header = $j(".ebookHeader");
    var bookRatio = this.bookHeight / this.bookWidth;
    var bookNavWidth = 140;
    var bookHeaderHeight = $j(".ebookHeader").outerHeight();
    var padding = 20;
	var windowHeight = $j(window).height();
    var windowWidth = $j(window).width();
    var bookSize = new Array();

    bookSize = pageResizer(header, book, padding, bookRatio, bookHeaderHeight, bookNavWidth, windowWidth, windowHeight, 0);

    // don't show the header or book until resizing is complete
    $j(header).show();
    $j(book).show();

    if(isPreview) {
        var pageImage = $j("#theImage");
        var offset = parseInt($j("#book-page").css("marginTop"));
        offset *= offset < 0 ? -1 : 1;
        $j("#canvas").attr("style", "position: relative; top:" + offset + "px; " + "height: " + pageImage.height() + "px;")
    }
    
    newPageWidth = bookSize['bookWidth'];
    $j( "svg" ).remove();
    this.drawPage(false);

    if (isBookStart == true) {
        var sizeRatio = this.bookWidth/newPageWidth;
        if (this.note != undefined && this.note != null) {
            for (var i in this.note.notes.bookNotes) {
                if (this.note.notes.bookNotes[i].page_number != undefined) {
                    if (this.note.notes.bookNotes[i].page_number == this.curPage+1) {
                        Note.prototype.setNoteLocation(this.bookWidth, Number(this.note.notes.bookNotes[i].note_location_x), Number(this.note.notes.bookNotes[i].note_location_y));
                        break;
                    }
                }
            }
        }
    }
	
	// only for 'read'
	if (this.highlighter && (this.hasListenContent || this.listenBookPageId > 0)) {
		this.highlighter.resize(book.attr('style'));
	}
};

Book.prototype.getNumDisplayPages = function(){
    return 1;
};

Book.prototype.getPageArray = function(){
    var retArray = [];
    for (var i = 0; i < this.imageData.length; i++){
        retArray.push(this.imageData[i].page_number);
        if (i === this.totalPages){
            break;
        }
    }    
    return retArray;
};

Book.prototype.attachResizeHandler = function(){
    var self = this;
    $j(window).on('resize', _.debounce(function () {
        self.resizePage(true);
    }, 200))
};

Book.prototype.attachTimers = function(){
    var _this = this;
    if (_this.isTimedRead && _this.readCompleted == "false") {
        $j('#journal').bind("click", function(e) {
            if($j('#journalEdit').css('display') == 'block' || e.target.id == 'journal'){
                _this.isStartTimeInJournal = true;
                if (_this.isStartTimeInNote) {
                    _this.timeInNotes += (Date.now() - _this.startTimeInNote);
                    _this.isStartTimeInNote = false;
                }
                if (_this.isStartTimeInTab) {
                    _this.timeInTab += (Date.now() - _this.startTimeInTab);
                    _this.isStartTimeInTab = false;
                }
                if (_this.isStartTimeInDrawing) {
                    _this.timeInDrawing += (Date.now() - _this.startTimeInDrawing);
                    _this.isStartTimeInDrawing = false;
                }
                _this.startTimeInJournal = Date.now();
            } else if (!$j('#journal').hasClass('is-active')) {
                _this.isStartTimeInJournal = false;
                _this.timeInJournal += (Date.now() - _this.startTimeInJournal);
            }
        });
        $j('#add-note').bind("click", function(e) {
            if($j('#add-note').hasClass('is-active')){
                _this.isStartTimeInNote = true;
                if (_this.isStartTimeInJournal) {
                    _this.timeInJournal += (Date.now() - _this.startTimeInJournal);
                    _this.isStartTimeInJournal = false;
                }
                if (_this.isStartTimeInTab) {
                    _this.timeInTab += (Date.now() - _this.startTimeInTab);
                    _this.isStartTimeInTab = false;
                }
                if (_this.isStartTimeInDrawing) {
                    _this.timeInDrawing += (Date.now() - _this.startTimeInDrawing);
                    _this.isStartTimeInDrawing = false;
                }
                _this.startTimeInNote = Date.now();
            } else {
                _this.isStartTimeInNote = false;
                _this.timeInNotes += (Date.now() - _this.startTimeInNote);
            }
        });
        $j("#pen, #highlighter, #stamp, #undo").click(function(e) {
            if ($j(this).hasClass('is-active')) {
                _this.isStartTimeInDrawing = true;
                if (_this.isStartTimeInJournal) {
                    _this.timeInJournal += (Date.now() - _this.startTimeInJournal);
                    _this.isStartTimeInJournal = false;
                }
                if (_this.isStartTimeInTab) {
                    _this.timeInTab += (Date.now() - _this.startTimeInTab);
                    _this.isStartTimeInTab = false;
                }
                if (_this.isStartTimeInNote) {
                    _this.timeInNotes += (Date.now() - _this.startTimeInNote);
                    _this.isStartTimeInNote = false;
                }
                _this.startTimeInDrawing = Date.now();
            } else {
                _this.isStartTimeInDrawing = false;
                _this.timeInDrawing += (Date.now() - _this.startTimeInDrawing);
            }
        });
        $j(window).on("blur focus", function(e) {
            var prevType = $j(this).data("prevType");

            if (prevType != e.type) {
                switch (e.type) {
                    case "blur":
                        if (!$j('#add-note').hasClass('is-active') && !$j('#journal').hasClass('is-active') && !$j('#pen').hasClass('is-active') && !$j('#highlighter').hasClass('is-active') && !$j('#stamp').hasClass('is-active')) {
                            _this.isStartTimeInTab = true;
                            if (_this.isStartTimeInNote) {
                                _this.timeInNotes += (Date.now() - _this.startTimeInNote);
                                _this.isStartTimeInNote = false;
                            }
                            if (_this.isStartTimeInJournal) {
                                _this.timeInJournal += (Date.now() - _this.startTimeInJournal);
                                _this.isStartTimeInJournal = false;
                            }
                            if (_this.isStartTimeInDrawing) {
                                _this.timeInDrawing += (Date.now() - _this.startTimeInDrawing);
                                _this.isStartTimeInDrawing = false;
                            }
                            _this.startTimeInTab = Date.now();
                        }
                        break;
                    case "focus":
                        if (!$j('#add-note').hasClass('is-active') && !$j('#journal').hasClass('is-active') && !$j('#pen').hasClass('is-active') && !$j('#highlighter').hasClass('is-active') && !$j('#stamp').hasClass('is-active')) {
                            _this.isStartTimeInTab = false;
                            if (_this.startTimeInTab != null) _this.timeInTab += (Date.now() - _this.startTimeInTab);
                        }
                        break;
                }
            }

            $j(this).data("prevType", e.type);
        });
    }
};

Book.prototype.setControls = function(){
    if (IS_MOBILE){
        this.setMobileShowControls();
        this.setMobileSelectPage();
        $j("#lock-menu").remove();
    } else {
        this.setShowControls();
        this.setSelectPage();
    }
    
    this.setMenuLock();
    var _this = this;
    
};

Book.prototype.setForwardBack = function() {
    var _this = this;
    if (_this.totalPages == 1 || ((_this.displayPages.pages[_this.curPageIndex]+1 == _this.totalPages) && _this.displayPages.pages[0] == 0) || (_this.displayPages.pages[_this.curPageIndex] == _this.totalPages)) {
        $j('#forward-page').text('Done');
    }
    
    $j('body').on('click','#forward-page',function() {
        if (!_this.playerLoaded){
            return;
        }
        if ($j("#noteEdit").css('display') == 'block') {
        	_this.saveNote(false); 
        }
        if (!readCompletion)
        	_this.forwardPage();
    });
    
    $j('body').on('click','#back-page', function() {
        if (!_this.playerLoaded){
            return;
        }
        if ($j("#noteEdit").css('display') == 'block') {
        	_this.saveNote(false);
        } 
        _this.backPage();
    });

    $j(document).keyup(function(e) {
        if ($j('#add-note').hasClass('is-active') || $j('#journal').hasClass('is-active')) {
            return;
        }
        if (e.keyCode == 13 || e.keyCode == 33 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 102 || e.keyCode == 104 || e.keyCode == 105) { //next (right arrow, up arrow, page up)
            $j('#forward-page').trigger('click');
        }
        if (e.keyCode == 8 || e.keyCode == 34 || e.keyCode == 37 || e.keyCode == 40 || e.keyCode == 98 || e.keyCode == 99 || e.keyCode == 100) { //previous (left arrow. down arrow, page down)
            $j('#back-page').trigger('click');
        }
    });
    
    if (IS_MOBILE){
         _this.attachMobilePageTurn();
    }
};

Book.prototype.attachMobilePageTurn = function(){
    var _this = this;
    window.addEventListener('load', function(){
 
 var touchsurface = document.getElementById('book-wrapper'),
    startX,
    startY,
    dist,
    threshold = 80, //required min distance traveled to be considered swipe
    allowedTime = 300, // maximum time allowed to travel that distance
    elapsedTime,
    startTime;
 
        function handleswipe(isrightswipe, isleftswipe) {
             if (!_this.playerLoaded){
                return;
            }
            if (isrightswipe){
                _this.backPage();
            }
            else if (isleftswipe) {
                _this.forwardPage();
            }
        }

        touchsurface.addEventListener('touchstart', function(e) {
            //touchsurface.innerHTML = '';
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

Book.prototype.setShowControls = function(){
    var _this = this;
    $j("#menu-up").on("mouseenter", function(){
        $j(this).hide();
        $j("#control-menu").slideToggle(400, function(){
            $j("#book-wrapper").on("click", function(){
                if (!_this.menuLocked){
                    $j("#control-menu").toggle();
                }
            });
        });
    });
};

Book.prototype.setMobileShowControls = function(){
    var _this = this;
    $j("#menu-up").on("touchstart", function(){
        $j(this).hide();
        window.setTimeout(function(){
            $j("#control-menu").slideToggle(400, function(){
                $j("#book-wrapper").one("touchstart", function(){
                    if (!_this.menuLocked){
                        $j("#control-menu").slideUp();
                        window.setTimeout(function(){
                            $j("#menu-up").show();
                        }, 400);
                        $j("#navigate-page").hide();
                    }
                });
            });
        }, 200);
    });
};

Book.prototype.setMenuLock = function(){
    var _this = this;
    $j("#lock-menu").on("click", function(){
        _this.menuLocked = !_this.menuLocked;
        $j(this).toggleClass("is-locked is-unlocked");
        if (!_this.menuLocked){
            $j("#menu-wrapper").one("mouseleave", function(){
                if (!_this.menuLocked){
                    $j("#control-menu").slideUp();
                    window.setTimeout(function(){
                        $j("#menu-up").show();
                    }, 400);
                }
            });
        }
    });
};

Book.prototype.setSelectPage = function(){
    var _this = this;
    $j("#pages").on("click", function(e){
        var xpos = e.pageX;
        var htmlString = "";
        var widthPercent = 0;
        
        $j("#navigate-page").toggle(); 
        
        for (var i = 0; i < _this.totalPages; i++){
            htmlString += "<li id='navigate_" + i +
                    "' class='nav-button'>" 
                    + "<img src='/shared/images/ebook_html5/ebookInactivePage.png'/>"
                    + "</li>";
            widthPercent += 3;
        }
        $j("#navigate-page").css({
            "width": widthPercent + "%"
        });
        
        $j("#navigate-page").html(htmlString);
        
        $j(".nav-button").on("click", function(){
            var pageIndex = $j(this).attr("id").split("_")[1];
            var totalPages = $j('#paging ul li').length;
            for (var i = 0; i < totalPages; i++){
                if (pageIndex != i) {
                    $j("#navigate_"+i).removeClass('active');
                }
            }
            $j(this).addClass('active');
            _this.goToPage(pageIndex);
        });
    });

};

Book.prototype.setMobileSelectPage = function(){
    var _this = this;
    $j("#select-page").on("touchstart", function(e){
        var xpos = e.pageX;
        var htmlString = "";
        var widthPercent = 0;
        for (var i = 0; i < _this.totalPages; i++){
            htmlString += "<div id='navigate_" + i +
                    "' class='nav-button'>" + _this.playerData[i].book_page_id
                    + "</div>";
            widthPercent += 3;
        }
        $j("#navigate-page").css({
            "left":xpos / 2,
            "width": widthPercent + "%"
        });
        $j("#navigate-page").html(htmlString);
        $j(".nav-button").on("click", function(){
            var pageIndex = $j(this).attr("id").split("_")[1];
            _this.goToPage(pageIndex);
        });

    });
    $j("#book-wrapper").on("touchstart", function(){
        $j("#navigate-page").hide();
    });

};

Book.prototype.goToPage = function(pageIndex, isBookStart){
	var listenBookPage = this.displayPages.pages[pageIndex];
    var _this = this;
    this.updateCompletionStatus(pageIndex);
    this.curPage = parseInt(pageIndex);
    this.listenBookPageId = Book.prototype.findListenBookPageId(_this.displayPages.pages[pageIndex], _this.playerData);

    $j("#js-kidsLoader").width($j("#book-page").width());
    $j("#js-kidsLoader").height($j("#book-page").height());
    if ((_this.imageData[pageIndex] != undefined && _this.isImageCached(_this.imageData[pageIndex].page_image)) ||
        (_this.preloadedPageImages[pageIndex] != undefined && _this.preloadedPageImages[pageIndex] == 1)) {
        _this.hideFilterLoader();
    } else {
        _this.showFilterLoader();
    }

    _this.resetTimers();

    var endIndex = (pageIndex >= this.totalPages - 1 || pageIndex == this.totalPages) ?
        this.totalPages : pageIndex + 2;
    _this.imageStrings = _this.preloadPages(pageIndex + 1, endIndex);

    $j.when(
        preloadImages(_this.imageStrings)
    ).then(function () {
        _this.drawPage(isBookStart, _this.displayPages.pages[pageIndex]);
        if (isBookStart) {
            _this.highlighter = new Highlighter(_this, _this.highlightData, _this.displayPages);
        }
        _this.highlighter.newPage();

        if ($j("#forward-page") && (_this.curPage === _this.totalPages - 1) && isPreview) {
            $j("#forward-page").hide();
        } else if ($j("#forward-page")) {
            $j("#forward-page").fadeTo(0, 1);
        }
        if ($j("#back-page") && _this.curPage === 0) {
            $j("#back-page").fadeTo(0, 0).css("cursor", "default");
        } else if ($j("#back-page")) {
            $j("#back-page").fadeTo(0, 1).css("cursor", "pointer");
        }

        if (_this.player && pageIndex >= 0) {
            $j('#note_id').val('');
            if (_this.listenBookPageId > 0) {
                $j("#currentBookPageId").val(_this.listenBookPageId);
            }
            if (_this.note) {
                Note.prototype.showDraggableNote(_this.note.notes, _this.displayPages.pages[pageIndex],
                    _this.note.book);
            } else {
                $j('#noteImg').css('display', 'none');
            }

            if (isBookStart) {
                window.setTimeout(function () {
                    _this.player.goToPage(pageIndex, isBookStart, _this.listenBookPageId);
                }, 1000);
            } else {
                _this.player.goToPage(pageIndex, false, _this.listenBookPageId);
            }
        }
    });
};

Book.prototype.resetTimers = function() {
    var _this = this;
    if (_this.isStartTimeInDrawing) {
        _this.timeInDrawing += (Date.now() - _this.startTimeInDrawing);
        _this.isStartTimeInDrawing = false;
    }
    if (_this.isStartTimeInNote) {
        this.timeInNotes += (Date.now() - _this.startTimeInNote);
        _this.isStartTimeInNote = false;
    }
    if (_this.isStartTimeInJournal) {
        _this.timeInJournal += (Date.now() - _this.startTimeInJournal);
        _this.isStartTimeInJournal = false;
    }
    if (_this.isStartTimeInTab) {
        _this.timeInTab += (Date.now() - _this.startTimeInTab);
        _this.isStartTimeInTab = false;
    }
};

Book.prototype.findListenBookPageId = function(currentPage, listenData){
	if (listenData) {
		for (var i = 0; i < listenData.length; i++){
	        if ((listenData[i].page_number == currentPage) && listenData[i].book_page_id){
	            return listenData[i].book_page_id;
	        }
	    }
	}
	return 0;
};

Book.prototype.findListenBookPageIndex = function(currentPage, listenData){
	if (listenData) {
		for (var i = 0; i < listenData.length; i++){
	        if ((listenData[i].page_number == currentPage)){
	            return i+1;
	        }
	    }
	}
	return 0;
};

Book.prototype.updateCompletionStatus = function(pageIndex){
    if (this.completionStatus[pageIndex] === false){
        this.completionStatus[pageIndex] = true;
        this.completedPages ++;

        this.completionPercentage = parseInt(
                this.completedPages / this.totalPages * 100);
    }
};

Book.prototype.forwardPage = function(){
	if (this.curPage != this.totalPages) {
		this.curPageIndex++;
	} else if (this.curPage == this.totalPages) {
		this.curPageIndex--;
	}

    var newPage = this.displayPages.pages[this.curPageIndex];
    if (this.displayPages.pages[this.curPageIndex] == this.totalPages && this.ReadFromQuiz != '0'){
    	$j('#forward-page').addClass('pageArrowForward-done').text('Quiz');
    } else if (this.displayPages.pages[this.curPageIndex] == this.totalPages || (this.displayPages.pages[this.curPageIndex] == this.totalPages-1 && this.displayPages.pages[this.totalPages-1] == this.totalPages-1)) {
    	$j('#forward-page').addClass('pageArrowForward-done').text('Done');
    }

    if (this.curPageIndex >= this.totalPages){
    	if (this.ReadFromQuiz != '0') {
    		var locationRedirect = '/main/Activity/id/'+this.ReadFromQuiz;
    		if (this.readWithinQuizActivity != '0')
    			locationRedirect += '/fromResults/'+this.readWithinQuizActivity;
    		window.location.replace(locationRedirect);
    		return false;
    	} else if(isPreview) {
			window.location.replace("/main/ActivityPreview/id/" + $j('#readResourceDeploymentId').val());
		} else if (!readCompletion) {
    		readCompletion = true;
	        var activityAddedAt = $j('#activityAddedAt').val();
            this.totalTime += (Date.now() - this.startTime);
            this.totalTime -= this.timeInDrawing;
            this.totalTime -= this.timeInNotes;
            this.totalTime -= this.timeInJournal;
            this.totalTime -= this.timeInTab;
            var recordNonQuizCompletionUrl = "/main/RecordStudentNonQuizActivityCompletion";

            $j.when(
                window.clg.audio.recorder.doneReading(true),
                $j.ajax({
                    type: "POST",
                    url: recordNonQuizCompletionUrl,
                    data: {
                        "resource_deployment_id": $j('#readResourceDeploymentId').val(),
                        "assignment_added_at": activityAddedAt,
                        "duration": this.totalTime,
                        "pages": (this.totalPages - this.bookmarkedPage),
                        "student-assignment-id": this.studentAssignmentId,
                        "revertToNonAnimated": this.revertToNonAnimated
                    },
                    success: function(data) {
                        console.log(data);
                        if (data) {
                            if (data.badgeNotifications) {
                                clg.commonUtils.setCookie("badgeNotifications", JSON.stringify(data.badgeNotifications), 1);
                            }
                            window.location.replace("/main/ActivityReward/id/" + $j('#readResourceDeploymentId').val());
                        } else {
                            window.location.replace('/main/StudentPortal');
                        }
                    }
                })
            );
        }
        return false;
    }
    if (this.playerData[newPage] != undefined)
    	var section = this.playerData[newPage].sections;
    
    this.goToPage(this.curPageIndex);

};

Book.prototype.recordActivityCompletion = function(resourceDeploymentId, activityAddedAt) {
     $j.when(       		
        clg.swfRecording.doneRecording().then($j.noop, function () {
             return $j.Deferred().resolve().promise();
        })        
     ).done(function () {
         this.totalTime += (Date.now() - this.startTime);
         this.totalTime -= this.timeInTab;
         this.totalTime -= this.timeInDrawing;
         this.totalTime -= this.timeInJournal;
         this.totalTime -= this.timeInNotes;
         var recordNonQuizCompletionUrl = "/main/RecordStudentNonQuizActivityCompletion/resource_deployment_id/" + resourceDeploymentId + "/assignment_added_at/" + activityAddedAt;
         if (this.isTimedRead && this.readCompleted == "false") {
             recordNonQuizCompletionUrl = recordNonQuizCompletionUrl + "/duration/" + this.totalTime + "/pages/" + (this.totalPages - this.bookmarkedPage);
         }
         $j.ajax({
        	 async:false,
             url: recordNonQuizCompletionUrl
        })  	
     });
};

Book.prototype.backPage = function(){
    if (this.curPageIndex < 0) {
    	return;
    } else if (this.curPageIndex != 0) {
    	this.curPageIndex--;
    }
    var newPage = this.displayPages.pages[this.curPageIndex];
    
    $j('#forward-page').removeClass('pageArrowForward-done').text('Next');
    if (this.curPageIndex+1 == this.totalPages && this.ReadFromQuiz != '0'){
    	$j('#forward-page').addClass('pageArrowForward-done').text('Quiz');
    } else if (this.curPageIndex+1 == this.totalPages) {
    	$j('#forward-page').addClass('pageArrowForward-done').text('Done');
    }
    this.goToPage(this.curPageIndex);
}; 

Book.prototype.setPageSelectButton = function(){
    $j("#control-inner").prepend("<div id='select-page' class='control-button'></div>");
};

Book.prototype.saveNote = function (displayNotes) {
	var _this = this;
	var position = $j('.draggableNote').position();
	var sizeRatio = _this.bookWidth/newPageWidth;
	var x = ($j('#noteImg').position().left) * sizeRatio;
	var y = ($j('#noteImg').position().top) * sizeRatio;
		
	if ($j("#note_id")) {
		var pageNumber =$j('#pageNumber').val();
		$j.ajax({
 	        url :  "/main/" + _this.noteService + "/action/saveNote",
 	        data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: pageNumber, text: $j("#textContent").val(), note_location_x: x, note_location_y: y, note_id: $j('#note_id').val() },
 	        type: "POST",
 	        success: function(data) {
 	            _this.note.notes = data;
 	        	if (displayNotes && data.bookNotes) {
 	        		for (var i = 0; i < data.bookNotes.length; i++) {
 	 	        		var noteId = data.bookNotes[i].book_note_id;
 	 	        		if (pageNumber == Number(data.bookNotes[i].page_number)) {
 	 	        			$j('#note_id').val(noteId);
 		 	       			$j('#textContent').val(data.bookNotes[i].book_note_text);
 		 	       			Note.prototype.setNoteLocation(_this.bookWidth, Number(data.bookNotes[i].note_location_x), Number(data.bookNotes[i].note_location_y));
                            InitDragDrop();
                        }
                    }
                    
                    if ($j.isNumeric($j('#note_id').val())) {
                        $j('#noteImg').show();
                    } else {
                        $j('#noteImg').hide();
                    }
                }
                $j('#noteEdit').hide();
            }
        });
        $j('#note_id').val('');
        $j('#textContent').val('');
        
        return null;
    }
}

Book.prototype.saveNoteLocation = function () {
	var _this = this;
	var position = $j('.draggableNote').position();
	var sizeRatio = naturalPageWidth/newPageWidth;
	var x = ($j('#noteImg').position().left) * sizeRatio;
	var y = ($j('#noteImg').position().top) * sizeRatio;	
	var pageNumber = $j('#pageNumber').val();
	
	if ($j("#note_id")) {
		$j.ajax({
 	        url :  "/main/" + _this.noteService + "/action/saveNoteLocation",
 	        data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: pageNumber, note_location_x: x, note_location_y: y, note_id: $j('#note_id').val() },
 	        type: "POST",
 	        success: function(data) {
 	        	_this.note.notes = data;
            }
        });
        
        return null;
    }
}

Book.prototype.updateToolbarRecordingStatus = function (recordingIsActive) {
	this.recordingActive = recordingIsActive;
	this.toolBar.updateToolbarRecordingStatus(recordingIsActive);
    if (recordingIsActive) {
    	$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").attr('disabled', true);
    	$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").addClass('disabled');
    }  else if ((!recordingIsActive) && !isPreview) {
    	$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").attr('disabled', false);
    	$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").removeClass('disabled');
    }
}