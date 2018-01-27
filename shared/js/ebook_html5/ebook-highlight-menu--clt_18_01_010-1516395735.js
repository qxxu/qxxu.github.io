var HighlightMenu = function(parentWord, highlighter, highlightRange) {
    var _this = this;
    this.height = 13;
    this.menuItemHeight = 32;
    this.arrowOffset = { x : 12, y : 12 };
    this.wordHeight = parentWord.height;
    this.xPos = parentWord.left + parentWord.width + this.arrowOffset.x;
    this.yPos = parentWord.top - this.arrowOffset.y;
    this.id = parentWord.id;
    this.parentWord = parentWord;
    this.parentWordPos = null;
    this.highlighter = highlighter
    this.highlightRange = highlightRange;
    this.isVisible = false;
    this.menuItems = [];
    this.menu = null;

    $j(document).mousedown(function(e) { mouseDown(e) });
    
    this.insertMenu = function () {
        this.menu = $j(document.createElement('div'));
        this.menu.attr('id', 'highlight-menu-' + this.id);
        this.menu.appendTo('body');
        this.menu.hide();
        this.addMenuItems();
        this.updatePosition(this.parentWord);
    }

    this.updatePosition = function (parentWord) {
        var totalToolbarHeight = $j('#toolbarContent').outerHeight() + $j('#toolbarToggle').outerHeight();
        var ebookRightMostPos = $j('#theImage').width() + $j('#theImage').offset().left;
        var highestMenuPos = this.yPos - this.menu.outerHeight(true);
        var rightMostMenuPos = this.xPos + this.menu.outerWidth(true);
        this.setParentVars(parentWord);
        this.xPos = this.parentWord.left + this.parentWord.width + this.arrowOffset.x;
        this.yPos = this.parentWord.top - this.arrowOffset.y;
        if (highestMenuPos < totalToolbarHeight || this.menu.hasClass('topLeft') || this.menu.hasClass('topRight')) {
            this.menu.addClass('topLeft');
            this.yPos = this.parentWordPos.topRight.y + this.menu.outerHeight() + this.arrowOffset.y + this.wordHeight;
        }
        if (rightMostMenuPos > ebookRightMostPos || this.menu.hasClass('bottomRight') || this.menu.hasClass('topRight')) {
            this.menu.addClass('bottomRight');
            this.xPos = this.parentWordPos.topRight.x - this.menu.outerWidth() - this.arrowOffset.x;
        }
        if (this.menu.hasClass('topLeft') && this.menu.hasClass('bottomRight')) {
            this.menu.removeClass('topLeft');
            this.menu.removeClass('bottomRight');
            this.menu.addClass('topRight');
        }
        this.menu.attr('style', 
                'top:' + (_this.yPos - _this.height) + 'px;\
                left:' + _this.xPos + 'px;\
                display:' + this.menu.css('display'));
    }

    this.setParentVars = function (newParentData) {
        this.parentWord = newParentData;
        this.wordHeight = newParentData.height;
        this.parentWordPos = {
            bottomRight: { x : newParentData.left + newParentData.width, y : newParentData.top + newParentData.height},
            topRight: { x : newParentData.left + newParentData.width, y : newParentData.top}
        }
    }

    function mouseDown (e) {
        if (_this.isVisible) {
            if (!userClickedMenu(e) && !userClickedChildWord(e)) {
                _this.hide();
                _this.highlighter.unhighlightAllWords();
            }
        }
    }

    function userClickedMenu (e) {
        var results = false;
        if (_this.menu.size()) {
            var menuData = getGlobalPosAndSize()
            results = e.pageX >= menuData.minX && e.pageX <= menuData.maxX && e.pageY >= menuData.minY && e.pageY <= menuData.maxY
        }
        return results;
    }

    function userClickedChildWord(e) {
        var clickedBookWordId = null, results = false;
        if ($j(e.target).attr('id') && _this.highlightRange) {
            clickedBookWordId = Number($j(e.target).attr('id').replace('highlight-word-', ''));
            results = _this.highlightRange.start_book_word_id <= clickedBookWordId && _this.highlightRange.end_book_word_id >= clickedBookWordId;
        }
        return results;
    }

    function getGlobalPosAndSize () {
        var offset = _this.menu.offset(), height = _this.menu.height(), width = _this.menu.width();
        
        return {'minX' : offset.left,
                'maxX' : offset.left + width ,
                'minY' : offset.top,
                'maxY' : offset.top + height};
    }
}

HighlightMenu.prototype.toggle = function () {
    if (this.isVisible)
        this.hide();
    else
        this.show();
}

HighlightMenu.prototype.hide = function () {
    this.isVisible = false;
    this.menu.hide();
}

HighlightMenu.prototype.show = function () {
    this.isVisible = true;
    this.menu.show();
}

HighlightMenu.prototype.remove = function () {
    this.isVisible = false;
    this.menu.remove();
}

HighlightMenu.prototype.addMenuItems = function () {
    throw ('sub-class must implement this function');
}

HighlightMenu.prototype.createNewMenuItem = function (itemName, itemIconClass, isEnable, itemFunction) {
    var menuItem = $j(document.createElement('a'));  
    if (isEnable) {    	
    	menuItem.click(itemFunction);
    	menuItem.removeClass('disabled');
    } else {
    	menuItem.addClass('disabled');
    }
    var menuDiv = $j(document.createElement('div'));
    menuDiv.addClass('highlight-menu-item');    
    var iconSpan = $j(document.createElement('span'));
    iconSpan.addClass(itemIconClass);
    menuDiv.append(iconSpan);
    menuDiv.append(itemName);
    menuItem.html(menuDiv[0]);
    this.menu.append(menuItem[0]);
    this.height += this.menuItemHeight;
}

var NewHighlightMenu = function () {
    HighlightMenu.apply(this, arguments);
    var _this = this;
    this.vocabNoteCard = null;
    this.isSingleWord = _this.highlighter.numOfHighlightedWords == 1;
    this.isSpanishBook = (_this.highlighter.ebook.language_id == 3);
    this.word = null;
    if (this.isSingleWord) {
    	this.word = _this.highlighter.words[_this.highlighter.lastHighlightedWordPos];
        this.vocabNoteCard = this.word.vocabWordId != "0" ? new VocabNoteCard(this, this.highlighter, this.word) : null;
    }

    this.insertMenu();
}

NewHighlightMenu.prototype.addMenuItems = function () {
    var _this = this;
    if (this.isSingleWord) {
    	if (this.word.audio && !this.isSpanishBook)
    		HighlightMenu.prototype.createNewMenuItem.call(this, "Hear Word", "icon icon-audioC", true, function(e) {_this.listenToHighlightedWord(e.target, _this.word)});
    }
    HighlightMenu.prototype.createNewMenuItem.call(this, "Highlight", "icon icon-highlighterC", true, function() {_this.saveHighlight()});
    if (this.isSingleWord) {
    	if ($j('#journal').hasClass('disabled'))
    		HighlightMenu.prototype.createNewMenuItem.call(this, "Add to Word Journal", "icon icon-journalC", false, function() {_this.addWordToJournal(_this.word)});
    	else
    		HighlightMenu.prototype.createNewMenuItem.call(this, "Add to Word Journal", "icon icon-journalC", true, function() {_this.addWordToJournal(_this.word)});
        if (this.vocabNoteCard)
            HighlightMenu.prototype.createNewMenuItem.call(this, "View Vocabulary Card", "icon icon-vocabC", true, function() {_this.vocabNoteCard.displayVocabData()});
    }
    this.show();
}

NewHighlightMenu.prototype.toggle = function () {
    HighlightMenu.prototype.toggle.call(this);
}

NewHighlightMenu.prototype.hide = function () {
    HighlightMenu.prototype.hide.call(this);
    this.remove();
}

NewHighlightMenu.prototype.show = function () {
    HighlightMenu.prototype.show.call(this);
}

NewHighlightMenu.prototype.remove = function () {
    HighlightMenu.prototype.remove.call(this);
    //this.removeVocabInfo()
}

NewHighlightMenu.prototype.saveHighlight = function () {
	this.highlighter.saveHighlight();
}

NewHighlightMenu.prototype.listenToHighlightedWord = function (listenIconElt, word) {
	var loadingGifId = 'highlight-audio-loader';
	window.clg = window.clg || {};
	window.clg.wordPlayer = window.clg.wordPlayer || {};
	(function(ns, $j){
		ns.audioDurationChange = $j.noop;
		ns.audioEnded = function () {
			var player = $j('#word-player');
			setTimeout(function() {
				player.remove();
			}, 1);
		}
		ns.audioReady = function () {
			var player = $j('#word-player');
	    	$j('#' + loadingGifId).remove();
	    	$j(listenIconElt).removeClass('hidden');
			player[0].play()
		}
		ns.audioError = function (e) {
			console.log('audioError: ' + e);
		}
	})(window.clg.wordPlayer, jQuery)
	function insertLoadingGif () {
		var loadingGif = '<div id="'+ loadingGifId +'"/>';
		if (Modernizr.audio) {
			if (!$j(listenIconElt).hasClass('icon-audioC'))
				listenIconElt = $j(listenIconElt).find('.icon-audioC')[0];
			$j(listenIconElt).height($j(listenIconElt).height());
			$j(listenIconElt).width($j(listenIconElt).width());
			$j(listenIconElt).addClass('hidden');
			$j(listenIconElt).append(loadingGif);
			$j('#' + loadingGifId).height($j(listenIconElt).height());
			$j('#' + loadingGifId).width($j(listenIconElt).width());
			$j('#' + loadingGifId).css('background-size', $j(listenIconElt).height() + 'px ' + $j(listenIconElt).width() + 'px');
			$j('#' + loadingGifId).css('margin-bottom', Number($j(listenIconElt).height()) / -2)
			$j('#' + loadingGifId).css('margin-left', '-1');
		}
	}
	function insertHTML5AudioPlayer(audioSource) {
	    var audioHtml = '<audio id="word-player" preload="auto"></audio>';
	    $j(body).append(audioHtml);
	    var player = $j('#word-player');
        player[0].oncanplay = clg.wordPlayer.audioReady;
        player[0].onended = clg.wordPlayer.audioEnded;
        player[0].src = src;
        player[0].load();
	}

	var src = word.audio;
    $j('#word-player').remove();
	insertLoadingGif();
    console.log(src);
    insertHTML5AudioPlayer(src);
}

NewHighlightMenu.prototype.addWordToJournal = function (word) {
    var _this = this;
    var timeToWait = 0;
    if (!$j('#toolbar').hasClass('is-open')) {
        $j('#toolbarToggle').click();
        timeToWait = 200;
    }
    $j( "#journalEdit" ).tabs( "option", "active", 0 );
    var test = true;
    setTimeout(function() {
        _this.highlighter.ebook.wordJournal.addWordToJournal(word.getWordForJournal());
        _this.highlighter.resetVars();
    }, timeToWait);
}

var SavedHighlightMenu = function () {
    HighlightMenu.apply(this, arguments);
    var _this = this;
    
    this.insertMenu();
}

SavedHighlightMenu.prototype.addMenuItems = function () {
    var _this = this;
    HighlightMenu.prototype.createNewMenuItem.call(this, "Remove Highlight", "icon icon-remove", true, function() {_this.deleteHighlight(_this.highlightRange.end_book_word_id)});
    this.hide();
}

SavedHighlightMenu.prototype.toggle = function () {
    HighlightMenu.prototype.toggle.call(this);
}

SavedHighlightMenu.prototype.hide = function () {
    HighlightMenu.prototype.hide.call(this);
}

SavedHighlightMenu.prototype.show = function () {
    HighlightMenu.prototype.show.call(this);
}

SavedHighlightMenu.prototype.remove = function () {
    HighlightMenu.prototype.remove.call(this);
}

SavedHighlightMenu.prototype.deleteHighlight = function (range) {
	this.highlighter.deleteHighlight(range);
}