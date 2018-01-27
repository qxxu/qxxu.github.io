
/*****************************************************************
 * 
 * Reflections Journal Class and functions
 * 
 ****************************************************************/
var ReflectionsJournal = function() {
    var _this = this;
    this.service = 'EBookAjaxWebView';
    if(isPreview) {
        this.service = 'WordJournalServiceForPreview';
    }
    this.getReflectionsJournalData(); //create ajax proxy
    this.attachReflectionsDataClick(); 
    ReflectionsJournal.prototype.setReflectionListDisplay();
};

ReflectionsJournal.prototype.getReflectionsJournalData = function(callback) {
    $j.ajax({
        url :  '/main/' + this.service + '/action/getJournalReflections/id/' + $j('#resource_deployment_id').val(),
        type: "GET",  
        success: function ( responseText ) {
            $j('#reflectionsJournalContent').html(responseText);
            $j('#reflectionsFormElements').hide();
            ReflectionsJournal.prototype.setReflectionListDisplay();
            $j('#reflection-' + $j(current_reflection_journal_id).val() + ' a').click();
            $j('a[href="#reflectionsJournalEdit"]').one( "click", function() {
            	  $currentReflection = $j('#reflection-' + $j(current_reflection_journal_id).val());
                  $accordion = $j('#reflectionsAccordion');
                  if($currentReflection && $currentReflection.offset() && $accordion.offset()){
                	  $accordion.scrollTop( $currentReflection.offset().top - $accordion.offset().top);
                  }
            });
           
            if (callback)
                callback();
        }
    }); 
    return false;
};

ReflectionsJournal.prototype.setReflectionListDisplay = function () {

	if($j('#reflectionsAccordion > div.accordion-section').filter(function() {
	    return $j(this).css('display') != 'none';}).length == 0){
		$j('#exampleReflection').show();
	}else{
		$j('#exampleReflection').hide();
	}
}

ReflectionsJournal.prototype.setErrorMessage = function (missingReflection) {
	$j('#reflectionMessage').toggle(missingReflection);
	$j('#reflection').toggleClass('warningHighlight', missingReflection);
}

ReflectionsJournal.prototype.attachReflectionsDataClick = function () {
    var _this = this;
    
    $j('body').on('click','input[id^="editJournalReflection-"]',function(e) {
       
        e.preventDefault();
        $j('#reflectionsFormElements').show();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        var $createReflection = $j('#createReflection');
        $j('#reflection_journal_id').val(idIndex);
        $j('#reflections_subject_id').val($j('#editJournalReflectionSubject-'+ idIndex).val());
        $j("#reflectionsPlanet").html($j('#editJournalReflectionSubjectName-'+ idIndex).val());
        $j('#reflection_title').html($j('#bookTitle-'+idIndex).text());
        $j('#reflection_author').html($j('#bookAuthor-'+idIndex).text());
        $j('#reflection').val($j('#bookReflection-'+idIndex).text());
        $j('#reflectionsFilter').hide();
        
        $createReflection.removeClass("btn-alt").addClass("is-active");
        $createReflection.text("Edit Reflection");
    	$createReflection.show();
    	
        $j('#reflectionsAccordion').hide();
        $j('#reflectionsFormElements').show();
        $j('#submitReflection').val("Save Reflection");
        return false;
    }); 
    

    $j('body').on('change','#reflectionsFilterSelect', function(e){
    	ReflectionsJournal.prototype.setReflectionListDisplay();
    	return false;
    });
    
    $j('body').on('click','#createReflection',function(e) {
    	if( ($j(current_reflection_journal_id).val() > 0) && $j('#reflectionsFormElements').css('display') == 'none'){
    		$j('#editJournalReflection-' + $j(current_reflection_journal_id).val()).trigger('click');
    	}else if($j("#createReflection").text() == "Edit Reflection"){
    		$j("#cancelReflection").trigger('click');
    	}else{
    		$j("#reflectionsJournalForm").trigger('reset');
	        $j('#reflectionsFilter').toggle();
	        $j("#reflection_journal_id").val('');
	        $j("#reflectionsPlanet").html($j('#reflections_current_subject_name').val());
	        $j("#reflection_title").html($j('#reflections_current_title_name').val());
	        $j("#reflection_author").html($j('#reflections_current_author_name').val());
	        e.preventDefault();
	        $j('#reflectionsFormElements').toggle();
	        $j('#reflectionsAccordion').toggle();
	        $j('#createReflection').toggleClass("btn-alt").toggleClass("is-active");
	        if (($j('#reflectionsAccordion').css('display') == 'none' && $j('#reflectionsFormElements').css('display') == 'block') || 
	        	($j('#accordion').css('display') == 'block' && $j('#reflectionsFormElements').css('display') == 'none')) {
	        		$j('#createReflection').text( $j(current_reflection_journal_id).val() > 0 ?"Edit Reflection":"Add Reflection");
	        }
    	}
        return false;
    });
    
    $j('body').on('click','input[id^="deleteJournalReflectionConfirm-"]',function(e) {
        e.preventDefault();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        $j.ajax({
            url :  '/main/' + _this.service + '/action/deleteJournalReflection',
            type: "POST", 
            data: { resource_id:$j('#resource_id').val(), reflection_joural_id:idIndex, reflectionsFilterSelect:$j('#reflectionsFilterSelect').val()},
            success: function ( data ) {
                $j('#reflectionsJournalContent').html(data);
                ReflectionsJournal.prototype.setReflectionListDisplay();
                $j('#reflectionsFormElements').hide();
            }
        }); 
        return false;
    });
    
    $j('body').on('click','input[id^="deleteJournalReflection-"], input[id^="cancelDeleteJournalReflection-"]',function(e) {
        e.preventDefault();
        var idParts = this.id.split("-");
        var idIndex = idParts[1];
        var deleteBtn = $j(this);
        $j("#accordion-command-actions-"+idIndex).toggle();
        $j("#accordion-confirm-actions-"+idIndex).toggle();
        return false;
    });
    
    (function () {
    	var waitingForResponse = false;
	    $j('body').on('click','#submitReflection',function(e) {
	    	if (waitingForResponse)
	    		return;
	    	waitingForResponse = true;
	    	var reflectionVal = $j('#reflection').val();
	    	var titleVal = $j('#reflection_title').val();
	    	
	        if (reflectionVal) {
		        e.preventDefault();
		        $j.ajax({
		            url :  '/main/' + _this.service + '/action/saveJournalReflection',
		            type: "POST", 
		                data: { resource_id: $j('#resource_id').val(), reflection_journal_id: $j('#reflection_journal_id').val(),  reflection: $j('#reflection').val(), reflectionSubjectId: $j('#reflections_subject_id').val() },
		            success: function ( data ) {
		                $j('#reflectionsJournalContent').html(data);
		                ReflectionsJournal.prototype.setReflectionListDisplay();
		                $j('#reflectionsFormElements').hide();
		                waitingForResponse = false;
		                return false;
		            }
		        }); 
	        }else{
	        	waitingForResponse = false;
	        	ReflectionsJournal.prototype.setErrorMessage(reflectionVal?false:true);
	        }
	        return false;
	    });
    })();
    
    $j('body').on('click','#cancelReflection',function(e) {
        e.preventDefault();
        var $createReflection = $j('#createReflection');
        
        $j('#reflection_journal_id').val('');
        $j('#reflection_title').val('');
        $j('#reflection_author').val('');
        $j('#reflection').val('');
        $j('#reflections_subject_id').val('');
        $j('#reflectionsFormElements').hide();
        $j('#reflectionsFilter').show();
        $j('#reflectionsAccordion').toggle();
        
        $createReflection.addClass("btn-alt").removeClass("is-active");
        ReflectionsJournal.prototype.setErrorMessage(false);

        if($j(current_reflection_journal_id).val() > 0){
        	$createReflection.text("Edit Reflection");
        	$createReflection.hide();
        }else{
        	$createReflection.text("Add Reflection");
        	$createReflection.show();
        }

        return false;
    });
    
}
