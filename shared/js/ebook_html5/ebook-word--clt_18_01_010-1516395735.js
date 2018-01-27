var Word = function (top, left, width, height, word, id, infoId, prevId, audio, saved, vocabWordId, highlightRange, highlighter) {
    var _this = this;
    this.id = id;
    this.infoId = infoId;
    this.word = word;
    this.initialLeft = left;
    this.initialTop = top;
    this.initialWidth = width;
    this.initialHeight = height;
    this.audio = audio;
    this.saved = saved;
    this.vocabWordId = vocabWordId;
    this.isHighlighted = saved ? true : false;
    this.highlightRange = highlightRange;
    this.highlighter = highlighter;
    this.isExpandedForward = false;
    this.isExpandedBackward = false;
    this.left = null;
    this.top = null;
    this.width = null;
    this.height = null;
    this.right = null;
    this.bottom = null;
    this.pct = null;
    this.menu = null;
    this.nextId = null;
    this.prevId = null;
    if (prevId && this.initialTop == this.highlighter.words[prevId].initialTop)
        this.prevId = prevId;
    
    init();
    
    function init() {
        if(document.readyState == 'complete') {
            var offset = $j('#theImage').offset();
            var top = offset.top, left = offset.left, pct = _this.getEbookSizePct()
            _this.left = _this.initialLeft * pct + left;
            _this.top = _this.initialTop * pct + top;
            _this.width = _this.initialWidth * pct;
            _this.height = _this.initialHeight * pct;
            _this.right = _this.left + _this.width;
            _this.bottom = _this.top + _this.height;
        }
        insertHighlight();
    }
    
    function ebookHasLoaded() {
        return $j('#theImage').width();
    }
    
    function insertHighlight () {
        $j('<div/>', {
            id: 'highlight-word-' + _this.id,
            style: 'top:' + _this.top + 'px; left:' + _this.left + 'px;',
            height: _this.height + 'px',
            width: _this.width + 'px',
        }).appendTo('body');
        $j('#highlight-word-' + _this.id).addClass('dummy-highlight');
        if (_this.isHighlighted) {
            $j('#highlight-word-' + _this.id).addClass('save-highlight');
        }
        $j('#highlight-word-' + _this.id)
            .mouseover(function() {
                if (_this.highlighter.canHighlight()) {
                    if (_this.isHighlighted) {
                        $j('#highlight-word-' + _this.id).addClass('hover-highlight');
                    } else {
                        $j('#highlight-word-' + _this.id).addClass('pre-highlight');
                    }
                }
            })
            .mouseout(function() {
                $j('#highlight-word-' + _this.id).removeClass('hover-highlight');
                $j('#highlight-word-' + _this.id).removeClass('pre-highlight');         
            })
            .click(function () {
                if (!_this.isHighlighted)
                    _this.highlighter.highlight(_this.id);
            });
        if(_this.saved) {
            if (_this.id == _this.highlightRange.end_book_word_id) {
                _this.insertMenu();
            }
            if (_this.prevId && _this.highlighter.words[_this.prevId].isHighlighted)
                _this.expandHighlight(_this.prevId);
            $j('#highlight-word-' + _this.id).click(function () {
                if (_this.highlighter.canHighlight() && _this.saved)
                    _this.highlighter.words[_this.highlightRange.end_book_word_id].menu.toggle();
            })
        }
    }
}

Word.prototype.setNextId = function (id) {
    if (this.initialTop == this.highlighter.words[id].initialTop)
        this.nextId = id;
}


Word.prototype.insertMenu = function () {
    if (!this.menu) {
        if (this.saved) {
            this.menu = new SavedHighlightMenu(this, this.highlighter, this.highlightRange);
        } else {
            this.menu = new NewHighlightMenu(this, this.highlighter);
        }
    }

}

Word.prototype.highlight = function (highlighted, highlightType) {
    if (highlighted) {
        this.isHighlighted = true;
        $j('#highlight-word-' + this.id).addClass('current-highlight');
        if (this.highlighter.numOfHighlightedWords == 1) {
            this.expandHighlight(this.nextId);
            this.expandHighlight(this.prevId);
        } else if (this.highlighter.type.forward) {
            this.expandHighlight(this.nextId);
            if (this.isPrevWordHighlighted())
                this.expandHighlight(this.prevId)
        } else {
            this.expandHighlight(this.prevId);
            if (this.isNextWordHighlighted())
                this.expandHighlight(this.nextId)
        }
    } else if (!this.saved){
        this.isHighlighted = false;
        $j('#highlight-word-' + this.id).removeClass('current-highlight');
    }
}

Word.prototype.removeHighlightAndMenu = function (renderNewPage) {
    if (renderNewPage) {
        $j('#highlight-word-' + this.id).remove();
    } else if (!this.saved) {
        this.isHighlighted = false;
        $j('#highlight-word-' + this.id).removeClass('current-highlight');
        this.shrinkHighlight();
        if (this.nextId && this.highlighter.words[this.nextId].isExpandedBackward) {
            this.highlighter.words[this.nextId].shrinkHighlight();
            if (this.highlighter.words[this.nextId].isNextWordHighlighted()) {
                var nextNextId = this.highlighter.words[this.nextId].nextId;
                this.highlighter.words[nextNextId].expandHighlight(this.nextId);
            }
        }
        if (this.prevId && this.highlighter.words[this.prevId].isExpandedForward) {
            this.highlighter.words[this.prevId].shrinkHighlight();
        }

    }
    this.removeMenu(renderNewPage);
}

Word.prototype.removeMenu = function (overrideSave) {
    if (this.menu && (!this.saved || overrideSave)) {
        this.menu.remove();
        this.menu = null;
    }
}

Word.prototype.deleteSavedHighlight = function () {
    this.saved = false;
    this.highlightRange = null;

    $j('#highlight-word-' + this.id).removeClass('save-highlight');
    this.shrinkHighlight();
    this.removeMenu(true);
}

Word.prototype.calculatePosAndSize = function (top, left, pct) {
    var leftDiff = 0, widthDiff = 0;
    if (this.isExpanded()) {
        if (this.isExpandedBackward) {
            leftDiff = this.initialLeft - (this.highlighter.words[this.prevId].initialLeft + this.highlighter.words[this.prevId].initialWidth);
            widthDiff = leftDiff;
        } else {
            widthDiff = this.highlighter.words[this.nextId].initialLeft - (this.initialLeft + this.initialWidth);
        }
    }
    this.pct = pct;
    this.left = (this.initialLeft - leftDiff) * pct + left;
    this.top = this.initialTop * pct + top;
    this.width = (this.initialWidth + widthDiff) * pct;
    this.height = this.initialHeight * pct;
    this.right = this.left + this.width;
    this.bottom = this.top + this.height;
    if (this.menu) this.menu.updatePosition(this);
}

Word.prototype.getEbookSizePct = function () {
    var tempImage = new Image();
    tempImage.src = $j('#theImage').attr('src');
    
    return $j('#theImage').width() / tempImage.width;
}

Word.prototype.resize = function (top, left, pct) {
    this.calculatePosAndSize(top, left, pct);
    if (this.saved && this.prevId && this.highlighter.words[this.prevId].isHighlighted)
        this.expandHighlight(this.prevId);
    $j('#highlight-word-' + this.id).attr( 'style',
                                           'top:' + this.top + 'px; ' +
                                           'left:' + this.left + 'px;');
    $j('#highlight-word-' + this.id).height(this.height);
    $j('#highlight-word-' + this.id).width(this.width);
}

Word.prototype.getWordForJournal = function () {
    var letters = /^[A-Za-z0-9\u00C0-\u017F]+$/;
    var word = this.word.toLowerCase();
    var lastCharIsAlphaNumeric = false, firstCharIsAlphaNumeric = false;
    while (!firstCharIsAlphaNumeric) {
        if (!word[0].match(letters))
            word = word.substring(1,word.length);
        else
            firstCharIsAlphaNumeric = true;
    }
    while (!lastCharIsAlphaNumeric) {
        if (!word[word.length-1].match(letters))
            word = word.substring(0,word.length-1);
        else
            lastCharIsAlphaNumeric = true;
    }

    return word;
}

Word.prototype.isNextWordHighlighted = function () {
    return this.nextId ? this.highlighter.words[this.nextId].isHighlighted : false;
}

Word.prototype.isPrevWordHighlighted = function () {
    return this.prevId ? this.highlighter.words[this.prevId].isHighlighted : false;
}

Word.prototype.expandHighlight = function (id) {
    if (id) {
        var wordExpanding = this.highlighter.words[id];
        switch (id) {
            case this.nextId:
                wordExpanding.left = this.right;
                wordExpanding.width = (wordExpanding.isExpandedForward ? this.highlighter.words[wordExpanding.nextId].left : wordExpanding.right) - this.right;
                wordExpanding.isExpandedBackward = true;
                break;
            case this.prevId:
                wordExpanding.width = this.left - wordExpanding.left;
                wordExpanding.isExpandedForward = true;
                break;
        }
        $j('#highlight-word-' + id).attr( 'style',
                'top:' + wordExpanding.top + 'px; ' +
                'left:' + wordExpanding.left + 'px;');
        $j('#highlight-word-' + id).height(wordExpanding.height);
        $j('#highlight-word-' + id).width(wordExpanding.width);
    }

}

Word.prototype.shrinkHighlight = function () {
    if (this.isExpanded()) {
        if (!this.pct)
            this.pct = this.getEbookSizePct();
        var offset = $j('#theImage').offset();
        this.left = this.initialLeft * this.pct + offset.left;
        this.top = this.initialTop * this.pct + offset.top;
        this.width = this.initialWidth * this.pct;
        this.right = this.left + this.width;
        this.isExpandedForward = false;
        this.isExpandedBackward = false;
        $j('#highlight-word-' + this.id).attr( 'style',
                'top:' + this.top + 'px; ' +
                'left:' + this.left + 'px;');
        $j('#highlight-word-' + this.id).height(this.height);
        $j('#highlight-word-' + this.id).width(this.width);
    }
}

Word.prototype.isExpanded = function () {
    return this.isExpandedForward || this.isExpandedBackward;
}
