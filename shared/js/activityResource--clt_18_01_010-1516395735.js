function toggleQuizContent(){
    activity.toggleQuizContent();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function setIsInIframe() {
    var recordingIframeElt;
    try {
        recordingIframeElt = $j("#activityPreviewIframeForRecordingReview", parent.document);
    } catch (err) {
        return false;
    }
    if(recordingIframeElt.length) {
        return true;
    } else {
        return false;
    }
}

function objectLength(obj) {
    //work around for i.e. not support Object.keys
    var i, count = 0;
    for (i in obj) {
        if (obj.hasOwnProperty(i)) ++count;
    }
    return count;
}


function createProgressList(numberQuestions) {
    for(var i = 0; i < numberQuestions; ++i) {
        if (i == 0) {
            $j("#progressList").append("<li class='selected'></li>")
        } else {
            $j("#progressList").append("<li></li>")
        }
    }
}

function incrementProgressList(index) {
    if(index > 0) {
        var previous = $j("#progressList li").get(index - 1);
        $j(previous).removeClass("selected");
    }
    var current = $j("#progressList li").get(index);
    $j(current).addClass("selected");
}

$j(document).ready(function() {
    var book = $j(".new #activityObject");
    $j(".ebookHeader").show();
    $j(book).show();
});


