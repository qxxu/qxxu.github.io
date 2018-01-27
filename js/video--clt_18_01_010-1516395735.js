window.clg = window.clg || {};
window.clg.video = window.clg.video || {};

(function(ns, $) {

    ns.swfVideoComplete = function(obj) {
        if (obj.newstate == 'COMPLETED') {
            clg.video.completeVideoActivity();
        }
    }

    ns.completeVideoActivity = function(scienceLevelId) {
        var resourceDeploymentId =  $('#videoResourceDeploymentId').val();

        $.ajax({
            url: "/main/RecordStudentNonQuizActivityCompletion/resource_deployment_id/" + resourceDeploymentId,
            success: function () {
                window.location.replace("/main/ActivityReward/id/" + resourceDeploymentId);
                return false;
            }
        });
    }


})(window.clg.video, jQuery);

// If student is using IE8 (or another browser that doesn't support mp4), we add a listener so we can capture when video is complete.
function playerReady(p) {  // called when swf player is ready
    var player = document.getElementById(p.id);
    player.addModelListener("state", "clg.video.swfVideoComplete");
}

