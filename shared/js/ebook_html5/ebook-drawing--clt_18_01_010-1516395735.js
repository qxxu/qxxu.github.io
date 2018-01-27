/*****************************************************************
 *
 * Drawing class and functions
 *
 * @param {int} completedPages
 * @param {json} drawingData
 ****************************************************************/
var Drawing = function(bookInfo){
    this.attachPenClick();
    this.attachHighlighterClick();
    this.attachStampClick();

    this.attachPenColorClick();
    this.attachHighlighterColorClick();
    this.attachStampChangeClick();

    this.attachUndoClick();

    this.colour = "black";
    this.opacity = 1;
    this.penWidth = 3;
    this.stampName = "star";
    this.bookInfo = bookInfo;
    this.paper;
    this.sizeRatio = null;
    this.mouseover = false;
    this.attachDrawingCanvas();
};

Drawing.prototype.getDrawingService = function() {
    if(isPreview) {
        return "PreviewDrawingService";
    }

    return "EBookService";
}

Drawing.prototype.attachUndoClick = function(){
    var _this = this;
    $j('#undo').unbind("click").bind("click", function(e) {
        e = e || window.event;
        var urlPost="/main/"+_this.getDrawingService()+"/action/removeLastDrawingItem";
        $j.ajax({
    	    type: "POST",
    	    url: urlPost,
    	    data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: $j('#pageNumber').val() },
    	    success: function(response) {
		    	$j( "#" + (response.stampName ? response.stampName + '-' : '') + response.bookCanvasIllustrationId ).remove();
    	    }
    	});
   });
};

Drawing.prototype.attachPenClick = function(){
    var _this = this;
    $j('body').on('click',"#pen",function(e) {
        e = e || window.event;
        _this.penWidth = 3;
    	_this.opacity = 1;
    	_this.colour = "#000000";
    	if ($j("#pen").hasClass("is-active")) {
	        $j("#penblack").addClass('active');
	        currentTool = "pen";
	        _this.setCursor();

	        $j('#penColorChange li').each(function( index ) {
	        	if ($j(this).hasClass( "active" )) {
	        		_this.colour = $j(this).data("colorCode");
	            }
	        });
    	} else {
    		currentTool = "default";
    		_this.setCursor();
    	}
   });
};

Drawing.prototype.attachHighlighterClick = function(){
    var _this = this;
    $j('body').on('click',"#highlighter",function(e) {
        e = e || window.event;
    	_this.penWidth = 30;
    	_this.opacity = .5;
    	_this.colour = "#fcf301";
    	if ($j("#highlighter").hasClass("is-active")) {
	        $j("#highlightyellow").addClass('active');
	        currentTool = "highlighter";
	        _this.setCursor();

	        $j('#highlightColorChange li').each(function( index ) {
	        	if ($j(this).hasClass( "active" )) {
	            	_this.colour = $j(this).data("colorCode");
	            }
	        });
    	} else {
    		currentTool = "default";
    		_this.setCursor();
    	}
   });
};

Drawing.prototype.attachStampClick = function(){
    var _this = this;
    $j('body').on('click',"#stamp",function(e) {
        e = e || window.event;

        if ($j("#stamp").hasClass("is-active")) {
	        currentTool = "stamp";
	        currentStamp = "star";
	        _this.setCursor(currentStamp);

	        stampIndexSet = -1;
	        $j('#stampChange li').each(function( index, li ) {
	        	if ($j(this).hasClass( "active" )) {
	            	stampIndexSet = index;
	            	currentStamp = $j(this).data('stampName');
	            	_this.setCursor(currentStamp);
	            }
	        });

	        if (stampIndexSet < 0) {
	        	$j('#stamp'+currentStamp).addClass('active');
	        }
        } else {
        	currentTool = "default";
        	_this.setCursor();
        }
   });
};

Drawing.prototype.deactivatePenColors = function() {
	$j('#penColorChange li').each(function( index ) {
        $j(this).removeClass( "active" );
    });
};

Drawing.prototype.deactivateHighlightColors = function() {
	$j('#highlightColorChange li').each(function( index ) {
        $j(this).removeClass( "active" );
    });
};

Drawing.prototype.attachPenColorClick = function(e) {
    var _this = this;
    $j('#penColorChange li').unbind("click").bind("click", function(e) {
        e = e || window.event;
        var setThisIndex = $j(this).index();
        currentTool = "pen";
        _this.penWidth = 3;
        _this.opacity = 1;
        $j('#penColorChange li').each(function( index ) {
            if (index == setThisIndex) {
                $j(this).addClass( "active" );
                _this.colour = $j(this).data("colorCode");
                _this.setCursor("pen");
            } else {
                $j(this).removeClass( "active" );
            }
        });
    });
};

Drawing.prototype.attachHighlighterColorClick = function() {
    var _this = this;
    $j('#highlightColorChange li').unbind("click").bind("click", function(e) {
        e = e || window.event;
        var setThisIndex = $j(this).index();
        currentTool = "highlighter";
        _this.penWidth = 30;
        _this.opacity = .5;
        $j('#highlightColorChange li').each(function( index ) {
            if (index == setThisIndex) {
                $j(this).addClass( "active" );
                _this.colour = $j(this).data("colorCode");
                _this.setCursor("highlighter");
            } else {
                $j(this).removeClass( "active" );
            }
        });
    });
};

Drawing.prototype.attachStampChangeClick = function() {
    var _this = this;
    $j('#stampChange li').bind("click", function(e) {
        e = e || window.event;
        var setThisIndex = $j(this).index();
        currentTool = "stamp";
        $j('#stampChange li').each(function( index, li ) {
            if (index == setThisIndex) {
                $j(this).addClass( "active" );
                _this.stampName = $j(this).data('stampName');
	    		currentStamp = _this.stampName;
	    		_this.setCursor(currentStamp);
            } else {
                $j(this).removeClass( "active" );
            }
        });
    });
};

Drawing.prototype.clearCanvas = function(){
    if ($j('#canvas').length) {
        var _this = this;
        var cursorHeight = 0; //this is the penHeight
        var pageImage = $j("#theImage");
        var offset = parseInt($j('#book-page').css('marginTop'));
        offset *= offset < 0 ? -1 : 1;
        this.sizeRatio = _this.bookInfo.bookWidth/newPageWidth;
        $j( "svg" ).remove();
        $j("#canvas").attr("style", "position: relative; top:" + offset + "px;")
        this.paper = Raphael("canvas",pageImage.width(),pageImage.height());
        this.paper.setViewBox(0,0,this.bookInfo.bookWidth,Number(this.bookInfo.bookHeight) - cursorHeight,true);
    }
};

Drawing.prototype.attachDrawingCanvas = function () {
    var _this = this;
    var mousedown = false, mouseover = false, newDrawing = false, lastX, lastY, path, pathString;
    $j("#book-page-img").mouseover(function () {
        mouseover = true;
    }).mouseout(function () {
        mouseover = false;
    });
    $j(document)
        .mouseup(function (e) {
            mousedown = false;
            if (($j('#pen').hasClass('is-active') || $j('#highlighter').hasClass('is-active')) && newDrawing && (e.target.nodeName == "svg" || e.target.nodeName == "path")) {
            	_this.saveDrawing(e);
                newDrawing = false;
            }
        })
        .mousedown(function (e) {
            if ((currentTool == "pen" || currentTool == "highlighter") && mouseover) {
                currentStamp = "";
                mousedown = true;
                newDrawing = true;
                _this.opacity = 1;
                if (currentTool == "highlighter")
                    _this.opacity = .5;
                myelement=$j("#canvas");
                var x = (e.pageX - myelement.offset().left + 5) * _this.sizeRatio,
                    y = ((e.pageY - myelement.offset().top) + 7) * _this.sizeRatio;
                pathString = 'M' + x + ' ' + y + 'l0 0';
                path = _this.paper.path(pathString);
                path.attr({
                    'stroke': _this.colour,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'stroke-opacity': _this.opacity,
                'stroke-width': _this.penWidth
                        });

                lastX = x;
                lastY = y;
            } else {
                _this.addStamp(e);
            }
        })
        .mousemove(function (e) {
            if (currentTool == "pen" || currentTool == "highlighter") {
                if (!mousedown) {
                    return;
                }
                newDrawing = true;
                myelement=$j("#canvas");
                var x = (e.pageX - myelement.offset().left + 5) * _this.sizeRatio,
                    y = ((e.pageY - myelement.offset().top) + 7) * _this.sizeRatio;
                pathString += 'l' + (x - lastX) + ' ' + (y - lastY);
                path.attr('path', pathString);

                lastX = x;
                lastY = y;
            }
        });
}

Drawing.prototype.clickElement = function (e, id) {
    var elt =$j('#' + id);
    var offset = elt.offset();
    return e.pageX >= offset.left && e.pageX <= (offset.left + elt.width()) && e.pageY >= offset.top && e.pageY <= (offset.top + elt.height());
}

Drawing.prototype.saveDrawing = function(e) {
	var allRectElements = $j( "path" );
	var path = $j( "svg" ).find( allRectElements ).last();
	var colorCode = path.attr('stroke');
	var drawingPath = path.attr('d');
	var colorId = '';
	if ($j( "#highlighter" ).hasClass('is-active')) {
		$j('#highlightColorChange li').each(function( index ) {
            if ($j(this).hasClass( "active" )) {
                colorId = $j(this).data("colorId");
            }
        });
	} else if ($j( "#pen" ).hasClass('is-active')) {
		$j('#penColorChange li').each(function( index ) {
            if ($j(this).hasClass( "active" )) {
                colorId = $j(this).data("colorId");
            }
        });
	}

	if (drawingPath) {
	   var urlPost="/main/"+this.getDrawingService()+"/action/saveDrawing";
		$j.ajax({
		    type: "POST",
		    url: urlPost,
		    data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: $j('#pageNumber').val(), drawing_type_color_id: colorId , drawing_path: drawingPath, stamp_name: currentStamp },
		    success: function(response) {
		    	path.attr('id', response.bookCanvasIllustrationId);
		    }
		});
	}
};

Drawing.prototype.getBookDrawing = function(e) {
	var _this = this;
    var urlPost="/main/"+_this.getDrawingService()+"/action/getBookDrawing";
    var pageNumber = $j('#theImage').attr('src').split("page-")[1].split(".")[0];
    if ($j('#readResourceDeploymentId').val()) {
	    $j.ajax({
		    type: "POST",
		    url: urlPost,
		    data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: pageNumber },
		    success: function(response) {
		    	var results;
		    	_this.clearCanvas();
		    	$j.each(response, function(key, value){
		    		if (value != null) {
			    	    $j.each(value, function(nextKey, nextValue){
			    	        if ($j.isNumeric(nextKey)) {
			    	        	results = nextValue;
			    	        }
			    	    });
		    		}
		    	});

                if (results) {
			    	for (var bookCanvasIllustrationId in results) {
			    		if (bookCanvasIllustrationId) {
			    			switch (results[bookCanvasIllustrationId].drawing_type_id) {
				    			case '1':
				    				path= makeSVG('path', {fill:"none", 'stroke': results[bookCanvasIllustrationId].drawing_type_color_code, 'stroke-width': 3, d: results[bookCanvasIllustrationId].drawing_path});
				    				path.setAttribute('id',bookCanvasIllustrationId);
				    				$j( "svg" ).append(path);
				    				break;
				    			case '2':
				    				path= makeSVG('path', {id:bookCanvasIllustrationId, fill:"none", 'stroke': results[bookCanvasIllustrationId].drawing_type_color_code, 'stroke-width': 30, 'stroke-opacity': .5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: results[bookCanvasIllustrationId].drawing_path});
				    				path.setAttribute('id',bookCanvasIllustrationId);
				    				$j( "svg" ).append(path);
				    				break;
				    			case 3:
				    				if (studentBook != undefined) {
				    					_this.displayStamp(bookCanvasIllustrationId, results[bookCanvasIllustrationId].drawing_path, results[bookCanvasIllustrationId].stamp_name);
				    				}
				    				break;
				    			default:
				    				break;
			    			}
			    		}
			    	}
		    	}
		    }
		});
    }
};

Drawing.prototype.displayStamp = function(bookCanvasIllustrationId, drawingPath, stampName) {
    var sizeRatio = naturalPageWidth/newPageWidth;
	var positionXY = drawingPath.split(',');
    var o = {
        left: (positionXY[0]),
        top: (positionXY[1])
    };
    var stampUrl = "/shared/images/ebook_html5/";
    var stampId;
    switch (stampName) {
		case 'star':
		    stampUrl += "stamp-star.png";
		    stampId = "star-" + bookCanvasIllustrationId;
	   		 break;
		case 'arrow':
	        stampUrl += "stamp-arrow.png";
	        stampId = "arrow-" + bookCanvasIllustrationId;
			break;
		case 'checkmark':
	        stampUrl += "stamp-checkmark.png";
	        stampId = "checkmark-" + bookCanvasIllustrationId;
			break;
		case 'question':
	        stampUrl += "stamp-question.png";
	        stampId = "question-" + bookCanvasIllustrationId;
			break;
		case 'smiley':
	        stampUrl += "stamp-smiley.png";
	        stampId = "smiley-" + bookCanvasIllustrationId;
			break;
	    default:
	}
    var stamp = this.paper.image(stampUrl, Number(o.left), Number(o.top), 28 * sizeRatio, 28 * sizeRatio);
    stamp[0].setAttribute('id', stampId);
};


function makeSVG(tag, attrs) {
    var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}


var t = -0.5
Drawing.prototype.addStamp = function(e){
    if (this.clickElement(e, 'theImage') && !this.clickElement(e, 'stampChange')) {
        function getStampOffset (x) {
            var m = 19.008227539062503;
            var b = 0.9468994140624964;
            return m*x + b;
        }
        var _this = this;
        var sizeRatio = naturalPageWidth/newPageWidth;
        var pageOffset = $j('#theImage').offset();
        var o = {
            left:  (e.pageX  - pageOffset.left) * sizeRatio,
            top: (e.pageY - pageOffset.top) * sizeRatio
        };
    	var drawingTypeId = 3;
    	var colorCode = null;
    	var drawingPath = o.left + "," + o.top ;
    	var bookCanvasIllustrationId = '';
    	if (drawingPath && $j("#stamp").hasClass("is-active")) {
    	    var urlPost="/main/"+_this.getDrawingService()+"/action/saveDrawing";
    		$j.ajax({
    		    type: "POST",
    		    url: urlPost,
    		    data: { resource_deployment_id: $j('#readResourceDeploymentId').val(), page_number: $j('#pageNumber').val(), drawing_type_color_id: $j("li .nav-item .active").data("colorId") , drawing_path: drawingPath, stamp_name: currentStamp },
    		    success: function(response) {
    		    	if (response.stampName) {
    		    		bookCanvasIllustrationId = response.bookCanvasIllustrationId;
    		    	    var stampUrl = "/shared/images/ebook_html5/";
    		    	    var stampId;  
    	                if ($j("#stampstar").hasClass('active')) {
    	                    stampUrl += "stamp-star.png";
    	                    stampId = "star-" + bookCanvasIllustrationId;
    	                } else if ($j("#stamparrow").hasClass('active')) {
    	                    stampUrl += "stamp-arrow.png";
    	                    stampId = "arrow-" + bookCanvasIllustrationId;
    	                } else if ($j("#stampcheckmark").hasClass('active')) {
    	                    stampUrl += "stamp-checkmark.png";
    	                    stampId = "checkmark-" + bookCanvasIllustrationId;
    	                } else if ($j("#stampquestion").hasClass('active')) {
    	                    stampUrl += "stamp-question.png";
    	                    stampId = "question-" + bookCanvasIllustrationId;
    	                } else if ($j("#stampsmiley").hasClass('active')) {
    	                    stampUrl += "stamp-smiley.png";
    	                    stampId = "smiley-" + bookCanvasIllustrationId;
    	                }
    	                var stamp = _this.paper.image(stampUrl, o.left, o.top, 28 * sizeRatio, 28 * sizeRatio);
    	                stamp[0].setAttribute('id', stampId);
    		    	}
    		    }
    		});
    	}
    }
};

Drawing.prototype.setCursor = function(stampName) { 
    
    switch (currentTool) { 
        case "pen":
            cursorUrl = "url(/shared/images/ebook_html5/cursor-pencil.cur), auto";
        	$j('#book-page-img').css('cursor', cursorUrl);
             break;
        case "highlighter":
            cursorUrl = "url(/shared/images/ebook_html5/cursor-highlighter.cur), auto";
        	$j('#book-page-img').css('cursor', cursorUrl);
             break;
        case "stamp":
            cursorUrl = "url(/shared/images/ebook_html5/cursor-stamp-"+stampName+".cur), auto";
            $j('#book-page-img').css('cursor', cursorUrl);
             break;
        default:
        	$j('#book-page-img').css('cursor', 'default');
        	break;
    }
    
};
