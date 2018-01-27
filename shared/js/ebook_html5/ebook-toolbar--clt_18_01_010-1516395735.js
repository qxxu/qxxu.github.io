var Toolbar = function(bookInfo, status) {
    var _this = this;
    this.bookInfo = bookInfo;
    this.attachToolbarClick();

    var toolbarHeight = 46;
    if (($j("#eBookMenuDefaultOn").val() == 1 || status) && !setIsInIframe()) {
        $j("#toolbar")
        	.addClass("is-open")
        	.css({top: "0"});
    } else if(setIsInIframe()) {
		$j("#toolbar")
			.removeClass("is-open")
			.css({top: "-" + toolbarHeight + "px"});

		$j("#toolbar").hide();
		$j('#toolbarToggle').hide();
	} else {
    	$j("#toolbar")
    		.removeClass("is-open")
    		.css({top: "-" + toolbarHeight + "px"});
    }

    $j(window).on('beforeunload', function() {  
        _this.setToolbarStatus();
    });
};

Toolbar.prototype.attachToolbarClick = function(e) {
    e = e || window.event;  
    var _this = this;
    
    var toolbarHeight = 46;
    // when you click on the toolbar toggle
	$j("#toolbarToggle").click(function() {
        if ($j(this).hasClass('disabled')) {
            return;
        }
        
        // if the toolbar is open, close it
		if ($j("#toolbar").hasClass("is-open")) {
			$j("#toolbar")
				.animate({top: "-" + toolbarHeight}, 200)
                .removeClass("is-open");
				
		// if the toolbar is closed, open it	
		} else {
			$j("#toolbar")
				.addClass("is-open")
				.animate({top: "0"}, 200);
		}
        
        // close any open toolboxes
		$j(".toolbox.is-open").parent(".nav-item").find(".toolbox-subnav")
			.animate({width: "0"}, 300)
			.removeClass("is-open");
		$j(".toolbox.is-open").removeClass("is-open");
	});
    
	// when you click on the toolbar toggle or page navigation
    $j("#toolbarToggle, #back-page, #forward-page").click(function() {
 
    	// de-activate any active tools
		$j(".tool.is-active")
			.removeClass("is-active")
            .removeClass("is-open");
			
		// close any open tools (not toolboxes)
	    $j(".nav-toolbar .subnav").hide();
		
		// hide the word journal
		$j('#journalEdit').css('display','none');
		
		currentTool = "default";
		_this.bookInfo.bookDrawing.setCursor("default");
        $j(".nav-item").each(function() {
            $j(this).removeClass('active');
            $j(this).removeAttr('style');
        });
    });
	
    // when you click on a toolbox
    $j(".toolbox").click(function(e) {
        if ($j(this).hasClass('disabled')) {
            return;
        }
		if ($j(this).attr('id') == "drawing-tools" || $j(this).attr('id') == "recorder") {
			if ($j('#journalEdit').css('display') != 'none') {
				$j('#journalEdit').css('display','none');
			}
			if ($j('#noteEdit').css('display') != 'none') {
				$j('#noteEdit').css('display','none');
			}
			currentTool = "default";
			_this.bookInfo.bookDrawing.setCursor("default");
	        $j(".nav-item").each(function() {
	            $j(this).removeClass('active');
	            $j(this).removeAttr('style');
	        });
		}
		
		var notThisToolbox = $j(".toolbox").not( $j(this) );
		var notThisToolboxSubnav = $j(".toolbox-subnav").not( $j(this).parent(".nav-item").find(".toolbox-subnav") );
		
		// close all other open toolboxes
		if (notThisToolbox.hasClass("is-open")) {
			notThisToolbox.removeClass("is-open");
			notThisToolboxSubnav
				.animate({width: "0"}, 300)
                .removeClass("is-open");
		}	
				
		if (!$j(this).attr("disabled")) {
			var toolboxSubnav = $j(this).parent(".nav-item").find(".toolbox-subnav");
			
			// if the toolbox is open, close it
			if ($j(this).hasClass("is-open")) {
                if ($j(this).attr('id') == "recorder") {
                    $j('.recorder_container').hide();
                    $j('.recorder_container').offset.left = $j('.toolbox-subnav').offset.left;
                }
				$j(this).removeClass("is-open");
				toolboxSubnav
					.animate({width: "0"}, 300)
                    .removeClass("is-open");
					
			// if the toolbox is closed, open it	
			} else {
                if ($j(this).attr('id') == "recorder") {
                    $j('.recorder_container').show();
                    $j('.recorder_container').offset.left = $j('.toolbox-subnav').offset.left;
                }
				var animationWidth = toolboxSubnav.children("ul").css("width");
				$j(this).addClass("is-open");
				toolboxSubnav
					.addClass("is-open")
					.animate({width: "+" + animationWidth}, 300);
			}
			
		}
		
		$j('#canvas').removeClass('is-drawing');
		
		// de-activate and close all tools
		$j(".tool.is-active").removeClass("is-active");
		$j(".tool.is-open").removeClass("is-open");
	    $j(".nav-toolbar .subnav").hide();
    });
    
    // when you click on a tool
    $j(".tool").not(".tool-recorder, .js-undo, .js-recorder .tool").click(function() {

        if ($j(this).hasClass('disabled')) {
            return;
        }
        
        // close any other open subnavs
    	$j(".subnav").not( $j(this).parent(".nav-item").find(".subnav") ).hide();
        $j(".tool.is-open").not(this).removeClass("is-open");

    	var notThisToolbox = $j(".nav-item").not( $j(this).parents(".nav-item") ).find(".toolbox");
    	var notThisToolboxSubnav = $j(".nav-item").not( $j(this).parents(".nav-item") ).find(".toolbox-subnav");
    	
    	// close any toolboxes that the current tool does not belong to
    	if (notThisToolbox.hasClass("is-open")) {
    		notThisToolbox.removeClass("is-open");
    		notThisToolboxSubnav
    			.animate({width: "0"}, 300)
                .removeClass("is-open");
    	}	
    	
    	// if this tool has an open subnav
        if ( ($j(this).parent(".nav-item").has(".subnav").length) && ($j(this).hasClass("is-active")) ) {

        	// close the subnav
            $j(this).parent(".nav-item").find(".subnav").slideUp("fast");
            $j(this).removeClass("is-open");
            
            if ($j("#noteEdit").css('display') == 'block') {
                $j("#add-note").removeClass("is-active");
                $j("#noteEdit").toggle();
            } else if ($j(this).attr('id') == "pen" || $j(this).attr('id') == "highlighter" || $j(this).attr('id') == "stamp") {
                currentTool = "default";
                $j("#book-page-img").css('cursor','default');
            }
        
        // if the tool has a closed subnav    
        } else if ( $j(this).parent(".nav-item").has(".subnav").length ) {
        	
        	// open the subnav
    		$j(this).parent(".nav-item")
    			.find(".subnav")
    			.slideDown("fast");
            $j(this).addClass("is-open");
        }     

        if (!$j(this).attr("disabled")) {
			$j(".tool").not(this).removeClass("is-active");
	        $j(this).toggleClass("is-active");
	    	if ($j(this).attr('id') == "add-note" && $j("#journalEdit")
	    		.is(':visible')) {$j("#journalEdit").toggle();
	        }
	    	var toolIsActive = false;
	    	$j(".tool").each(function() {
                if ($j(this).hasClass("is-active")) {
                    toolIsActive = true;
                }
            });
	    	if (toolIsActive)
	    	    $j('#canvas').addClass('is-drawing');
	    	else
	    	    $j('#canvas').removeClass('is-drawing');
		}
        
    });
    
    // when you click on the note icon
    $j("#noteImg").click(function() {
        if ($j(this).hasClass('disabled')) {
            return;
        }
        
        // close any open toolboxes
	    $j(".toolbox.is-open").parent(".nav-item").find(".toolbox-subnav")
	    	.animate({width: "0"}, 300)
            .removeClass("is-open");
	    $j(".toolbox.is-open").removeClass("is-open");
	    
	    $j(".subnav").hide();
		
    });
    
    // when you click on a tool subnav option (like a highlighter color)
    $j(".nav-toolbar .subnav > .nav-item > .toolOption").click(function() {
    	// close the subnav
    	$j(this).parents(".subnav")
    		.slideUp("fast");
    	$j(this).parents(".nav-item").find(".tool")
    		.removeClass("is-open");
    });
 
};

Toolbar.prototype.updateToolbarRecordingStatus = function (recordingIsActive) {
    $j('#toolbar .toolbarToggle,#toolbar .nav-item,#toolbar .toolbox,#toolbar .tool,#noteImg').toggleClass('disabled', recordingIsActive);    
};

Toolbar.prototype.disableDrawingTools = function () {
	$j('.toolbox-subnav-drawing .nav-item a').toggleClass('disabled');
};

Toolbar.prototype.enableDrawingAndNoteTools = function () {
	if(!isPreview) {
		$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").removeAttr('disabled');
		$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a,#add-note").removeClass('disabled');
	} else {
		$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a").attr('disabled', false);
		$j("#drawing-tools,.toolbox-subnav-drawing .nav-item a").removeClass('disabled');
		$j("#add-note").removeAttr('disabled');
		$j("#add-note").removeClass('disabled');
	}
};

Toolbar.prototype.setToolbarStatus = function () {
	if(!isPreview) {
		$j.ajax({
			type: "GET",
			url: "/main/EBookService/action/setToolbarStatus/resource_deployment_id/" + $j('#resource_deployment_id').val() + "/status/" + $j("#toolbar").hasClass("is-open")
		});
	}
};
