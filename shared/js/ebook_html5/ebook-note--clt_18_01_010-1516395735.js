/*****************************************************************
 * 
 * Notes Class and functions
 * 
 * @param {json} playerData
 * @param {Object} bookRef
 *      reference to the Book that owns this object
 ****************************************************************/
var mouseOverActiveElement = false;
var Note = function(noteData, bookRef){   
    var _startX = 0;            // mouse starting positions
    var _startY = 0;
    var _offsetX = 0;           // current element offset
    var _offsetY = 0;
    var _dragElement;           // needs to be passed from OnMouseDown to OnMouseMove
    var _oldZIndex = 0;         // we temporarily increase the z-index during drag
    this.book = bookRef;
    this.notes = noteData;

    var _this = this;
    this.attachNewNoteClick();
    
};

Note.prototype.getNoteService = function() {
    if(isPreview) {
        return "PreviewNoteService";
    }

    return "EBookService";
}

Note.prototype.attachNewNoteClick = function() {
    var _this = this;
    
    $j('body').on('click','#add-note',function(e) {
        _this.populatePageNotes(_this.notes, $j('#pageNumber').val());
                
        if ($j(this).attr('disabled') != "disabled") {
            
        currentTool = "note";
        $j('#noteEdit').toggle();
        
        if ($j('#noteEdit').css('display') == 'block') {
        	Note.prototype.getNote();
        } else {
        	_this.book.saveNote(false);
        }
        
        $j('#noteEdit').on('mouseenter', function() {
            mouseOverActiveElement = true; 
        }).on('mouseleave', function() { 
            mouseOverActiveElement = false; 
        });
        
        $j('body').on('click', function(e) {
            if (!mouseOverActiveElement && ($j('#noteEdit').css('display') && $j('#noteEdit').css('display') == 'block') && $j(e.target).parent() != null) {
                if (!$j(e.target).hasClass('draggableNote') && (!($j(e.target).hasClass('js-note') || $j(e.target).hasClass('icon-notesC')))) {
                	$j('#noteEdit').css('display', 'none');
                    $j('#add-note').removeClass('is-active');
                    $j('#canvas').removeClass('is-drawing');
                    _this.book.saveNote(true);
                }
            }
        });
        }
    });

    $j('#noteClose').bind("click", function() {
        $j("#add-note").removeClass("is-active");
        $j('#canvas').removeClass('is-drawing');
        _this.book.saveNote(true);
    });

    $j(window).bind('beforeunload', function(){
        if (!mouseOverActiveElement && ($j('#noteEdit').css('display') && $j('#noteEdit').css('display') == 'block')) {
        	_this.book.saveNote(false);
        }
    });
};

Note.prototype.populatePageNotes = function(noteData, pageNumber) {
    foundNote = false;
    if (noteData.bookNotes)
    for (var i = 0; i < noteData.bookNotes.length; i++) {
    	if (noteData.bookNotes[i].page_number == pageNumber) {
    		var noteId = noteData.bookNotes[i].book_note_id;
    		$j('#note_id').val(noteId);
    		foundNote = true;
    	}
	}

	if (!foundNote) {
		$j('#textContent').val('');
    	$j('#note_id').val('');
	}
};

Note.prototype.showDraggableNote = function(noteData, pageNumber, book) {
	var _this = this;
	if (noteData.bookNotes)
		for (var i = 0; i < noteData.bookNotes.length; i++) {
			var noteId = noteData.bookNotes[i].book_note_id;
			if (pageNumber == noteData.bookNotes[i].page_number) {
				Note.prototype.setNoteLocation(book.bookWidth, Number(noteData.bookNotes[i].note_location_x), Number(noteData.bookNotes[i].note_location_y));
				$j('#note_id').val(noteId);
				InitDragDrop();
	        }
	    }
    $j("#noteEdit").css("display", "none");
    if ($j.isNumeric($j('#note_id').val())) {
        $j('#noteImg').show();
    } else {
        $j('#noteImg').hide();
    }

    $j('#noteEdit').on('mouseenter', function() {
        mouseOverActiveElement = true;
    }).on('mouseleave', function() {
        mouseOverActiveElement = false;
    });

    $j('body').on('click', function(e) {
        if (!mouseOverActiveElement && ($j('#noteEdit').css('display') && $j('#noteEdit').css('display') == 'block') && $j(e.target).parent() != null) {
            if (!$j(e.target).hasClass('draggableNote') && (!($j(e.target).hasClass('js-note') || $j(e.target).hasClass('icon-notesC')))) {
                $j('#noteEdit').css('display', 'none');
                $j('#add-note').removeClass('is-active');
                $j('#canvas').removeClass('is-drawing');
                	book.saveNote(true);
            }
        }
    });  
};

Note.prototype.getNote = function() {
    var _this = this;
	if ($j('#note_id').val()) {
		$j.ajax({
	        url :  '/main/' + _this.getNoteService() + '/action/getBookNoteText/id/'+$j('#note_id').val(),
	        type: "GET",  
	        success: function ( responseText ) {
	        	$j('#textContent').val(responseText);
	        }
	    });	
	    return false;
	}	    	
};

Note.prototype.setNoteLocation = function(bookWidth, x, y) {
	if (x == 0 && y == 0) {
		imagePosition = $j('#theImage').position();
		leftLocation = (imagePosition.left + $j('#theImage').width()) - ($j('#noteImg').width() + 5);
		topLocation = imagePosition.top + 5;
		$j('#noteImg').css('left', leftLocation + 'px');
		$j('#noteImg').css('top', topLocation + 'px');
	} else {
		var sizeRatio = bookWidth/newPageWidth;
		leftLocation = x / sizeRatio;
		topLocation = (y + 5) / sizeRatio;
		$j('#noteImg').css('left', leftLocation + 'px');
		$j('#noteImg').css('top', topLocation + 'px');
	}
};

function InitDragDrop() {
    document.onmousedown = OnMouseDown;
    document.onmouseup = OnMouseUp;
};

function OnMouseDown(e) {
    // IE doesn't pass the event object
    if (e == null) 
        e = window.event; 
    
    // IE uses srcElement, others use target
    var target = (e.target.parentElement && e.target.parentElement != null) ? e.target.parentElement : e.srcElement.parentNode;
    
    //console.log(target);
    msg = target.className == 'drag' 
        ? 'draggable element clicked' 
        : 'NON-draggable element clicked';
      
    if (e.target.className == "draggableNote") {
		$j('.draggableNote').addClass('is-active');
	}		

    // for IE, left click == 1
    // for Firefox, left click == 0
    if ((e.button == 1 && window.event != null || 
        e.button == 0) &&
        $j(target).hasClass('drag')) {
        // grab the mouse position
        _startX = e.clientX;
        _startY = e.clientY;
        
        if (target.style.left) {
        	_offsetX = ExtractNumber(target.style.left);
            _offsetY = ExtractNumber(target.style.top);
        } else {
        	pos = $j('#noteImg').position();
        	_offsetX = pos.left;
            _offsetY = pos.top;
        }
        
        // bring the clicked element to the front while it is being dragged
        _oldZIndex = target.style.zIndex;
        
        // we need to access the element in OnMouseMove
        _dragElement = target;

        // tell our code to start moving the element with the mouse
        document.onmousemove = OnMouseMove;
        
        // cancel out any text selections
        document.body.focus();

        // prevent text selection in IE
        document.onselectstart = function () { return false; };
        // prevent IE from trying to drag an image
        target.ondragstart = function() { return false; };
        
        // prevent text selection (except IE)
        return false;
    }
};

function OnMouseMove(e) {
    if (e == null) 
        var e = window.event; 
    
    if (_startX != e.clientX && e.clientX != e.clientY) {
	    // this is the actual "drag code"
	    if (($j('#theImage').width() >= (_offsetX + e.clientX - _startX) + $j('#noteImg').width()) && ((_offsetX + e.clientX - _startX) > 0)) {
	    	_dragElement.style.left = (_offsetX + e.clientX - _startX) + 'px';
	    }

        var offset = parseInt($j('#book-page').css('marginTop'));
        offset *= offset < 0 ? -1 : 1;
	    if ((($j('#theImage').height() + offset) >= (_offsetY + e.clientY - _startY) + $j('#noteImg').height()) && ((_offsetY + e.clientY - _startY) > 0)) {
	    	_dragElement.style.top = (_offsetY + e.clientY - _startY) + 'px';
	    }
	    
	    var target = (e.target.parentElement && e.target.parentElement != null) ? e.target.parentElement : e.srcElement.parentNode;
	    onMouseMoveFlag = true;
    }
};

function OnMouseUp(e) {
	if ($j("#noteImg").css('display') == 'block' && $j('.draggableNote').hasClass('is-active')) {
		if (onMouseMoveFlag) {
			if (studentBook != undefined) {
				studentBook.saveNoteLocation();
			}			
		}
		$j('.draggableNote').removeClass('is-active'); 
		if (_dragElement != undefined && _dragElement != null) {
	        _dragElement.style.zIndex = _oldZIndex;
	
	        // we're done with these events until the next OnMouseDown
	        document.onmousemove = null;
	        document.onselectstart = null;
	        _dragElement.ondragstart = null;
	
	        // this is how we know we're not dragging
	        _dragElement = null; 
	        if (onMouseMoveFlag == false
                && !$j("#noteImg").hasClass('disabled')) {
                $j("#noteEdit").toggle();
	        	if ($j('#noteEdit').css('display') == 'block') {
	        		//retrieve note text - get separately than rest of session info so that we don't
	        		//end up with discrepencies between two sessions (mobile + webapp for eg.)
	        		Note.prototype.getNote(); 
	        		$j("#add-note").addClass("is-active");
	        		$j('#journalEdit').css('display', 'none');
	        		$j('#journal').removeClass('is-active');
	        	} else {
	        		$j("#add-note").removeClass("is-active");
	        	}
	        	
	        }
	        onMouseMoveFlag = false;
	    }
	}
};

function ExtractNumber(value) {
    var n = parseFloat(value);
    return n == null || isNaN(n) ? 0 : n;
}

function redirectBack() {
	var redirectLocation = $j('.ebookHeader .backButton').attr('href');
	window.location = redirectLocation;
	return false;
}

function $(id) {
    return document.getElementById(id);
}
