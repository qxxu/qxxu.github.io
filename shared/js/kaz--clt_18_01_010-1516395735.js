window.clg = window.clg || {};
window.clg.razKids = window.clg.razKids || {};

// This function will create hidden inputs for the properties defined
// in inputHash and then submit the form
function createHiddenInputsAndSubmitForm(formObj, inputHash) {
    formObj = $(formObj);

    if (Object.isHash(inputHash)) {
        inputHash.each(function(pair) {
            var element = new Element('input', {
                type : 'hidden',
                name : pair.key,
                value : pair.value
            });
            formObj.appendChild(element);
        });
    }
    formObj.submit();
    // TODO: should probably clear out all child elements in case the form is re-used before reloading the page
}

function updateBookFavorites(module, bookId, studentAccountId, addFavorite) {
    var url ="/main/" + module + "/action/updateBookFavorites/id/" + bookId + "/studentAccountId/" + studentAccountId + "/addFavorite/" + addFavorite;

    var myAjax = new Ajax.Request(url, {
        onSuccess : function(response) {
            var button = '<b>Favorite</b><br>';
            var moduleString = "\'" + module + "\'";

            if (addFavorite) {
                button += '<a href="javascript:"  onclick="updateBookFavorites(' + moduleString + ',' + bookId + ',' + studentAccountId + ', 0);">';
                button += '<img class="favoritesIcon" src="/images/favorites-option-clicked.png" ></img>';
            } else {
                button += '<a href="javascript:"  onclick="updateBookFavorites(' + moduleString + ',' + bookId + ',' + studentAccountId + ', 1);">';
                button += '<img class="favoritesIcon" src="/images/favorites-option.png" ></img>';
            }

            button += '</a>';

            $('favorite').update(button);
        }
    });
}

function updateRunningRecordResources(level, languageId) {
    var url = buildGetRunningRecordResourcesUrl(level, languageId);
    var myAjax = new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(transport) {
            $('runningRecordResources').update(transport.responseText);
        }
    });
}

function buildGetRunningRecordResourcesUrl(level, languageId) {
    var url = "/main/Assign/action/getRunningRecordResources/level/" + level;

    if(languageId) {
        url += "/languageId/"+languageId;
    }
    return url;
}

function updateTestletResources(grade) {
    var url = "/main/Assign/action/getTestletResources/grade/" + grade;

    var myAjax = new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(transport) {
            $('testletResources').update(transport.responseText);
        }
    });
}

function updateReadingLevel(level) {
    $('level').setValue(level);
    var levelObj = $('level-' + level);
    var levelImages = $('levelSelector').descendants();
    levelImages.each(function(item) {
        if (item.match('a') && item.id.startsWith("level-")) {
            item.removeClassName('active');
        }
    });
    levelObj.addClassName('active');
}
/*-------------------------------------------------------------------------------*/

function updateReadingAssignment(selectObj, studentAccountId) {
    updateReadingAssignmentToNewLevel(selectObj, studentAccountId, $F(selectObj), false);
}

function updateReadingAssignmentToNewLevel(selectObj, studentAccountId, newLevel, updateStudentCurrentAssignmentPage) {
    var url = '/main/Assign/action/updateReadingAssignment/level/' + newLevel + '/studentAccountId/' + studentAccountId + (updateStudentCurrentAssignmentPage ? "/getProgressInfo/true" : "");
    if (updateStudentCurrentAssignmentPage) {
        showLoader();
    }

    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            if (updateStudentCurrentAssignmentPage && (response.responseText != null)) {
                var obj = JSON.parse(response.responseText);
                var selfPacedLevelSpanElements = $$('.self_paced_level_span');
                $(selfPacedLevelSpanElements).each(function(elem) {
                    elem.update('self-paced level ' + newLevel);
                });

                $j('#levelChange').val(newLevel).trigger('change');

                var selfPacedLevelBarElements = $$("#self_paced_level_bar a");

                $(selfPacedLevelBarElements).each(function(elem) {
                    var level = elem.innerHTML;
                    if (level == newLevel) {
                        elem.addClassName("active");
                    } else {
                        elem.removeClassName("active");
                    }
                });

                var currentLevelElements = $$(".currentLevel a");

                $(currentLevelElements).each(function(elem) {
                    elem.id = 'level-' + obj.curLevelName;
                    elem.update(obj.curLevelName);
                });

                var nextLevelElements = $$(".nextLevel a");

                $(nextLevelElements).each(function(elem) {
                    elem.id = 'level-' + obj.nextLevelName;
                    elem.update(obj.nextLevelName);
                });

                var taskNumElements = $$(".taskNum");

                $(taskNumElements).each(function(elem) {
                    elem.update(obj.completedTasks + " task" + ((obj.completedTasks != 1) ? "s" : "") + " completed of " + obj.totalTasks);
                });

                var progressChartInnerElements = $$(".progressChartInner");

                $(progressChartInnerElements).each(function(elem) {
                    elem.setStyle({ width : obj.pctTasksComplete + "%" });
                });
            }

            showResponse('success', $(selectObj).up(), 'Successfully updated');
        },
        onFailure : function(response) {
            showResponse('fail', $(selectObj).up());
        },
        onComplete : function(response) {
            if (updateStudentCurrentAssignmentPage) {
                hideLoader();
            }
        }
    });
}

function showLoader() {
    var loaderElem = $('js-loader');

    if (loaderElem != null) {
        loaderElem.show();
    }
}

function hideLoader(){
    var loaderElem = $('js-loader');

    if (loaderElem != null) {
        loaderElem.hide();
    }
}

/*----------------------------JavaScript for Roster pages------------------------*/
function toggleCheck(className, checkObj) {
    var i=$$('input.'+className);
    i.each(function(elem) {
        elem.checked = checkObj.checked;
    });
}
function toggleCheckAll(className, numStudents, checkObj) {
    var i=$$('input.'+className);
    i.each(function(elem) {
        elem.checked = checkObj.checked;
    });
    if (className == 'spanishCheckBox' && checkObj.checked) {
        $('bookroomToggle').checked = true;
        for (var i = 0; i < numStudents; i++) {
            $('is_bookroom_enabled['+i+']').checked = true;
        }
    }
    if (className == 'bookroomCheckBox' && checkObj.checked == false) {
        $('spanishToggle').checked = false;
        for (var i = 0; i < numStudents; i++) {
            $('is_spanish_enabled['+i+']').checked = false;
        }
    }
}

function getToggleSwitch(element) {
    return $j(element).hasClass('toggleOn');
}

function toggleSwitchEnable(element, enable) {
    var OnOff = enable ? 'On' : 'Off';
    var OnOffOpposite = enable ? 'Off' : 'On';
    var jElt = $j(element);
    jElt.addClass('toggle' + OnOff);
    jElt.removeClass('toggle' + OnOffOpposite);
    jElt.html('<strong>' + OnOff + '</strong><span class="toggleSwitchCheckbox"></span>');
}

function toggleSwitchToggle(element) {
    toggleSwitchEnable(element, !getToggleSwitch(element));
}

function toggleCheckbox(studentId, module, checkboxObj, origState, newState) {
    if (studentId == 'all') {
        $$('a[ref=' + module + ']').each(function(item){
            item.update('<strong>' + newState + '</strong><span></span>');
            item.removeClassName('toggle' + origState);
            item.addClassName('toggle' + newState);
        });
    } else {
        checkboxObj.update('<strong>' + newState + '</strong><span></span>');
        checkboxObj.removeClassName('toggle' + origState);
        checkboxObj.addClassName('toggle' + newState);
    }
}

function updateBookroomStatus(studentId, checkboxObj) {
    itemLength = checkboxObj.name.length;
    var spanishObjectIndex = "is_spanish_enabled["+checkboxObj.name.substr(checkboxObj.name.indexOf("[")-(itemLength-1),(checkboxObj.name.indexOf("]")-checkboxObj.name.indexOf("["))-1)+"]";
    var checked = $(checkboxObj).checked ? true : false;
    var url = '/main/Roster/action/updateBookroomStatus/studentId/' + studentId + '/checked/' + checked;
    var msg;
    if (!checked) {
        var languages_by_name = ["English", "Spanish", "French", "Polish", "Ukrainian", "Vietnamese"];
        var languages_by_name_count = languages_by_name.length;

        // Remove each language collection
        for (var i = 0; i < languages_by_name_count; ++i) {
            var request_url = '/main/Roster/action/update' + languages_by_name[i] + 'Status/studentId/' + studentId + '/bookroomConfig/false/checked/' + checked;
            new Ajax.Request(request_url, {
                method : 'get',
                onSuccess : function(response) {
                },
                onFailure : function(response) {
                }
            });
        }
    }

    if(studentId == 'all') {
        msg = checked ? 'All successfully added' : 'All successfully removed';
    } else {
        if (!checked) {
            Field.disable(spanishObjectIndex);
            $(spanishObjectIndex).checked = false;
            Field.enable(spanishObjectIndex);
        }
        msg = checked ? 'Successfully added' : 'Successfully removed'
    }
    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            showResponse('success', $(checkboxObj).up(), msg);
        },
        onFailure : function(response) {
            showResponse('fail', $(checkboxObj).up());
        }
    });
}

function updateSpecificLanguageBookroomStatus (studentId, bookroomConfig, studentLevel, checkboxObj, language_type) {
    itemLength = checkboxObj.name.length;
    var bookroomObjectIndex = "is_bookroom_enabled["+checkboxObj.name.substr(checkboxObj.name.indexOf("[")-(itemLength-1),(checkboxObj.name.indexOf("]")-checkboxObj.name.indexOf("["))-1)+"]";
    var checked = $(checkboxObj).checked ? true : false;
    var request_url = '/main/Roster/action/update' + language_type + 'Status/studentId/' + studentId + '/bookroomConfig/' + bookroomConfig + '/level/' + studentLevel + '/checked/' + checked;
    var msg;
    if (bookroomConfig == 'n') {
        //Need to enable bookroom with default collections
        if (checked) {
            Field.enable(bookroomObjectIndex);
            $(bookroomObjectIndex).checked = true;
        }
        var url = '/main/Roster/action/updateBookroomStatus/studentId/' + studentId + '/checked/' + true;
        new Ajax.Request(url, {
            method : 'get',
            onSuccess : function(response) {
            },
            onFailure : function(response) {
            }
        });
    }

    if(studentId == 'all') {
        msg = checked ? 'All successfully added with required Book Room' : 'All successfully removed';
    } else {
        if (bookroomConfig == 'n') {
            msg = checked ? 'Successfully added with required Book Room' : 'Successfully removed'
        } else {
            msg = checked ? 'Successfully added' : 'Successfully removed'
        }
    }

    new Ajax.Request(request_url, {
        method : 'get',
        onSuccess : function(response) {
            showResponse('success', $(checkboxObj).up(), msg);
        },
        onFailure : function(response) {
            showResponse('fail', $(checkboxObj).up());
        }
    });
}

function updateEnglishStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "English");
}

function updateSpanishStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "Spanish");
}

function updateFrenchStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "French");
}

function updatePolishStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "Polish");
}

function updateUkrainianStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "Ukrainian");
}

function updateVietnameseStatus(studentId, bookroomConfig, studentLevel, checkboxObj) {
    updateSpecificLanguageBookroomStatus(studentId, bookroomConfig, studentLevel, checkboxObj, "Vietnamese");
}

function updateQuizRoomStatus(studentId, checkboxObj) {
    var checked = $(checkboxObj).checked ? true : false;
    var url = '/main/Roster/action/updateQuizRoomStatus/studentId/' + studentId + '/checked/' + checked;

    if(studentId == 'all') {
        msg = checked ? 'All successfully added' : 'All successfully removed';
    } else {
        msg = checked ? 'Successfully added' : 'Successfully removed'
    }
    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            showResponse('success', $(checkboxObj).up(), msg);
        },
        onFailure : function(response) {
            showResponse('fail', $(checkboxObj).up());
        }
    });
}

function updateRazRocketStatus(studentId, checked, onCompletion) {
    var url = '/main/Roster/action/updateRazRocketStatus/studentId/' + studentId + '/checked/' + checked;

    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            onCompletion(true);
        },
        onFailure : function(response) {
            onCompletion(false);
        }
    });
}

function updateWritingSetting(studentId, checked, settingType, onCompletion) {
    var url = '/main/Roster/action/updateWritingSetting/studentId/' + studentId + '/settingType/' + settingType + '/checked/' + checked;

    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            onCompletion(true);
        },
        onFailure : function(response) {
            onCompletion(false);
        }
    });
}

function updateAvatarStatus(studentId, checked, onCompletion) {
    var url = '/main/Roster/action/updateAvatarStatus/studentId/' + studentId + '/checked/' + checked;

    new Ajax.Request(url, {
        method : 'get',
        onSuccess : function(response) {
            onCompletion(true);
        },
        onFailure : function(response) {
            onCompletion(false);
        }
    });
}

function updateIsSortByLastName(checkboxObj) {
    var checked = $(checkboxObj).checked ? true : false;
    document.location = '/main/Roster/action/updateIsSortByLastName/checked/' + checked;
}

function rosterChangeStudent(url) {
    var studentID = document.getElementById("studentDropdown");
    var studentIdValue = studentID.value;
    if (studentIdValue.length > 0) {
        document.location = (studentIdValue == '/' ? '/main/Roster' : url + studentIdValue);
    } else {
        studentID.style.background = "#FFFF00";
    }
}

function changeSchool(url) {
    var schoolID = document.getElementById("schoolDropdown");
    var schoolIdValue = schoolID.value;
    if (schoolIdValue.length > 0) {
        document.location = (schoolIdValue == '/' ? '/main/ViewReports/type/subscription' : url + schoolIdValue);
    }
}

function changeClass(url) {
    var classID = document.getElementById("classDropdown");
    var classIdValue = classID.value;
    if (classIdValue.length > 0) {
        document.location = (classIdValue == '/' ? '/main/ViewReports/type/weekly' : url + classIdValue);
    }
}

function changeTeacherFromElt(elt) {
    var newTeacherId = elt.value;

    if (newTeacherId.length > 0) {
        document.location = window.clg.razKids.replaceUrlParam(window.location.href, "teacher", newTeacherId);
    }
}

function changeTeacher() {
    changeTeacherFromElt(document.getElementById("classDropdown"));
}

function onChangeTeacher(event) {
    changeTeacherFromElt(event.target);
}

function toggleChart(chartName) {
    var chart = $(chartName);
    if (chart.style.display == "none") {
        document.studentForm[chartName + 'Collapsed'].value = "false";
    }
    else {
        document.studentForm[chartName + 'Collapsed'].value = "true";
    }
    Effect.toggle($(chartName), 'blind', { duration: 0.4 });
}

function toggleRows() {
    var $elems = $j('#6,#7,#8');
    // hide if any are visible, show otherwise
    $elems.toggle(!$elems.is(':visible'));
}

function updatePassword(radioButton) {
    var passwordText = document.getElementById("passwordInfo");
    if (radioButton == "none") {
        passwordText.innerHTML = "<span style=\"text-decoration: underline\">No password</span>";
    }
    if (radioButton == "text") {
        document.studentForm.password_option[1].checked = true;
        var passwordWidget = document.getElementById("password_text");
        passwordText.innerHTML = "<span style=\"text-decoration: underline\">Password:</span> <span style=\"color: #000\">" + passwordWidget.value;
    }
    if (radioButton == "icon" || radioButton == "one" || radioButton == "two") {
        passwordText.innerHTML = "<span style=\"text-decoration: underline\">Password:</span>";
        for (i = 0; i < passwordIDs.length; i++) {
            if (passwordIDs[i] == 'true') {
                passwordText.innerHTML += '&nbsp;<img src="/images/password_icons/pass-' + i + '-sml.gif" align="absmiddle">';
            }
        }
    }
}

function changePasswordOption() {
    var optionValue = $j('[name=password_option]:checked')[0].value;
    if (optionValue == "text") {
        for(i = 1; i<= 16; i++) {
            var iconElt = $j('#passwordIcon'+i);
            iconElt.removeClass('passActive');
        }
        $j('#passwordIDs')[0].value = 'false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false';
    }
    if (optionValue == "icon") {
        $('password_text').value = '';
    }
    return true;
}

//Toggle icons on and off
function togglePwd(iconID, image) {
    document.studentForm.password_option[2].checked = true;

    if (passwordIDs[iconID] == 'true') {
        image.src = "/images/password_icons/pass-" + iconID + ".gif";
        passwordIDs[iconID] = 'false';
    } else {

        // Only enable a new icon if two icons are not already enabled
        var enabledIconCount = 0;
        for (i = 0; i < passwordIDs.length; i++)
            if (passwordIDs[i] == 'true')
                enabledIconCount++;
        if (enabledIconCount < 2) {
            image.src = "/images/password_icons/pass-" + iconID + "-on.gif";
            passwordIDs[iconID] = 'true';
        } else
            alert("Please remove one of your current password icon selections before adding another.");
    }


    // Update the form field (comma-delimited string)
    document.studentForm["passwordIDs"].value = passwordIDs.toString();
    updatePassword("icon");
}


function mouseOverCell(tableCell, imageID) {
    if (imageID != document.studentForm.user_icon.value){
        tableCell.className = 'mousedover';
    }
}


function mouseOutCell(tableCell, imageID) {
    if (imageID != document.studentForm.user_icon.value){
        tableCell.className = 'selectable';
    }
}

function changeUserIcon(iconCell, iconID) {
    var currentValue = $("user_icon").getValue();
    var currentCell = "cell" + currentValue;
    var screenNameNewIcon = "screen_name_" + iconID;
    var thumbnailSource = "/images/login_icons/"+iconID + "-ico.png";

    removeSelectedRosterIcons();
    if($(currentCell) != null){
        $(currentCell).addClassName("selectable");
    }

    $(screenNameNewIcon).innerHTML = $("screen_name").getValue();
    var thumb = $("loginIconThumbnail");
    if (thumb) {
        thumb.setAttribute('src', thumbnailSource);
    }
    $(iconCell).addClassName("selected");
    $("user_icon").setValue(iconID);

}

function removeSelectedRosterIcons(){
    $$('.selected').each( function (s){
        s.removeClassName('selected');
        //reset screen name
        $(s).down('span').innerHTML = "";
    });
    $$('.mousedover').each( function (m){
        m.removeClassName('mousedover');
    });

    return true;
}


function updateNameSpan(widget, spanName) {
    document.getElementById(spanName + "_" + document.studentForm.user_icon.value).innerHTML = widget.value;
}

function showResponse(status, container, message) {
    var responseText;
    if (container != null) {
        // first remove any previous responses
        var previousResponseObj = container.down('div.response');
        if (!Object.isUndefined(previousResponseObj)) {
            try {previousResponseObj.remove();} catch(e) {}
        }

        var responseWrapperObj = new Element ('div', {'class': 'response relative zindex100', 'style':'display:none'});
        var responseObj = new Element('div', {'class':'alert alert-' + status });
        responseWrapperObj.insert(responseObj);
        responseWrapperObj.onclick = function() {
            this.remove();
        }
        if (message == undefined) {
            responseText = status == 'success' ? 'Successfully updated' : 'Failed to update';
        } else {
            responseText = message;
        }
        responseObj.update(responseText);
        container.insert(responseWrapperObj);
        responseWrapperObj.appear({
            afterFinish: function() {
                setTimeout(function () {
                    hideResponse(responseWrapperObj.identify());
                }, 1000);
            }
        });
    }
}

function hideResponse(responseObjId) {
    var responseObj = $(responseObjId);
    if (responseObj != null) {
        responseObj.fade({afterFinish: function() {
            try {
                responseObj.remove();
            } catch(e) {} }});
    }
}

function loginStudent(studentId){

    var url = "/main/Login/";

    var form = new Element('form', {method: 'post', action: url});
    form.insert(new Element('input', {name: 'studentID', value: studentId, type: 'hidden'}));

    $(document.body).insert(form);
    form.submit();

}

/*----------------------------JavaScript for Teacher Management of Parent Portal------------------------*/
/*----------------------------Author - jfonte------------------------*/

function setFocusAfterToggle(input) {
    setTimeout(function() {
        $(input).focus();
    }, 450);
}

function reEnable(input) {
    if($(input).disabled == true) {
        $(input).style.backgroundColor = '';
        $(input).style.color='#000000';
        $(input).style.fontStyle = 'normal';
        $(input).disabled = false;
    }
}

function disable(input) {
    $(input).style.backgroundColor = '#C0C0C0';
    $(input).style.color = '#999999';
    $(input).style.fontStyle = 'italic';
    $(input).disabled = true;
}

function clearDefault(field, defaultValue) {
    if($(field).value == defaultValue) {
        $(field).value = '';
    }
}

/*----------------------------JavaScript for Voice Recording------------------------*/
function initVoiceDialog(){
    var voiceDialog = new Element('div', { id: 'voiceDialog', style: 'position: fixed; top: 0px; left: 0px; right: 0px; z-index: 30;' });

    var voiceDialogBackground = new Element('div', { id: 'voiceDialogBackground', style: 'display:none; position: fixed; top: 0px; left: 0px; right: 0px; width: 100%; height: 100%; z-index: 40; background-color: #000000; filter: alpha(opacity = 73); opacity: .73;' });
    voiceDialog.insert(voiceDialogBackground);

    var retellingContent = new Element('div', { id: 'retellingContent', style: 'position: absolute; top: 0px; left: 0px; text-align:center; z-index: 40;' });
    voiceDialog.insert(retellingContent);
    retellingContent.insert(new Element('div', { id: 'retellingSwfDiv' }));

    var voiceCheckContent = new Element('div', { id: 'voiceCheckContent', style: 'position: absolute; top: 0px; left: 0px; text-align:center; z-index: 50;' });
    voiceDialog.insert(voiceCheckContent);
    voiceCheckContent.insert(new Element('div', { id: 'voiceCheckSwfDiv' }));

    var voiceRecorderContent = new Element('div', { id: 'voiceRecorderContent', style: 'position: absolute; top: 0px; left: 0px; text-align:center; z-index: 60;' });
    voiceDialog.insert(voiceRecorderContent);
    voiceRecorderContent.insert(new Element('div', { id: 'voiceRecorderSwfDiv' }));

    $('body').insert({ top : voiceDialog });
}

function showVoiceDialog(swf){
    if (clg && clg.swfRecording && typeof clg.swfRecording.onShowVoiceDialog === "function") {
        clg.swfRecording.onShowVoiceDialog(swf);
    }
    $('voiceDialogBackground').style.display='block';

    if($('bookflash') != null){
        $('bookflash').style.textIndent='-2000000px';
    }
    if($('contentArea') != null){
        $('contentArea').style.textIndent='-2000000px';
    }
    if(swf == 'voiceCheckSwf'){
        $('voiceCheckContent').style.zIndex='50';
        $('retellingContent').style.zIndex='40';
    }
    else if(swf == 'retellingSwf'){
        $('retellingSwf').initialize();
        $('voiceCheckContent').style.zIndex='40';
        $('retellingContent').style.zIndex='50';
    }

    repositionVoiceDialogContent();
    $(swf).style.width='448px';
    $(swf).style.height='380px';
    repositionVoiceDialogContent();

    window.onresize = function() {
        resizeFlash();
        repositionVoiceDialogContent();
    };
}

function expandVoiceRecorderSwf(){
    //Need to account for the race condition with the swf being loaded versus being called from the actionscript side
    if(voiceRecorderSwfLoaded){
        $('voiceRecorderSwf').style.width='215px';
        $('voiceRecorderSwf').style.height='138px';
        repositionVoiceDialogContent();
    }
    else {
        setTimeout("expandVoiceRecorderSwf()", 100);
    }
}

function showVoiceRecorderSwf(){
    //Need to account for the race condition with the swf being loaded versus being called from the actionscript side
    if(voiceRecorderSwfLoaded){
        $('voiceRecorderContent').style.zIndex='60';
        repositionVoiceDialogContent();
    }
    else {
        setTimeout("showVoiceRecorderSwf()", 100);
    }
}

function hideVoiceRecorderSwf(){
    $('voiceRecorderSwf').style.width='1px';
    $('voiceRecorderSwf').style.height='1px';
    $('voiceRecorderContent').style.zIndex='35';
    repositionVoiceDialogContent();
}

function hideVoiceCheckSwf(){
    $('voiceCheckSwf').style.width='1px';
    $('voiceCheckSwf').style.height='1px';
}

function hideVoiceDialog(){
    if (clg && clg.swfRecording && typeof clg.swfRecording.onHideVoiceDialog === "function") {
        clg.swfRecording.onHideVoiceDialog();
    }
    window.onresize = function() {
        resizeFlash();
    };

    $('voiceCheckSwf').style.width='1px';
    $('voiceCheckSwf').style.height='1px';
    $('voiceCheckContent').style.top='0px';
    $('voiceCheckContent').style.left='0px';

    $('voiceRecorderContent').style.top='0px';
    $('voiceRecorderContent').style.left='0px';

    if($('bookflash') != null){
        $('bookflash').style.textIndent='0';
    }
    if($('contentArea') != null){
        $('contentArea').style.textIndent='0';
    }
    $('voiceDialogBackground').style.display='none';
}

function repositionVoiceDialogContent() {
    var viewportHeight = window.top.document.documentElement.clientHeight;
    $('voiceRecorderContent').style.top = new String(Math.floor((viewportHeight / 2) - ($('voiceRecorderContent').clientHeight / 2))) + 'px';
    $('voiceCheckContent').style.top = new String(Math.floor((viewportHeight / 2) - ($('voiceCheckContent').clientHeight / 2))) + 'px';
    $('retellingContent').style.top = new String(Math.floor((viewportHeight / 2) - ($('retellingContent').clientHeight / 2))) + 'px';

    var viewportWidth = window.top.document.documentElement.clientWidth;
    $('voiceRecorderContent').style.left = new String(Math.floor((viewportWidth / 2) - ($('voiceRecorderContent').clientWidth / 2))) + 'px';
    $('voiceCheckContent').style.left = new String(Math.floor((viewportWidth / 2) - ($('voiceCheckContent').clientWidth / 2))) + 'px';
    $('retellingContent').style.left = new String(Math.floor((viewportWidth / 2) - ($('retellingContent').clientWidth / 2))) + 'px';
}

function updateReadRecordingSwf(messageType, messageData) {
    $('readRecordingSwf').notifyReadRecordingSwf(messageType, messageData);
}

function updatePracticeSwf(messageType, messageData){
    $('practiceSwf').notifyPracticeSwf(messageType, messageData);
}

function updateAssessmentSwf(messageType, messageData){
    $('assessmentSwf').notifyAssessmentSwf(messageType, messageData);
}

function updateVoiceCheckSwf(messageType, messageData){
    $('voiceCheckSwf').notifyVoiceCheckSwf(messageType, messageData);
}

function updateRetellingSwf(messageType, messageData){
    $('retellingSwf').notifyRetellingSwf(messageType, messageData);
}

function updateVoiceRecorderSwf(messageType, messageData){
    $('voiceRecorderSwf').notifyVoiceRecorderSwf(messageType, messageData);
}

function startRecording(){
    var swf = null;
    if($('practiceSwf') != null){
        swf = $('practiceSwf');
    }
    else if($('readRecordingSwf') != null){
        swf = $('readRecordingSwf');
    }
    else if($('assessmentSwf') != null){
        swf = $('assessmentSwf');
    }
    swf.startRecording();
}

function attachMicrophone(){
    if(voiceCheckSwfLoaded && ($('voiceDialogBackground').style.display == 'none')){
        $('voiceCheckSwf').gotoLoadingFrame();
        showVoiceDialog('voiceCheckSwf');
    }

    //Need to account for the race condition with the swfs being loaded versus being called from the actionscript side
    if(voiceRecorderSwfLoaded && voiceCheckSwfLoaded && (practiceSwfLoaded || assessmentSwfLoaded || readRecordingSwfLoaded)){
        $('voiceRecorderSwf').attachMicrophone();
    }
    else {
        setTimeout("attachMicrophone()", 100);
    }
}

function showHelp(){
    var newWindow = window.open('https://www.learninga-z.com/help/razkids-audio-recorder.htm', '_LAZInfo');
    newWindow.focus();
}

function doQuitSoundCheckNonAssessment() {
    hideVoiceDialog();
    voiceCheckSwfLoaded = false;
    resetSwfElements('voiceCheck');
    reloadRecorderNoAttach(false);
}

function quitSoundCheck(navigateTo){
    if(navigateTo.substring(0,10) == 'assessment'){
        if ($('.backBtn') && $('.backBtn').attr('href')) {
            window.location = $('.backBtn').attr('href');
        } else {
            window.location = '/main/StudentPortal';
        }
    }
    else {
        //Asynchronously hide the VoiceCheck swf, can't use a closure here!
        setTimeout('doQuitSoundCheckNonAssessment()', 100);
    }
}

function takeQuiz(quizUrl){
    window.location = quizUrl;
}

function goHome(homeUrl){
    window.location = homeUrl;
}

var voiceRecorderSwfLoaded = false;
var voiceCheckSwfLoaded = false;
var assessmentSwfLoaded = false;
var practiceSwfLoaded = false;
var readRecordingSwfLoaded = false;
var retellingSwfLoaded = false;
function markSwfAsLoaded(swf){
    if(swf == 'voiceRecorder') {
        voiceRecorderSwfLoaded = true;
    }
    else if(swf == 'voiceCheck') {
        voiceCheckSwfLoaded = true;
    }
    else if(swf == 'assessment') {
        assessmentSwfLoaded = true;
    }
    else if(swf == 'practice') {
        practiceSwfLoaded = true;
    }
    else if(swf == 'readRecording') {
        readRecordingSwfLoaded = true;
    }
    else if(swf == 'retelling') {
        retellingSwfLoaded = true;
    }
}

function resetSwfElements(name) {
    var swfId = name + 'Swf';
    if ($j('#' + swfId).length) {
        swfobject.removeSWF(swfId);
    }
    var content = $j('#' + name + 'Content');
    if (content.length && !content.find('> #' + name + 'SwfDiv').length) {
        content.append('<div id="' + name + 'SwfDiv"></div>');
    }
}

function reloadRecorderNoAttach(detectedNoSoundFromMic){
    voiceRecorderSwfLoaded = false;
    assessmentSwfLoaded = false;
    practiceSwfLoaded = false;
    readRecordingSwfLoaded = false;

    $j.each(['voiceRecorder', 'practice', 'readRecording', 'assessment'], function (index, value) {
        resetSwfElements(value);
    });

    loadRecorder();
    prepareForRecording(detectedNoSoundFromMic);
}

function reloadRecorder(detectedNoSoundFromMic){
    reloadRecorderNoAttach(detectedNoSoundFromMic);
    attachMicrophone();
}

function prepareForRecording(detectedNoSoundFromMic){
    if(practiceSwfLoaded || assessmentSwfLoaded || readRecordingSwfLoaded){
        var swf = null;
        if($('practiceSwf') != null){
            swf = $('practiceSwf');
        }
        else if($('readRecordingSwf') != null) {
            swf = $('readRecordingSwf');
        }
        else if($('assessmentSwf') != null){
            swf = $('assessmentSwf');
        }
        swf.prepareForRecording(detectedNoSoundFromMic);
    }
    else {
        setTimeout(function(){prepareForRecording(detectedNoSoundFromMic)}, 100);
    }
}


function newTabs(blockId) {
    var blockObj = $(blockId);
    if (blockObj != null) {
        $$('div.ranking').invoke('hide');
        $$('div.newTabs ul li a').invoke('removeClassName', 'active');
        $(blockId + '-link').addClassName('active');
        //setDefaultLanguage(blockId);
        blockObj.show();
    }
    return false;
}

/*----------------------------JavaScript for Super Bookroom ------------------------*/

document.observe('dom:loaded', setupEventHandling);

function setupEventHandling() {
    $$("#collectionMenu li").each(function(item) {
        item.observe('click', onCollectionSelection);
    });
    if ($('megaMenu')) {
        $('megaMenu').observe('mouseover', onMegaMenuMouseOver);
        $('megaMenu').observe('mouseout', onMegaMenuMouseOut);
        setupMenu();
    }
}

function setupMenu() {
    $('collectionMenu').removeClassName('navDisplayHide');
    var collectionId = parseInt($('collectionId').innerHTML);
    var leveledBookLanguageId = parseInt($('leveledBookLanguageId').innerHTML);
    setMenuImage(collectionId, leveledBookLanguageId);
}

function onCollectionSelection(e) {
    var item = Event.element(e).up('li');
    var collectionId = parseInt(item.id);
    var leveledBookLanguageId = 1;
    if (collectionId == 4 || collectionId == 43) {
        leveledBookLanguageId = item.readAttribute("data-languageid");
    }

    $$("#collectionMenu li").each(function(item) {
        item.removeClassName('active');
    });

    var parameters = "action/changeView/collectionId/" + collectionId + "/leveledBookLanguageId/" + leveledBookLanguageId + "/mode/kids";
    var ajax = new Ajax.Request('/main/RazQuizRoom/' + parameters, {
        method: 'get',
        onCreate: function() {
            showFilterLoader();
            $('collectionMenu').addClassName('navDisplayHide');
            setMenuImage(collectionId, leveledBookLanguageId);
        },
        onSuccess: function(transport) {
            if (transport.responseText == "") {
                window.location.href = "/main/Login";
            } else {
                $("tileContent").innerHTML = transport.responseText;
                transport.responseText.evalScripts();
                setupMenu();
                $(document).fire('banner_document:loaded');
            }
        },
        onComplete: function() {
            setTimeout(function() { $('filterLoader').hide(); }, 150);
        }
    });
}

function onMegaMenuMouseOver(e) {
    $('selectedLI').addClassName('active');
}

function onMegaMenuMouseOut(e) {
    $('selectedLI').removeClassName('active');
}

function setMenuImage(collectionId, leveledBookLanguageId) {
    if (collectionId == 4 && leveledBookLanguageId == 3) {
        collectionId = 43;
    }

    switch (collectionId) {
        case 1:
            $('navLabel').innerHTML = 'Alphabet Books';
            $('1').addClassName('active');
            break;
        case 2:
            $('navLabel').innerHTML = 'Decodable Books';
            $('2').addClassName('active');
            break;
        case 3:
            $('navLabel').innerHTML = 'High-Frequency Word Books';
            $('3').addClassName('active');
            break;
        case 4:
            $('navLabel').innerHTML = 'Leveled Books';
            $('4').addClassName('active');
            break;
        case 43:
            $('navLabel').innerHTML = 'Spanish Leveled Books';
            $('43').addClassName('active');
            break;
        case 5:
            $('navLabel').innerHTML = 'Poetry Books';
            $('5').addClassName('active');
            break;
        case 6:
            $('navLabel').innerHTML = 'Read Alouds';
            $('6').addClassName('active');
            break;
        case 8:
            $('navLabel').innerHTML = 'Favorite Characters';
            $('8').addClassName('active');
            break;
        case 9:
            $('navLabel').innerHTML = 'Sound Symbols';
            $('9').addClassName('active');
            break;
        case 10:
            $('navLabel').innerHTML = 'Vocabulary Books';
            $('10').addClassName('active');
            break;
        case 15:
            $('navLabel').innerHTML = 'Trade Book Quizzes';
            $('15').addClassName('active');
            break;
        case 13:
            $('navLabel').innerHTML = 'Nursery Rhymes';
            $('13').addClassName('active');
            break;
        case 50:
            $('navLabel').innerHTML = 'Song Books';
            $('28').addClassName('active');
            break;
        case 17:
            $('navLabel').innerHTML = 'ELL Vocabulary Books';
            $('17').addClassName('active');
            break;
        case 18:
            $('navLabel').innerHTML = 'Sprout Stories';
            $('18').addClassName('active');
            break;
        case 0:
            $('navLabel').innerHTML = 'Kids Writing Library';
            $('0').addClassName('active');
            break;
        default:
            $('navLabel').innerHTML = 'Leveled Books';
            $('4').addClassName('active');
    }
    $('collectionId').update(collectionId);
    $('leveledBookLanguageId').update(leveledBookLanguageId);
}

function showFilterLoader() {
    var filterLoader = getFilterLoader();
    if (filterLoader) {
        setFilterLoaderHeight(filterLoader);
        filterLoader.show();
    }
}

function hideFilterLoader() {
    var filterLoader = getFilterLoader();
    if (filterLoader) {
        filterLoader.hide();
    }
}

function getFilterLoader(){
    var filterLoader = $('js-filterLoader');
    filterLoader = filterLoader || $('filterLoader');
    return filterLoader;
}


function setFilterLoaderHeight(filterLoader) {
    if (filterLoader) {
        var topPosition = parseInt(filterLoader.getStyle('top'));
        var offsetTop = !isNaN(topPosition) ? topPosition : 0;
        var container = $('tileContent');
        if (container) {
            var newHeight = container.getHeight() - offsetTop;
            if (newHeight < 0) newHeight = 0;
            filterLoader.setStyle({height: newHeight + 'px'});
        }
    }
}

function filterLeveledBooks(level) {
    var parameters = "action/changeView/collectionId/4/level/" + level + "/mode/kids";
    var ajax = new Ajax.Request('/main/RazQuizRoom/' + parameters, {
        method: 'get',
        onCreate: function() {
            $('filterLoader').show();
        },
        onSuccess: function(transport) {
            if (transport.responseText == "") {
                window.location.href = "/main/Login";
            } else {
                $("tileContent").innerHTML = transport.responseText;
                setupMenu();
            }
        },
        onComplete: function() {
            setTimeout(function() { $('filterLoader').hide(); }, 150);
        }
    });
}

function updateBookDetails(id, languageId, assignResourceData) {
    $j.ajax({
        url : '/main/BookDetail/from/quizroom/action/changeBook/id/' + id + '/languageId/' + languageId,
        type : 'get',
        success:function(data){
            $j("#bookDetails").html(data);
            if (assignResourceData) {
                assignResourceData['translation'] = languageId;
                runTemplate(assignResourceData);
            }

            minibookScroller = getNewMinibookScroller();
            if(minibookScroller) {
                minibookScroller._init();
            }
        },
        complete:function(){
            lightwindowInit(false);
        }
    });
}

function getNewMinibookScroller() {
    return new Scroller({
        orientation: 'horizontal',
        containerId: 'miniBook',
        slideId: 'miniBookSlider',
        nextButtonId: 'right',
        prevButtonId: 'left',
        eventType: 'click',
        enableEffects: true
    });
}

function filterTradeBooks(level) {
    var parameters = "action/changeView/collectionId/15/tradeBookLevel/" + level + "/mode/kids";
    var ajax = new Ajax.Request('/main/RazQuizRoom/' + parameters, {
        method: 'get',
        onCreate: function() {
            $('filterLoader').show();
        },
        onSuccess: function(transport) {
            if (transport.responseText == "") {
                window.location.href = "/main/Login";
            } else {
                $("tileContent").innerHTML = transport.responseText;
                setupMenu();
            }
        },
        onComplete: function() {
            setTimeout(function() { $('filterLoader').hide(); }, 150);
        }
    });
}

function sendSearch(searchTerms) {
    var embeddedSpaces = new RegExp(' +', 'g');
    var url = "/main/Search/?searchTerms=" + encodeURIComponent(searchTerms.trim().replace(embeddedSpaces, '+'));
    document.location.replace(url);
}

function filterRecordings(cookie, inbasket) {
    var cookieObject = {};
    var filterNames = [];

    var recordingFilters = $$('input[id^="recordingFilter"]');
    recordingFilters.each(function(filter) {
        filterNames[filterNames.length] = filter.name;

        if (filter.checked) {
            cookieObject[filter.name] = 'y';
        }
    });

    filterNames.each(function(filterName) {
        var show = false;

        if ((Object.keys(cookieObject).length == 0) || (cookieObject[filterName] == 'y')) {
            show = true;
        }

        showHideRecordings(filterName, show);
    });

    if ((Object.keys(cookieObject).length != 0)) {
        clg.commonUtils.setCookie(cookie, Object.toJSON(cookieObject));
        if ($('clearFilters')) {
            $('clearFilters').show();
        }
    } else {
        clg.commonUtils.deleteCookie(cookie);
        if ($('clearFilters')) {
            $('clearFilters').hide();
        }

    }

    if(inbasket) {
        tabbedRecordingFilter(cookieObject);
    }

    updateRecordingsCount();
}

function tabbedRecordingFilter(cookieObject) {
    if (!cookieObject.hasOwnProperty("rkassessment") &&
        !cookieObject.hasOwnProperty("rkpractice") &&
        !cookieObject.hasOwnProperty("rkquiz_constructed_response")) {
        showHideRecordings("rkassessment", true);
        showHideRecordings("rkpractice", true);
        showHideRecordings("rkquiz_constructed_response", true);
    }
    if (!cookieObject.hasOwnProperty("hsassessment") &&
        !cookieObject.hasOwnProperty("hspractice")) {
        showHideRecordings("hsassessment", true);
        showHideRecordings("hspractice", true);
    }
    if (!cookieObject.hasOwnProperty("writing_assignment") &&
        !cookieObject.hasOwnProperty("writing_practice")) {
        showHideRecordings("writing_assignment", true);
        showHideRecordings("writing_practice", true);
    }
    if (!cookieObject.hasOwnProperty("sazpractice") &&
        !cookieObject.hasOwnProperty("sazquiz_constructed_response")) {
        showHideRecordings("sazpractice", true);
        showHideRecordings("sazquiz_constructed_response", true);
    }
}

function showHideRecordings(filterName, show) {
    $$('li.' + filterName, 'tr.' + filterName).each(function(recording) {
        if (show) {
            recording.show();
        } else {
            recording.hide();
        }
    });
}

function updateRecordingsCount() {
    if ($('currentBookCount') ) {
        var filterCount = 0;
        $('filterableRecordings').select('.filterableItem').each(function(item) {
            if (item.visible()) {
                filterCount++;
            }
        });
        $('currentBookCount').update(filterCount);
        var noResultsDiv = $('noResults');
        if (filterCount == 0) {
            if (noResultsDiv == null) {
                noResultsDiv = new Element('div', {'id': 'noResults', 'class': 'noResults', 'style': 'margin-bottom: 15px'}).update('No assessments matched your filter selections.');
                $('filterableRecordings').insert({ before: noResultsDiv });
                $('filterableRecordings').hide();
            }
            noResultsDiv.show();
        } else if (noResultsDiv != null) {
            noResultsDiv.hide();
            $('filterableRecordings').show();
        }
    }
}

function clearRecordingFilters(cookie) {
    $$('input[id^="recordingFilter"]').each(function(filter) {
        filter.checked = false;
    });
    filterRecordings(cookie);
}

function toggleHeadSproutSegmentClass(segmentCode) {
    $$('#episodeSegments a').each(function(item) {
        item.removeClassName('active');
    });
    $('segment'+segmentCode).addClassName('active');
}
function updateReadingRoomLanguageList(setting, student_id, turning_off) {
    var language = null;

    switch (setting) {
        case "BookroomStatus":
            language = 'all';
            break;
        case "EnglishStatus":
            language = 'english';
            break;
        case "SpanishStatus":
            language = 'spanish';
            break;
        case "FrenchStatus":
            language = 'french';
            break;
        case "PolishStatus":
            language = 'polish';
            break;
        case "UkrainianStatus":
            language = 'ukrainian';
            break;
        case "VietnameseStatus":
            language = 'vietnamese';
            break;
        default:
            // Should never get here...
            break;
    }

    if (language === null) {
        return "Failed to obtain a valid language within 'updateReadingRoomLanuage'.";
    }

    var active_student_list_items = null;
    var list_of_languages = ["english", "spanish", "french", "polish", "ukrainian", "vietnamese"];
    var list_length = list_of_languages.length;

    // Toggle button for a specific language within the Reading Room
    if (language !== "all" && student_id === "all") {
        active_student_list_items = document.getElementsByClassName(language + "-active-student-menu-item");
        var active_length = active_student_list_items.length;
        for (var i = 0; i < active_length; ++i) {
            if (active_student_list_items[i].style.display === 'none' && !turning_off) {
                active_student_list_items[i].show();
            } else if (turning_off){
                active_student_list_items[i].hide();
            }
        }

        return;
    }

    // Toggle button for all students within the Reading Room
    if (language === "all" && student_id === "all") {
        for (var j = 0; j < list_length; ++j) {
            active_student_list_items = document.getElementsByClassName(list_of_languages[j] + "-active-student-menu-item");
            var size_of_student_list = active_student_list_items.length;
            for (var k = 0; k < size_of_student_list; ++k) {
                active_student_list_items[k].hide();
            }
        }

        return;
    }

    // Toggle button for a specific student within the Reading Room
    if (language === "all" && student_id !== "all") {
        for (var x = 0; x < list_length; ++x) {
            var active_student_element = document.getElementById(list_of_languages[x] + "-active-student-menu-item-" + student_id);
            if (active_student_element.style.display !== 'none' && turning_off) {
                active_student_element.hide();
            }
        }

        if (!turning_off) {
            document.getElementById("english-active-student-menu-item-" + student_id).show();
        }

        return;
    }
}

function displaySpecificLanguageBookroomConfigDetails(language, collection_ids, student_id, turning_off) {
    var bookroom_config_display = document.getElementById(language + "-bookroom-config-display");
    var language_currently_off = document.getElementById(language + "-bookroom-config-currently-off");
    var length = collection_ids.length;
    var leveled_books_to_hide = null;

    if (student_id === 'all' && turning_off) {
        for (i = 0; i < length; ++i) {
            $j("#bookroomConfigEnabled_" + collection_ids[i]).prop("checked", false);
            leveled_books_to_hide = document.getElementById("bookroomConfigDetails_" + collection_ids[i]);
            if (leveled_books_to_hide) {
                leveled_books_to_hide.style.display = 'none';
            }
        }
        bookroom_config_display.hide();
        language_currently_off.show();
    } else {
        if (bookroom_config_display.style.display === 'none') {
            bookroom_config_display.show();
            for (var i = 0; i < length; ++i) {
                $j("#bookroomConfigEnabled_" + collection_ids[i]).prop("checked", true);
                var leveled_books_to_show = document.getElementById("bookroomConfigDetails_" + collection_ids[i]);
                if (leveled_books_to_show) {
                    leveled_books_to_show.style.display = 'block';
                }
            }
        } else {
            for (i = 0; i < length; ++i) {
                $j("#bookroomConfigEnabled_" + collection_ids[i]).prop("checked", false);
                leveled_books_to_hide = document.getElementById("bookroomConfigDetails_" + collection_ids[i]);
                if (leveled_books_to_hide) {
                    leveled_books_to_hide.style.display = 'none';
                }
            }
            bookroom_config_display.hide();
        }

        if (language_currently_off.style.display === 'none') {
            language_currently_off.show();
        } else {
            language_currently_off.hide();
        }
    }
}

(function(ns) {

    ns.replaceUrlParam = function (url, param, newValue){
        var newUrlParam = "/" + param + "/" + newValue;
        var pathSplit = url.split("/");
        var pathId = null;
        for(var i = 0; i < pathSplit.length; i++)
        {
            if(pathSplit[i] === param)
                pathId = i;
        }
        if(pathId != null && pathId < pathSplit.length){
            var oldValue = pathSplit[pathId + 1];
            var replacementString = "/" + param + "/" + oldValue;
            url = url.replace(replacementString, newUrlParam);
        }
        else {
            url = url + newUrlParam;
        }

        return url;
    };


    ns.removeUrlParam = function (url, param){
        var pathSplit = url.split("/");
        var pathId = null;
        for(var i = 0; i < pathSplit.length; i++)
        {
            if(pathSplit[i] === param)
                pathId = i;
        }
        if(pathId != null && pathId < pathSplit.length){
            var oldValue = pathSplit[pathId + 1];
            var replacementString = "/" + param + "/" + oldValue;
            url = url.replace(replacementString, "");
        }

        return url;
    };

    ns.updateNotification = function (studentId, notificationId) {
        var url = '/main/Roster/student/' + studentId + '/action/updateNotification/hide/' + notificationId;
        new Ajax.Updater(notificationContainer, url, {
            method: 'get'
        });
        return false;
    };

    ns.hideClassroomActivityReportNotification = function (studentId, notificationId) {
        var url = '/main/ViewReports/student/' + studentId + '/action/hideNotification/notification/' + notificationId;
        notificationContainer = $('alertList-' + studentId);
        new Ajax.Request(url, {
            onSuccess: function (response) {
                notificationContainer.update(response.responseText);
                var remainingNotificationCount = $$('#alertList-' + studentId + ' li').length;
                if (remainingNotificationCount == 0) {
                    $('alertActivity-' + studentId).removeClassName('yes');
                    $('alertActivity-' + studentId).addClassName('no');
                    $('alertActivity-' + studentId).removeClassName('active');
                    $('alertActivityParent-' + studentId).removeClassName('active');
                    // We want to just hide the alertActivity-<studentId> element here but we can't just call hide() because then the
                    // visibility status gets out of sync with the simplePopout code.  So instead we simulate a click outside the
                    // popout which causes simplePopout code to handle the hiding.
                    $('alertActivity-' + studentId).simulate('click');
                }
                $('alertCount-' + studentId).update(remainingNotificationCount);
            }
        });
        return false;
    };

    ns.hideProgressNote = function(notificationId, settings) {
        var ajaxSettings = {
            url: '/main/ViewReports/action/hideProgressNote/notification/' + notificationId
        };
        settings = $j.extend({}, ajaxSettings, settings);
        $j.ajax(settings);
    };

    ns.hideHomePageNotification = function (studentId, notificationId) {
        var url = '/main/CriticalNotification/student/' + studentId + '/action/hideNotification/notification/' + notificationId;
        notificationContainer = $('alerts-slide');
        new Ajax.Request(url, {
            onSuccess: function (response) {
                notificationContainer.update(response.responseText);
            }
        });
        return false;
    };

    ns.indeterminateSpecificLanguage = function(language_type) {
        var disabled_string = 'a[data-setting="' + language_type + 'Status"].toggleOff:not([data-student="all"])';
        var enabled_string = 'a[data-setting="' + language_type + 'Status"].toggleOn:not([data-student="all"])';
        var disabled = $j(disabled_string);
        var enabled = $j(enabled_string);

        return !(disabled.length === 0 || enabled.length === 0);
    };

    ns.setSpecificLanguageBookroomCheckbox = function(new_value, language_type) {
        var lower_case_language_type = language_type.toLowerCase();
        var bookroom_checkbox = "#" + lower_case_language_type + "BookroomCheckbox";
        if (ns.indeterminateSpecificLanguage(language_type)) {
            $j(bookroom_checkbox).prop("disabled", true);
            $j(bookroom_checkbox).prop("checked", true);
        } else {
            $j(bookroom_checkbox).prop("disabled", false);
            $j(bookroom_checkbox).prop("checked", new_value);
        }
    };

    ns.indeterminateEnglish = function() {
        var englishDisabled = $j('a[data-setting="EnglishStatus"].toggleOff:not([data-student="all"])');
        var englishEnabled = $j('a[data-setting="EnglishStatus"].toggleOn:not([data-student="all"])');
        return !(englishDisabled.length === 0 || englishEnabled.length === 0);
    };

    ns.setEnglishBookroomCheckbox = function(newValue) {
        if (ns.indeterminateSpanish()) {
            $j("#englishBookroomCheckbox").prop("disabled", true);
            $j("#englishBookroomCheckbox").prop("checked", true);
        } else {
            $j("#englishBookroomCheckbox").prop("disabled", false);
            $j("#englishBookroomCheckbox").prop("checked", newValue);
        }
    };

    ns.indeterminateSpanish = function() {
        var spanishDisabled = $j('a[data-setting="SpanishStatus"].toggleOff:not([data-student="all"])');
        var spanishEnabled = $j('a[data-setting="SpanishStatus"].toggleOn:not([data-student="all"])');
        return !(spanishDisabled.length === 0 || spanishEnabled.length === 0);
    };

    ns.setSpanishBookroomCheckbox = function(newValue) {
        if (ns.indeterminateSpanish()) {
            $j("#spanishBookroomCheckbox").prop("disabled", true);
            $j("#spanishBookroomCheckbox").prop("checked", true);
        } else {
            $j("#spanishBookroomCheckbox").prop("disabled", false);
            $j("#spanishBookroomCheckbox").prop("checked", newValue);
        }
    };

    ns.rosterMassToggler = function (setting, config, student, newValue) {
        var toggler = function() {
            toggleSwitchEnable(this, newValue);
        };
        var dataField = setting ? 'setting' : 'config';
        var settingOrConfig = setting ? setting : config;
        var settingToggler = function(setting, student) {
            if (student == 'all') {
                $j('a[data-' + dataField + '="' + settingOrConfig + '"]').each(toggler);

                if (settingOrConfig === "SpanishStatus") {
                    ns.setSpecificLanguageBookroomCheckbox(newValue, "Spanish");
                }
            } else {
                $j('a[data-' + dataField + '="' + settingOrConfig + '"][data-student="' + student + '"]').each(toggler);

                var allStudentsEnabled = true;

                $j('a[data-' + dataField + '="' + settingOrConfig + '"]').each(function() {
                    if (($j(this).data('student') != 'all') && ($j(this).hasClass('toggleOff'))) {
                        allStudentsEnabled = false;
                    }
                });
                toggleSwitchEnable($j('a[data-' + dataField + '="' + settingOrConfig + '"][data-student="all"]'), allStudentsEnabled);

                if (settingOrConfig === "SpanishStatus") {
                    ns.setSpecificLanguageBookroomCheckbox(allStudentsEnabled, "Spanish");
                }
            }
        };
        var scienceToggler = function (config, student) {
            if (student == 'all') {
                $j('a[data-' + dataField + '="' + config + '"]').each(toggler);
            } else {
                $j('a[data-' + dataField + '="' + config + '"][data-student="' + student + '"]').each(toggler);

                var allStudentsEnabled = true;

                $j('a[data-' + dataField + '="' + config + '"]').each(function() {
                    if (($j(this).data('student') != 'all') && ($j(this).hasClass('toggleOff'))) {
                        allStudentsEnabled = false;
                    }
                });

                toggleSwitchEnable($j('a[data-' + dataField + '="' + config + '"][data-student="all"]'), allStudentsEnabled);
            }
        };
        settingToggler(setting, student);
        if (newValue && (setting == 'EnglishStatus' || setting == 'SpanishStatus' || setting == 'FrenchStatus' || setting == 'PolishStatus' || setting == 'UkrainianStatus' || setting == 'VietnameseStatus')) {
            settingToggler('BookroomStatus', student);
            $j('#bookroomConfigError').hide();
        } else if (!newValue && setting == 'BookroomStatus') {
            settingToggler('EnglishStatus', student);
            settingToggler('SpanishStatus', student);
            settingToggler('FrenchStatus', student);
            settingToggler('PolishStatus', student);
            settingToggler('UkrainianStatus', student);
            settingToggler('VietnameseStatus', student);
        } else if (newValue && config == 'scienceSpanish') {
            scienceToggler('scienceLibrary', student);
        } else if (!newValue && config == 'scienceLibrary') {
            scienceToggler('scienceSpanish', student);
        }
    };

    ns.updateSetting = function(studentId, setting, newValue, options) {
        var options = $j.extend({}, {
            url: '/main/Roster/action/update' + setting + '/studentId/' + studentId + '/checked/' + new Boolean(newValue).toString()
        }, options);
        return $j.ajax(options);
    };

    ns.updateGuiConfigs = function(studentId, configs, options) {
        var options = $j.extend({}, {
            url: '/main/Roster/action/updateGuiConfigs/studentId/' + studentId + '/configs/' + configs
        }, options);
        return $j.ajax(options);
    };

    ns.formatGuiConfig = function(config, value) {
        return config + '=' + (value ? 1 : 0)
    };

    ns.updateBookRoomAndTranslatedBooksToggleSwitches = function(setting, data, config, student, newValue) {
        if (setting == "BookroomStatus" && data == "Empty Book Room") {
            $j('#BookroomSettingsLink')[0].simulate('click');
            $j('#bookroomConfigError').show();
        } else {
            ns.rosterMassToggler(setting, config, student, newValue);
        }

        if (setting == "EnglishStatus" || setting == "SpanishStatus" || setting == "FrenchStatus" || setting == "PolishStatus" || setting == "UkrainianStatus" || setting == "VietnameseStatus") {
            if (newValue == false && data == "[]") {
                // turn off the book room if only one of the languages was on
                ns.rosterMassToggler('BookroomStatus', config, student, newValue);
            } else if (newValue == true) {
                ns.rosterMassToggler('BookroomStatus', config, student, newValue);
            }
        }
    };

    ns.toggleRosterSetting = function(toggleElt) {
        var toggle = $j(toggleElt);
        var config = toggle.data('config');
        var setting = toggle.data('setting');
        var student = toggle.data('student');
        var newValue = !getToggleSwitch(toggle);
        var ajax;
        if (setting) {
            ajax = ns.updateSetting(student, setting, newValue);
        } else {
            var science_extra_config = '';
            if (newValue && config === 'scienceSpanish') {
                science_extra_config = ',scienceLibrary=1';
            } else if (!newValue && config === 'scienceLibrary') {
                science_extra_config = ',scienceSpanish=0';
            }
            ajax = ns.updateGuiConfigs(student, ns.formatGuiConfig(config, newValue)+science_extra_config);
        }

        ajax.done(function(data, status, jqXHR) {
            if (setting == 'BookroomStatus' || setting == "EnglishStatus" || setting == "SpanishStatus" || setting == "FrenchStatus" ||
                setting == "PolishStatus" || setting == "UkrainianStatus" || setting == "VietnameseStatus") {
                ns.updateBookRoomAndTranslatedBooksToggleSwitches(setting, data, config, student, newValue);
            } else {
                ns.rosterMassToggler(setting, config, student, newValue);
            }
        })
            .fail(function(jqXHR, status, error) {
                var responseJSON = $j.parseJSON(jqXHR.responseText);
                showResponse('fail', toggleElt, responseJSON.msg);
            });
    };

    ns.setAllCheckFromCollection = function (checkboxId, collectionSelector) {
        var allStudentsBox = $j('#' + checkboxId);
        var total = $j(collectionSelector).length;
        if (total > 0) {
            var numChecked = $j(collectionSelector + ':checked').length;
            if (numChecked < total) {
                allStudentsBox.prop('checked', false);
                allStudentsBox.prop('indeterminate', numChecked > 0);
            } else {
                allStudentsBox.prop('checked', true);
                allStudentsBox.prop('indeterminate', false);
            }
            allStudentsBox.parent().show();
        }
        else {
            allStudentsBox.parent().hide();
        }
    };
})(window.clg.razKids);


//FUNCTION TO HIDE THE HEADSPROUT POPOVER IF CLOSED.
function hideHSSubShout() {
    var x = $('headsproutSubscription');
    x.removeClassName('active');
    clg.commonUtils.setCookie('hide-HSSubShout', Object.toJSON(new Boolean(true)));
}

//FUNCTION TO HIDE THE WRITING POPOVER IF CLOSED.
function hideWAZSubShout() {
    var x = $('writingSubscription');
    x.removeClassName('active');
    clg.commonUtils.setCookie('hide-WAZSubShout', Object.toJSON(new Boolean(true)));
}

//FUNCTION TO HIDE THE READYTEST POPOVER IF CLOSED.
function hideRTSubShout() {
    var x = $('readyTestSubscription');
    x.removeClassName('active');
    clg.commonUtils.setCookie('hide-RTSubShout', Object.toJSON(new Boolean(true)));
}

function updateCustomAssignmentResources(form, assignmentId, collectionId, levelName) {
    showLoader();
    var url = "/main/Assign/action/editResources/assignment/" + assignmentId + "/collectionId/" + collectionId + "/update/true";

    if (levelName != undefined) {
        url += "/levelName/" + levelName;
    }

    var myAjax = new Ajax.Request(url, {
        method: 'post',
        parameters: form.serialize(),
        onSuccess : function(transport) {
            $(form).update(transport.responseText);
        },
        onComplete: function() {
            clg.commonUtils.resetSimplePopout();
            bookPopout.resetPopoutEvents();
            lightwindowInit(true);
            hideLoader();
        }
    });
}

function deleteDraftConfirm(writingId) {
    $('areYouSure-' + writingId).show();
}

function hideDeleteConfirm(writingId) {
    $('areYouSure-'+ writingId).hide();
}

function hideAllDeleteConfirm() {
    $($$("div[id^=areYouSure]")).invoke('hide');
    if ($('readErrorWriteYourWay') != null) {
        $('readErrorWriteYourWay').hide();
    }
    if ($('readErrorBuildABook') != null) {
        $('readErrorBuildABook').hide();
    }
}

function deleteDraft(writingId, writingProjectType) {
    writingLinksPopoutObject = writingProjectType + 'PracticeLinks';
    var ajax = new Ajax.Updater(writingLinksPopoutObject, '/main/WritingStudent/action/delete/id/' + writingId + '/type/' + writingProjectType, {
        method : 'get',
        onComplete: function() {
            hideDeleteConfirm(writingId);
        }
    });
}

function updateReadingLevel(level) {
    $('level').setValue(level);
    var levelObj = $('level-' + level);
    var levelImages = $('levelSelector').descendants();
    levelImages.each(function(item) {
        if (item.match('a') && item.id.startsWith("level-")) {
            item.removeClassName('active');
        }
    });
    levelObj.addClassName('active');
}

function swfLoadEvent(fn){
    //Ensure fn is a valid function
    if(typeof fn !== "function"){
        return false;
    }
    //This timeout ensures we don't try to access PercentLoaded too soon
    var initialTimeout = setTimeout(function (){
        //Ensure Flash Player's PercentLoaded method is available and returns a value
        if(typeof e.ref.PercentLoaded !== "undefined" && e.ref.PercentLoaded()){
            //Set up a timer to periodically check value of PercentLoaded
            var loadCheckInterval = setInterval(function (){
                //Once value == 100 (fully loaded) we can do whatever we want
                if(e.ref.PercentLoaded() === 100){
                    //Execute function
                    alert('loaded');
                    //Clear timer
                    clearInterval(loadCheckInterval);
                }
            }, 1500);
        }
    }, 200);
}

function saveCreativeWritingDraft() {
    if ($('bookflashArea') == null)
        return;
    var swf = $('bookflashArea');
    var returnUrl = document.getElementById("backBtn").getAttribute("href");
    swf.exitSaveBookData(returnUrl);
}
function updateStarCount(newStarCount) {
    $('starDisplayCount').update(newStarCount);
}

function updateEnableTeacherMobile(event) {
    var checkboxObj = event.target;
    var checked = $(checkboxObj).checked ? true : false;

    $j.ajax({
        url: '/main/Roster/action/updateEnableTeacherMobile/checked/' + checked,
        success: function(data, status, jqXHR) {
            showResponse('success', $(checkboxObj).up(), 'Successfully updated');
        },
        error: function(jqXHR, status, error) {
            showResponse('fail', $(checkboxObj).up(), 'Update failed');
            $(checkboxObj).checked = !checked;
            try {
                alert($j.parseJSON(jqXHR.responseText).errorMessage);
            } catch (e) {}
        }
    });
}

function preventDefault(event) {
    if (!event) {
        event = window.event;
    }
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        // IE8
        event.returnValue = false;
    }
}
function stopPropagation(event) {
    if (!event) {
        event = window.event;
    }
    if (event.stopPropagation) {
        event.stopPropagation();
    }
    // IE8
    else {
        event.cancelBubble = true;
    }
}

function showMore(noteId, event) {
    $j("#" + noteId).show();
    $j("#more_" + noteId).hide();
    $j("#less_" + noteId).show();
    preventDefault(event);
    stopPropagation(event);
}

function showLess(noteId, event) {
    $j("#" + noteId).hide();
    $j("#more_" + noteId).show();
    $j("#less_" + noteId).hide();
    preventDefault(event);
    stopPropagation(event);
}
