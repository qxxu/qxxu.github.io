var Highlighter = function (ebook, saveData, displayPages) {
    var _this = this;
    this.ebook = ebook;
    this.saveData = saveData;
    this.displayPages = displayPages;
    this.mouseIsDown = false;
    this.words = {};
    this.lastHighlightedWordPos = null;
    this.startXPos = -1;
    this.stopXPos = -1;
    this.startYPos = -1;
    this.stopYPos = -1;
    this.numOfHighlightedWords = 0;
    this.currentBookPageId = null;
    this.type = { forward: 1, backward: 2, neither: 3};

    $j(document).mousedown(function(e) { if (_this.canHighlight()) mouseDown(e) });
    $j(document).mouseup(function(e) { if (_this.canHighlight()) mouseUp(e) });
    $j(document).mousemove(function(e) { if (_this.canHighlight()) mouseMove(e) });

    this.newPage(true);
    
    function mouseUp(e) {
        _this.mouseIsDown = false;
        insertMenu();
    }
    
    function mouseDown(e) {
        if (!userClickedDraggableNote(e)){
            _this.mouseIsDown = true;
            _this.startXPos = -1;
            _this.stopXPos = -1;
            _this.startYPos = -1;
            _this.stopYPos = -1;
            _this.numOfHighlightedWords = 0;
        }
    }
    
    function mouseMove(e) {
        disableDrag();
        if (_this.canHighlight() && _this.mouseIsDown) {
            _this.stopXPos = e.pageX;
            _this.stopYPos = e.pageY;

            if (_this.startXPos == -1)
                _this.startXPos = _this.stopXPos;
            if (_this.startYPos == -1)
                _this.startYPos = _this.stopYPos;
            
            $j.each(_this.words, function(index, word) {
                if (!word.saved) {
                    var case1a = _this.stopYPos <= word.top && _this.startYPos >= word.bottom; //backwards
                    var case1b = _this.startYPos <= word.top && _this.stopYPos >= word.bottom; //forwards
                    
                    var case2 = _this.startYPos <= word.bottom && _this.startYPos >= word.top;
                    var case2a = case2 && _this.stopYPos >= word.bottom && _this.startXPos <= word.right; //forwards
                    var case2b = case2 && _this.stopXPos >= (word.right - 0.5 * word.width) && _this.stopYPos >= word.top && _this.startXPos <= word.right; //forwards
                    var case2c = case2 && _this.stopYPos <= word.top && _this.startXPos >= word.left; //backwards
                    var case2d = case2 && _this.stopXPos <= (word.left + 0.5 * word.width) && _this.stopYPos <= word.bottom && _this.startXPos >= word.left; //backwards
                    
                    var case3 = _this.startYPos >= word.bottom && _this.stopYPos <= word.bottom && _this.stopXPos <= (word.left + 0.5 * word.width); //backwards
                    var case4 = _this.startYPos <= word.top && _this.stopYPos >= word.top && _this.stopXPos >= (word.right - 0.5 * word.width); //forwards

                    if (case1a || case1b || case2a || case2b || case2c || case2d || case3 || case4) {
                        var highlightType = (case1b || case2a || case2b || case4) ? _this.type.forward : _this.type.backward;
                        if (!word.isHighlighted)
                            _this.numOfHighlightedWords++;
                        _this.words[index].highlight(true, highlightType);
                    } else {
                        if (word.isHighlighted)
                            _this.numOfHighlightedWords--;
                        if (!$j('div[id*=highlight-menu]').is(':visible'))
                            _this.words[index].highlight(false);
                    }
                }
            });
        }
    }

    function insertMenu () {
        $j.each(_this.words, function(index, word) {
            if (word.isHighlighted && !word.saved) {
                _this.lastHighlightedWordPos = word.id;
            }
        });
        if (_this.lastHighlightedWordPos !== null) {
            _this.words[_this.lastHighlightedWordPos].insertMenu();
        }
    }

    function userClickedDraggableNote (e) {
        var note = $j('#noteImg .draggableNote');
        if(note.length) {
            var offset = note.offset();
            if ((e.pageX >= offset.left && e.pageX <= (offset.left + note.width())) &&
                (e.pageY >= offset.top && e.pageY <= (offset.top + note.height())))
                return true;
        }
        return false;
    }
};

Highlighter.prototype.resize = function (ebookStyle) {
    var tempImage = new Image();
    tempImage.src = $j('#theImage').attr('src');
    var pct = this.getStyleAttr(ebookStyle, 'width') / tempImage.width;
    var top = this.getStyleAttr(ebookStyle, 'top');
    var left = this.getStyleAttr(ebookStyle, 'left');

    $j.each(this.words, function(index, word) {
        word.resize(top, left, pct);
    });
};

Highlighter.prototype.getStyleAttr = function (style, attr) {
    regex = /(-)?(?:\d*\.)?\d+/g;
    return Number(style.substring(style.indexOf(attr)).match(regex)[0])
};

Highlighter.prototype.highlight = function (id) {
    this.lastHighlightedWordPos = id;
    this.numOfHighlightedWords++;
    this.words[id].highlight(true, this.type.neither);
    this.words[id].insertMenu();
};

Highlighter.prototype.resetVars = function (clearAll) {
    var _this = this;
    _this.clearAllHighlights(clearAll);
    _this.cursorPos = [];
    _this.startXPos = -1;
    _this.stopXPos = -1;
    _this.startYPos = -1;
    _this.stopYPos = -1;
    _this.lastHighlightedWordPos = null;
};

Highlighter.prototype.newPage = function () {
    var _this = this;
    this.resetVars(true);
    this.words = {};
    var prevWordId = null;
    this.ebook.listenBookPageId = this.ebook.findListenBookPageId(this.displayPages.pages[this.ebook.curPageIndex], this.ebook.playerData);
    if (this.ebook.listenBookPageId > 0 && !setIsInIframe()) {
    	playerDataIndex = Book.prototype.findListenBookPageIndex(this.displayPages.pages[this.ebook.curPageIndex], this.ebook.playerData) - 1;
    	if (this.displayPages.pages[0] ==  0) {
    		playerDataIndex = Book.prototype.findListenBookPageIndex(this.displayPages.pages[this.ebook.curPageIndex], this.ebook.playerData) - 1;
    	}
    	
        this.currentBookPageId = this.ebook.playerData[playerDataIndex].book_page_id;
        $j.each(this.ebook.playerData[playerDataIndex].sections, function(key, sections) {
	        $j.each(sections.phrases, function(i, phrases) {
	            $j.each(phrases.words, function (j, wordInfo) {
	                var wordHighlightSaved = false, highlightRange = null;
	                if ($j.isArray(_this.saveData)) {
	                    $j.each(_this.saveData, function (k, highlight) {
	                        if (wordInfo.book_word_id < highlight.start_book_word_id) {
	                            return false;
	                        }
	                        if (wordInfo.book_word_id <= highlight.end_book_word_id) {
	                            wordHighlightSaved = true;
	                            highlightRange = highlight;
	                            return false;
	                        }
	                    });
	                }
	    
	                var curWord = new Word(Number(wordInfo.top), 
	                        Number(wordInfo.left), 
	                        Number(wordInfo.width),
	                        Number(wordInfo.height),
	                        wordInfo.word, wordInfo.book_word_id, wordInfo.book_word_info_id, prevWordId, wordInfo.audio_url, wordHighlightSaved, wordInfo.vocab_word_id,highlightRange, _this);
	    
	                _this.words[curWord.id] = curWord;
	                if (prevWordId)
	                    _this.words[prevWordId].setNextId(curWord.id);
	                prevWordId = curWord.id;
	             });
	        });
        });
    }
};

Highlighter.prototype.saveHighlight = function () {
    var numOfHighlightedWords = 0;
    var _this = this;

    $j.each(this.words, function(index, word) {
        if (_this.lastHighlightedWordPos == index) {
            return false;
        }
        if (word.isHighlighted) {
            word.saved = true;
            numOfHighlightedWords++;
        } else {
            numOfHighlightedWords = 0;
        }
    });
    var lastWordId = Number(this.words[this.lastHighlightedWordPos].id), firstWordId = Number(lastWordId) - numOfHighlightedWords;

    if(!isPreview) {
        $j.ajax({
            type: "GET",
            url: "/main/EBookService/action/saveHighlight/resource_deployment_id/" + $j('#resource_deployment_id').val() + "/start_book_word_id/" + firstWordId + "/end_book_word_id/" + lastWordId + "/book_page_id/" + this.currentBookPageId,
            success: function () {
                var numToDelete = 0, insertPos = false;
                if (_this.saveData.length) {
                    $j.each(_this.saveData, function (index, value) {
                        if (firstWordId <= value.start_book_word_id) {
                            if (insertPos === false) {
                                insertPos = index;
                            }
                            if ((lastWordId + 1) == value.start_book_word_id && _this.words[value.end_book_word_id]) {
                                lastWordId = value.end_book_word_id
                            }
                            if (lastWordId >= value.end_book_word_id) {
                                numToDelete++;
                            }
                        }
                    });
                }
                insertPos = insertPos !== false ? insertPos : _this.saveData.length;
                _this.saveData.splice(insertPos, numToDelete);
                _this.saveData.splice(insertPos, 0, {'start_book_word_id' : firstWordId, 'end_book_word_id' : lastWordId});
                _this.newPage();
            }
        });
    } else {
        var numToDelete = 0, insertPos = false;
        if (_this.saveData.size()) {
            $j.each(_this.saveData, function (index, value) {
                if (firstWordId <= value.start_book_word_id) {
                    if (insertPos === false) {
                        insertPos = index;
                    }
                    if ((lastWordId + 1) == value.start_book_word_id && _this.words[value.end_book_word_id]) {
                        lastWordId = value.end_book_word_id
                    }
                    if (lastWordId >= value.end_book_word_id) {
                        numToDelete++;
                    }
                }
            });
        }
        insertPos = insertPos !== false ? insertPos : _this.saveData.size();
        _this.saveData.splice(insertPos, numToDelete);
        _this.saveData.splice(insertPos, 0, {'start_book_word_id' : firstWordId, 'end_book_word_id' : lastWordId});
        _this.newPage();
    }
};

Highlighter.prototype.deleteHighlight = function (endBookWordId) {
    var _this = this;
    var firstWordId = null;
    $j.each(this.words, function(index, word) {
        if (word.isHighlighted && word.saved && word.highlightRange.end_book_word_id == endBookWordId) {
            if (!firstWordId) {
                firstWordId = word.highlightRange.start_book_word_id;
            }
            word.deleteSavedHighlight();
        }
    });

    if(!isPreview) {
        $j.ajax({
            type: "GET",
            url: "/main/EBookService/action/deleteHighlight/resource_deployment_id/" + $j('#resource_deployment_id').val() + "/start_book_word_id/" + firstWordId,
            success: function () {
                $j.each(_this.saveData, function (index, value) {
                    if (firstWordId == value.start_book_word_id) {
                        _this.saveData.splice(index, 1);
                        return false;
                    }
                });
                _this.newPage();
            }
        });
    } else {
        $j.each(_this.saveData, function (index, value) {
            if (firstWordId == value.start_book_word_id) {
                _this.saveData.splice(index, 1);
                return false;
            }
        });
        _this.newPage();
    }
};

Highlighter.prototype.clearAllHighlights = function(clearAll) {
    var _this = this;
    $j.each(_this.words, function(index, word) {
        word.removeHighlightAndMenu(clearAll);
    });
    _this.numOfHighlightedWords = 0;
};

Highlighter.prototype.canHighlight = function () {
    if ($j('#body').hasClass('noselect')) {
        return false;
    }
    return (!setIsInIframe() && !($j('.tool').hasClass('is-active') ||
             $j('#add-note').hasClass('is-active') || 
             $j('#journal').hasClass('is-active') || 
             $j('#noteImg .draggableNote').hasClass('is-active') ||
             $j('[id^="highlight-menu"]').is(':visible')));
};

Highlighter.prototype.unhighlightAllWords = function () {
    this.resetVars();
};