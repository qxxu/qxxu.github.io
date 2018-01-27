
/*****************************************************************
 * 
 * Word Journal Class and functions
 * 
 ****************************************************************/
var WordJournal = function(bookInfo) {
    var _this = this;
    _this.data = bookInfo;
    this.service = 'EBookAjaxWebView';
    if(isPreview) {
        this.service = 'WordJournalServiceForPreview';
    }
    this.journalData;
    this.getJournalData();
    this.attachJournalDataClick()
    this.attachWordJournalClick();
};


WordJournal.prototype.attachWordJournalClick = function(e) {
    var _this = this;
    mouseOverWordJournalElement = false; 
    mouseOverJournalElement = false; 
    
    $j('#journal').on('mouseenter', function() {
        mouseOverJournalElement = true; 
    }).on('mouseleave', function() { 
    	mouseOverJournalElement = false; 
    });
    $j('#journal').bind("click", function(e) {
        if ($j(this).hasClass('disabled')) {
            return;
        }
        if (mouseOverJournalElement){
	         currentTool = "journal";
	        $j("#book-page-img").css('cursor','default');
	        $j("#journalEdit").toggle();
	        if ($j("#noteEdit").is(':visible')) {
	           $j("#noteEdit").toggle();
		    }
        }
    });
    $j('#journalEdit').on('mouseenter', function() {
        mouseOverWordJournalElement = true; 
    }).on('mouseleave', function() { 
    	mouseOverWordJournalElement = false; 
    });
 
    $j('body').on('click', function(e) {
    
          if (!mouseOverJournalElement&&!mouseOverWordJournalElement &&$j('#journalEdit').css('display') && $j('#journalEdit').css('display') == 'block'&&$j(e.target).parent() != null && e.target.nodeName != "OPTION")  {
        	  	$j('#journalEdit').css('display', 'none');
        	    $j('#journalEdit').removeClass('is-active');
        	    $j('#journal').removeClass('is-active');
        	    $j('#canvas').removeClass('is-drawing');
        	    $j(".accordion-section-content").not($j(this).siblings(".accordion-section-content"))
            	.slideUp("fast");
        	    $j(".accordion-section-title").not($j(this)).removeClass("is-open");
                
                $j(this).toggleClass("is-open");
                _this.data.isStartTimeInJournal = false;
                _this.data.timeInJournal += (Date.now() - _this.data.startTimeInJournal);
               }
    });
    	
    $j('#journalClose').bind("click", function(e) {
        $j("#journalEdit").toggle();
        $j("#journal").removeClass("is-active");
        $j('#canvas').removeClass('is-drawing');
    });
};

WordJournal.prototype.setJournalEditValues = function(formDivId, idIndex) {
    var formToEdit = $j('#'+formDivId+'-'+idIndex).text();
    var formToEditParts = formToEdit.split(":");
    if (formToEditParts[0] != 'null' && formToEditParts[0] != '') {
    	if (formDivId == "part_of_speech") {
    		$j('#'+formDivId+' > option').each(function() {
    			if ($j(this).text() == formToEdit)
    				$j(this).attr('selected','selected');
    		});
    	} else {
    		$j('#'+formDivId).val(formToEditParts[0]);
    	}
    } else {
        $j('#'+formDivId).val('');
    }
};

WordJournal.prototype.getJournalData = function(callback) {
    $j.ajax({
        url :  '/main/' + this.service + '/action/getJournalWords/id/' + $j('#resource_deployment_id').val(),
        type: "GET",  
        success: function ( responseText ) {
            $j('#journalContent').html(responseText);
            $j('#journalFormElements').hide();
            if (callback)
                callback();
        }
    }); 
    return false;
};


WordJournal.prototype.addWordToJournal = function(word) {
    $j('#journal').click();
    if ($j('#journal').hasClass('is-active')) {
    	$j('#journalEdit').css('display','block');
    } else {
    	$j('#journalEdit').css('display','none');
    }
    if (!$j('#createWord').hasClass('is-active')) {
        $j('#createWord').click();
    }
    $j('#word').val(word);
};

WordJournal.prototype.attachJournalDataClick = function () {
    var _this = this;
    $j('body').on('click','input[id^="edit-"]',function(e) {
        e.preventDefault();
        $j('#journalFormElements').show();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        $j('#word').val($j('#word-'+idIndex).text());
        $j('#word_journal_id').val(idIndex);
        
        WordJournal.prototype.setJournalEditValues("definition", idIndex);
        WordJournal.prototype.setJournalEditValues("sentence", idIndex);
        WordJournal.prototype.setJournalEditValues("part_of_speech", idIndex);
        WordJournal.prototype.setJournalEditValues("synonym", idIndex);
        WordJournal.prototype.setJournalEditValues("antonym", idIndex);
        $j('#createWord').removeClass("btn-alt").addClass("is-active");
        $j('#createWord').text("Edit Word");
        $j('#accordion').hide();
        $j('#journalFormElements').show();
        $j('#submitWordJournal').val("Save Word");
        
        return false;
    }); 
    
    $j('body').on('click','a[id^="delete-"]',function(e) {
        e.preventDefault();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        var x = "delete-" + idIndex;
        var deleteBtn = "deleteBtn-" + idIndex;
        $j("a[id^="+x+"]").hide();
        $j("a[id^="+deleteBtn+"]").show();
        
        return false;
    });
    
    $j('body').on('click','input[id^="deleteJournalWord-"]',function(e) {
        e.preventDefault();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        $j.ajax({
            url :  '/main/' + _this.service + '/action/deleteJournalWord',
            type: "POST", 
            data: { resource_deployment_id:$j('#resource_deployment_id').val(), word_journal_id:idIndex },
            success: function ( data ) {
                $j('#journalContent').html(data);
                $j('#journalFormElements').hide();
            }
        }); 
        return false;
    });
    
    $j('body').on('click','input[id^="cancelDeleteJournalWord-"]',function(e) {
        e.preventDefault();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        var x = "delete-" + idIndex;
        var deleteBtn = "deleteBtn-" + idIndex;
        $j("a[id^="+x+"]").show();
        $j("a[id^="+deleteBtn+"]").hide();
        return false;
    });
    
    (function () {
    	var waitingForResponse = false;
	    $j('body').on('click','#submitWordJournal',function(e) {
	    	if (waitingForResponse)
	    		return;
	        if ($j('#word').val()) {
	            waitingForResponse = true;
		        e.preventDefault();
		        $j.ajax({
		            url :  '/main/' + _this.service + '/action/saveJournalWord',
		            type: "POST", 
		                data: { resource_deployment_id: $j('#resource_deployment_id').val(), word_journal_id: $j('#word_journal_id').val(), word: $j('#word').val(), definition: $j('#definition').val(), sentence: $j('#sentence').val(), part_of_speech: $j('#part_of_speech').val(), synonym: $j('#synonym').val(), antonym: $j('#antonym').val() },
		            success: function ( data ) {
		                $j('#journalContent').html(data);
		                $j('#journalFormElements').hide();
		                waitingForResponse = false;
		                return false;
		            }
		        }); 
	        }
	        return false;
	    });
    })();
    
    $j('body').on('click','#clearJournalWord',function(e) {
        e.preventDefault();
        $j('#wordJournalForm').trigger("reset");
        $j('input[name="wordId"]').val('');
        return false;
    });
    
    $j('body').on('click','#createWord',function(e) {
        $j("#wordJournalForm").trigger('reset');
        $j("#word_journal_id").val('');
        e.preventDefault();
            $j('#journalFormElements').toggle();
        $j('#accordion').toggle();
            $j('#createWord').toggleClass("btn-alt").toggleClass("is-active");
        if ($j('#accordion').css('display') == 'none' && $j('#journalFormElements').css('display') == 'block') {
            $j('#createWord').text("Add New Word");
        } else if ($j('#accordion').css('display') == 'block' && $j('#journalFormElements').css('display') == 'none') {
            $j('#createWord').text("Add New Word");
        }
        
        return false;
    });
    
    $j('body').on('click','#cancelJournalWord',function(e) {
        e.preventDefault();
        $j('#journalFormElements').hide();
        $j('#accordion').toggle();
        $j('#createWord').show();
        $j('#createWord').addClass("btn-alt").removeClass("is-active");
        $j('#createWord').text("Add New Word");
        return false;
    });
}
