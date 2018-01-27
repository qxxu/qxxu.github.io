var quiz;
var cover = { width: null, height: null }
var quizResults = { isPassed: null, isPerfect: null }
var shouldBookmark = true;
var showResultsPane = false;
var quizIndex;
var maxConstructedResponseLength = 1000;
var currentQuizGrade = "";
var quiz_result_id;
var subject = "";

//////////////////////////////////////////////////////////////////////////////
//																			//
//							   ResponseArray								//
//																			//
//////////////////////////////////////////////////////////////////////////////

var responseArray = [];

function initializeResponseArray(quiz) {    
	var i = 0;
	quiz_result_id = quiz.quiz_result_id;
	currentQuizGrade = quiz.completion_status;
    subject = quiz.subject;
	
	for (; i < quiz.questions.length; ++i) {
		var userAnswerId = quiz.questions[i].user_answer_id;
		var question_format_id = quiz.questions[i].question_format_id;
		if (question_format_id==1) {
			var correct = (quiz.questions[i].user_answer_id == quiz.questions[i].correct_answer_id) ? true : null;
			var response = { questionId: quiz.questions[i].question_id, answerId: userAnswerId, isCorrect: correct, question_format_id: question_format_id, quiz_result_id: quiz_result_id};
			
		} else {
			var response = { questionId: quiz.questions[i].question_id , open_answer_text: quiz.questions[i].open_answer_text, question_format_id: question_format_id, quiz_result_id: quiz_result_id};
		}
		responseArray.push(response);
		
	}
}


function setResponseArrayResponse(response) {
	var i = 0;
	while(response.questionId != responseArray[i].questionId) {
		++i;
	}
	responseArray[i].answerId = response.answerId;
	responseArray[i].isCorrect = response.isCorrect;
	responseArray[i].open_answer_text = response.open_answer_text;
}

function removeResponseAtIndex(index) {
	responseArray[index].answerId = null;
	responseArray[index].isCorrect = null;
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								On Load										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function layoutHTML5QuizPlayer() {
	$j('head').append("<link href='/shared/css/Chewy.css' rel='stylesheet' type='text/css'>");
	$j('head').append("<link href='/shared/css/base/_icons.css' rel='stylesheet' type='text/css'>")
	$j('body').addClass("quiz");
	
	$j("#contentArea").append('<div class="quizWrapper forceFitNav" id="quizContent" position:relative;"></div>');
	$j("#quizContent").append('<div class="quizHeader"></div>');
	$j("#quizContent").append('<div class="quizContent"></div>')
	
	$j(".quizContent").append('<div class="question"></div>');
	$j(".quizContent").append('<div class="answers"><ul></ul></div>');
	$j(".quizContent").append('<div id="results" style="display:none;"></div>');
	$j(".quizContent").append('<div class="pageArrowBack" id="back-page">Back</div>');
	$j(".quizContent").append('<div class="pageArrowForward" id="forward-page">Next</div>');
	
	$j(".quizHeader").append('<ul class="quizNav"></ul>');

	if(!isPreview) {
		$j(".quizHeader").append('<div class="bookReference"></div>');
		if (!fromAssessment) {
			if ($j('#html5QuizPlayerEnabled').val() == true) {
				if ($j('#readResourceDeploymentId').val()) {
				    var readAgainHref = "/main/Activity/id/" + $j('#readResourceDeploymentId').val() + "/ReadFromQuiz/" + $j('#quizResourceDeploymentId').val();
                    if (activityInfo.studentAssignmentId != "false" && $j.isNumeric(activityInfo.studentAssignmentId)) {
                        readAgainHref += '/student-assignment-id/' + activityInfo.studentAssignmentId;
                    }
					$j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'"><span class="readAgain">Read Again</span></a>');
					$j(".bookReference").append('<a class="returnToBook" href="'+readAgainHref+'"><img class="bookCover" id="coverImg" border="0"></img></a>');
				} else if ($j('#listenResourceDeploymentId').val()) {
				    var listenAgainHref = "/main/Activity/id/" + $j('#listenResourceDeploymentId').val() + '/ReadFromQuiz/' + $j('#quizResourceDeploymentId').val();
                    if (activityInfo.studentAssignmentId != "false" && $j.isNumeric(activityInfo.studentAssignmentId)) {
                        listenAgainHref += '/student-assignment-id/' + activityInfo.studentAssignmentId;
                    }
					$j(".bookReference").append('<a class="returnToBook" href="'+listenAgainHref+'"><span class="readAgain">Read Again</span></a>');
					$j(".bookReference").append('<a class="returnToBook" href="'+listenAgainHref+'"><img class="bookCover" id="coverImg" border="0"></img></a>');
				}
			} else {
				$j(".bookReference").attr("onclick", "toggleQuizContent();");
				$j(".bookReference").append('<span class="readAgain">Read Again</span>');
				$j(".bookReference").append('<img class="bookCover" id="coverImg" border="0"></img>');
			}
		}
	}
	
	$j("#flashVersion").hide();
	
	// Make contentArea unhighlightable
	$j("#contentArea").css("-webkit-user-select","none");
	$j("#contentArea").css("-webkit-touch-callout","none");
	$j("#contentArea").css("-khtml-user-select","none");
	$j("#contentArea").css("-moz-user-select","none");
	$j("#contentArea").css("-ms-user-select","none");
	$j("#contentArea").css("user-select","none");
}

function loadResponseAudio() {
	if(!fromAssessment) {
		$j("#results").append("<audio id='resultsReread' src='/quiz_resources/global/v2_results_reread.mp3'></audio>");
		$j("#results").append("<audio id='resultsRetake' src='/quiz_resources/global/v2_results_retake.mp3'></audio>");
		$j("#results").append("<audio id='resultsSuper' src='/quiz_resources/global/v2_results_super.mp3'></audio>");
	} else if (subject != 'phonics') {
		$j("#results").append("<audio id='resultsAssessment' src='/quiz_resources/global/v2_assessment_results_fail.mp3'></audio>");
	}
}

function getNoOfCRQuestions()
{
	var i = 0; var length = quiz.questions.length;
	var crque_count=0; 
	for(; i < length; ++i) {
		
	var	format_id = quiz.questions[i].question_format_id;
	if(format_id == 2)
		{
		crque_count++;
		}
	}
	
	return crque_count;
}

function generateButtons() {
	var i = 0; var length = quiz.questions.length;
	for(; i < length; ++i) {
		var addSpan = "";
		if(quiz.questions[i].question_format_id ==1) {
			var isAnswered = (quiz.questions[i].user_answer_id) ? "active " : "";
		} else if(quiz.questions[i].question_format_id ==2){
			var isAnswered = (quiz.questions[i].open_answer_text) ? "active " : "";
		}
		
		if (quiz.quiz_result_id != null) {
			if(quiz.questions[i].correct_answer_id == quiz.questions[i].user_answer_id) {
				isAnswered += "correct";
				addSpan = "<span class='icon icon-ok'></span>";
			} else if(quiz.questions[i].question_format_id ==2) {
				isAnswered = $j(".quizNav").removeClass("active");
			} else {
				isAnswered += "incorrect";
				addSpan = "<span class='icon icon-remove'></span>";
			}
		}
		var appendString = "<li><a class='button " + isAnswered + "' href='#'>" + ((addSpan != "") ? addSpan : (i + 1)) + "</a></li>";
		$j(".quizNav" ).append(appendString);
	}
	$j(".quizNav").append("<li><a id='done' class='button doneOff' href='#'>Done</a></li>");	
	enableDoneButtonIfQuizComplete();
}

function generateButtonsForReadOnly() {
	var i = 0; var length = quiz.questions.length;
	for(; i < length; ++i) {
		var isAnswered = (quiz.questions[i].user_answer_id) ? "active correct " : "";
		var appendString = "<li><a class='button " + isAnswered + "' href='#'>" + (i + 1) + "</a></li>";
		$j(".quizNav" ).append(appendString);
	}
	$j(".quizNav").append("<li><a class='button doneOff' href='#'>Done</a></li>");
}

function showResults(makeVisible) {
	var answerDisplay = (makeVisible) ? "none" : "block";
	var resultDisplay = (makeVisible) ? "block" : "none";
	$j(".answers").css("display", answerDisplay);
	$j("#results").css("display", resultDisplay); 
	
	if(makeVisible) {
		$j(".question").empty();
		var doneButtonIndex = $j(".doneOn").parent().index();
		changeQuizNav(doneButtonIndex);
		//resizeResultsDiv();
		showResultsPane = true;
	}
}

function attachHTML5QuizHandlers() {
	$j(".answers").on("click", ".audioSpan", function() {
		pauseAndResetAudioClips();
		$j(this).siblings("audio")[0].play();		
	});
	

	$j(".question").on("click", ".audioSpan", function() {
		pauseAndResetAudioClips();
		$j(this).siblings("audio")[0].play();
	});
	
	$j("#results").on("click", ".audioSpan", function() {
		playAudioResponse();
	});
	
	$j(".quizNav").on("click", ".button", function() {
		if(!$j(this).hasClass("disabled")) {
			if($j(this).hasClass("doneOn") || $j(this).hasClass("doneOff")) {
				if($j(this).hasClass("doneOn") && showResultsPane) {
					showResults(true);
				}
				else if($j(this).hasClass("doneOn") && !showResultsPane) {
					submitAnswers();
				} 
			} else {
				changeQuestion($j(this).parent().index());
			}
		}
	});
	
	$j(".pageArrowForward").on("click", function() {
		getQuizNumber();
		var quizNumber = quizIndex + 1;
		if (quizNumber == quiz.questions.length) {			
			if (showResultsPane) {
				showResults(true);
			} else {
				submitAnswers();
			}
		} else {
			if (quizNumber == quiz.questions.length && $j('a.button.doneOff')) {
				$j('.pageArrowForward').hide();		
			} else {
				$j('.pageArrowForward').show();
			}
			changeQuestion(quizNumber);
		}
	});
	
	$j(".pageArrowBack").on("click", function() {
		getQuizNumber();
		var quizNumber = quizIndex - 1;
		$j('.pageArrowForward').hide();
		changeQuestion(quizNumber);	
	});
	
	$j(".answers").on("click", "a", function() {
		selectAnswer($j(this).parent().index());	
	});
	$j(".answers").on("input", ".crAnswerBox", function() {
		selectCRAnswer($j(".crAnswerBox").val());	
	});
	
	$j(".backBtn").click(function(event) {
		event.preventDefault();
		bookmarkAndRedirect(true, null);
	});
	
	$j(window).on('beforeunload', function() {
		bookmarkAndRedirect(false, document.activeElement.className);
	});
}

function getQuizNumber() {
	$j( ".quizNav li" ).each(function( index ) {
		var imgHtml = $j(this).html();
		if ($j(imgHtml).hasClass("selected")) {
			quizIndex = index;
		}
	});
}

function changeQuizDataForReadOnly() {
	var i = 0; var length = quiz.questions.length;
	for(; i < length; ++i) {
		if(quiz.questions[i].question_format_id != 2) {
			quiz.questions[i].user_answer_id = quiz.questions[i].correct_answer_id;
			var questionId = quiz.questions[i].question_id;
			var answerId = quiz.questions[i].correct_answer_id
			var isCorrect = true;
			var response = {questionId: questionId, answerId: answerId, isCorrect: isCorrect};
			setResponseArrayResponse(response);
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								Actions										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function selectAnswer(answerToSelect) {

	var currentQuestion = $j(".quizNav .selected");
	if(!isCurrentQuestionCorrect()) {
		$j(".answers").find(".active").removeClass("active");
		$j(".answers ul li:eq(" + answerToSelect + ")").children().addClass("active");

		var answerNumber = $j(".answers ul li:eq(" + answerToSelect + ")");
		var questionNumber = currentQuestion.parent().index();
		var questionId = quiz.questions[questionNumber].question_id;
		var answerId   = quiz.questions[questionNumber].choices[answerNumber.index()].answer_id;
		var isCorrect  = quiz.questions[questionNumber].choices[answerNumber.index()].is_correct;
		var response = { questionId: questionId, answerId: answerId, isCorrect: isCorrect };
		setResponseArrayResponse(response);

		if(!isDoneButton(currentQuestion)) {
			currentQuestion.html(currentQuestion.parent().index() + 1);
		}
		
		enableDoneButtonIfQuizComplete();
		showResultsPane = false;
	}
	
	shouldBookmark = true;
}

function selectCRAnswer(constructedResponse) {
	var currentQuestion = $j(".quizNav .selected");
	var questionNumber = currentQuestion.parent().index();
	var questionId = quiz.questions[questionNumber].question_id;
	var open_answer_text = null;
	var isCorrect = null;
	if(constructedResponse){
		open_answer_text= constructedResponse;
		var response = { questionId: questionId, open_answer_text: open_answer_text, isCorrect: isCorrect };
		setResponseArrayResponse(response);
		
		if(!isDoneButton(currentQuestion)) {currentQuestion.html(currentQuestion.parent().index() + 1);}
		
		enableDoneButtonIfQuizComplete();
		showResultsPane = false;	
    } else {
		open_answer_text= "";
		var response = { questionId: questionId, open_answer_text: open_answer_text, isCorrect: isCorrect };
		setResponseArrayResponse(response);
    }
}
			
function changeQuestion(questionIndex) {
	pauseAndResetAudioClips();
	showResults(false);
	
	changeQuizNav(questionIndex);
	changeQuestionText(questionIndex);
	changeAnswers(questionIndex);
	checkmarkAnswerIfQuestionIsCorrect(questionIndex);
	
	$j(".bookReference a.returnToBook").each(function() {
		$j(this).removeClass("disabled");
	});
	
	if (currentQuizGrade == "perfect" && isAllAnswersCorrect()) {
		disableDoneButton();
		$j(".bookReference a.returnToBook").each(function() {
			$j(this).addClass("disabled");
		});
	}
	
	shouldBookmark = true;
	
	//resizeHTML5QuizPlayer();	
	$j("audio").on("loadeddata", function() {
		if($j(this).siblings("span").hasClass("audioLoad")) {
			$j(this).siblings("span").addClass("audioSpan").removeClass("audioLoad");
		}
	});
}

function submitAnswers() {
	shouldBookmark = false;
	showLoadingScreen(true);
	
	SubmitDataFromResponseArray();

}

//////////////////////////////////////////////////////////////////////////////
//																			//
//							Submit Functions								//
//																			//
//////////////////////////////////////////////////////////////////////////////

function submitCallback(data) {

	quizResults.isPassed = data.is_passed;
	quizResults.isPerfect = data.is_perfect;
	quizResults.activityId = data.activity_id;

	// Self paced completion = 500, enhanced/targeted completion = 100
	// If a HS benchmark ep is completed, assignment_completion_stars == 100 and we need to go to the benchmark reward page instead
	if (data.assignment_completion_stars == "500" || (data.assignment_completion_stars == "100" && subject != 'phonics')) {
        window.location = '/main/ActivityReward/id/' + $j('#quizResourceDeploymentId').val();
	} else {
        showLoadingScreen(false);
        showResults(true);
		resetResultsDiv();
	}	
	determineAndSetResultsHtml(data);
	$j(".doneOn").addClass("selected");
	
	// Mark question buttons as correct or incorrect
    var quizDisabled = false;
    $j(".quizNav .button").each(function(index) {
        if(!$j(this).hasClass("doneOn")  && index != quiz.questions.length) {
            $j(this).removeClass("correct").removeClass("incorrect");
            var inNavText;
            var classToAdd;
            if(responseArray[index].isCorrect) {
                inNavText = "<span class='icon icon-ok'></span>";
                classToAdd = "correct";
            } else if (responseArray[index].open_answer_text != undefined) {
                $j(this).removeClass("active");
            } else {
                inNavText = "<span class='icon icon-remove'></span>";
                classToAdd = "incorrect";
                removeResponseAtIndex(index);
            }

            if(data.disable_quiz == "1") {
                $j(this).removeClass("active");
                $j(this).addClass("disabled");
                $j(this).parent().attr("href","#");
                quizDisabled = true;
            } else {
                $j(this).removeClass("selected");
                if (responseArray[index].open_answer_text == undefined)
                    $j(this).addClass("active " + classToAdd);
            }

            $j(this).html(inNavText);
        }
    });

    if (quizDisabled) {
        $j(".ebookActivities .bookActivity").each(function() {
            if ($j(this).find('img').attr("src") == "/shared/images/ebook_html5/btn-bookActivity-quiz.png") {
                $j(this).addClass("disabled");
                $j(this).removeAttr("onclick");
            }
        });
    }

	// If not all answers are correct, disable the done button
	if(data.number_of_correct_answers < data.number_of_questions) {
		disableDoneButton();
		
		if(data.disable_quiz) {
			$j(".doneOff").addClass("disabled").removeClass("selected");
		}
	}
	else {
		enableDoneButtonIfQuizComplete();
	}

	//resizeResultsDiv();
	playAudioResponse(data.is_passed, data.is_perfect, fromAssessment);
}

function getDataFromResponse(data) {
	return {
		activity_id : $j(data).find("activity_id").text(),
		activity_type : $j(data).find("activity_type").text(),
		activity_format : $j(data).find("activity_format").text(),
		number_of_questions : $j(data).find("number_of_questions").text(),
		number_of_correct_answers : $j(data).find("number_of_correct_answers").text(),
		grade : $j(data).find("grade").text(),
		is_passed : $j(data).find("is_passed").text(),
		is_perfect : $j(data).find("is_perfect").text(),
		stars_earned : $j(data).find("stars_earned").text(),
		was_perfect : $j(data).find("was_perfect").text(),
		was_passed : $j(data).find("was_passed").text(),
		assignment_completion_stars : $j(data).find("assignment_completion_stars").text(),
		disable_quiz : $j(data).find("disable_quiz").text()
	}	
}

function getCompletedQuizActivity(quiz) {
	var i = 0;
	var number_of_correct_answers = 0;
	var completion_status = (quiz.completion_status ? quiz.completion_status : "");
	for(; i < quiz.questions.length; ++i){
		question_format_id = quiz.questions[i].question_format_id;
		if (quiz.questions[i].correct_answer_id == quiz.questions[i].user_answer_id)
			number_of_correct_answers++;		
	}
	
	score = (number_of_correct_answers / quiz.questions.length) * 100;
	var is_perfect = ((score == 100) ? "true" : "");
	var is_passed = ((score >= 80) ? "true" : "");
	var grade = ((is_perfect) ? "perfect" : (is_passed) ? "passed" : "failed");	
	
	return {
		activity_type : "quiz",
		activity_format : "html quiz",
		number_of_questions : quiz.questions.length,
		number_of_correct_answers : number_of_correct_answers,
		grade : grade,
		is_passed : "",
		is_perfect : "",
		was_perfect : ((completion_status == "perfect") ? "true" : "false"),
		was_passed : ((completion_status == "passed") ? "true" : "false"),
		disable_quiz : null
	}	
}

function determineAndSetResultsHtml(data) {
	var resultsString = "You have <span>" + data.number_of_correct_answers + " out of " + data.number_of_questions + "</span> right answers.";
	$j("#resultsScore h1").html(resultsString);
	$j('.pageArrowBack').hide();

    starsEarned = parseInt(data.stars_earned);
	if (data.assignment_completion_stars >= "100" || subject == 'phonics') {
		starsEarned += parseInt(data.assignment_completion_stars);
	}
	
	currentQuizGrade = data.grade;
	// Determine which image to show
    if(!fromAssessment) {
        if(!data.is_passed) {
            resultsImg = "<img class='robot-noStars' src='/images/robot-fail.png' />";
        }
        else {
            if(!data.is_perfect) {
                if(data.was_passed) {
                    resultsImg = "<img class='robot-noStars' src='/images/robot-passed-noStars.png' />";
                } else {
                    resultsImg = "<img src='/images/robot-passed.png' /><span class='numStars'>"+starsEarned+"</span>";
                }
            }
            else {
                if(data.was_perfect) {
                    resultsImg = "<img class='robot-noStars' src='/images/robot-perfect-noStars.png' />";
                } else {
                    resultsImg = "<img src='/images/robot-perfect.png' /><span class='numStars'>"+starsEarned+"</span>";
                }
            }
        }
    }
    else {
        resultsImg = "<img src='/images/robot-assessment.png' /><span class='numStars'>"+starsEarned+"</span>";
    }
    resultsImg += "</img></div>";
		
	// Determine which audio message to play
	var audioString = "";
	if(!fromAssessment) {
        if (data.disable_quiz){
            $j(".quiz.activityIconContainer").addClass("is-disabled").removeAttr('onclick').removeAttr('href');
        }
		if(!data.is_passed) {
			if (data.was_passed) {
				audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. Read the book again, or try a different book.</span>";
			} else {
				audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. Select the items with a <span class='icon icon-remove'></span> and choose the correct answers to earn stars. Use the book to help you find the correct answers.</span>";
				if (data.disable_quiz == "1") audioString = "<span class='audioSpan subHeading'>You did not pass this quiz. Read the book again before retaking the quiz.</span>";
			}
		}
		else if(!data.is_perfect) {
			audioString = "<span class='audioSpan subHeading'>Click on the items with a <span class='icon icon-remove'></span>, and choose the correct answers to earn more stars. Use the book to help you find the correct answers.</span>";
		}
		else {
			audioString = "<span class='audioSpan subHeading'>Super! You answered all of the questions correctly!</span>";
		}
	}
	else {
		if(data.is_perfect) {
			audioString = "Super! You answered all of the questions correctly! ";
		}

		if (subject == 'phonics') {
            audioString += "You have completed your benchmark!";
        } else {
            audioString += "You have completed your 3 step assignment!";
        }

	}
		
	$j("#resultsAudioString").html(audioString);
	$j("#resultsImgDiv").html(resultsImg);
    $j('.pageArrowForward').not('.pageArrowForward-home').hide();
	getQuizNumber();
	disableDoneButton();
}

function SubmitDataFromResponseArray() {
	var i = 0;
	var choice_answers = {};
	var open_answers = {};

	var returnData;
	var question_format_id;
	
	for(; i < responseArray.length; ++i){
		question_format_id = quiz.questions[i].question_format_id;
		if((responseArray[i].answerId)&&(question_format_id==1)) {
			choice_answers[responseArray[i].questionId] = responseArray[i].answerId;
			
		} else if(question_format_id==2){
			open_answers[responseArray[i].questionId] = responseArray[i].open_answer_text;
		}
	}

	$j.ajax({
		url : "/main/RecordStudentQuizCompletion",
		data: { "resource_deployment_id": html5ResourceDeploymentId, "choice_answers" : choice_answers, "open_answers": open_answers, "student-assignment-id": activityInfo.studentAssignmentId},
		type: "POST",
		success: function(data) {
            if (data === null) {
                window.location.replace('/main/StudentPortal');
            } else {
                submitCallback(data);
                if(data.badgeNotifications) {
                    showBadgePopups(data.badgeNotifications);
                }
                $j(".bookReference a.returnToBook").each(function() {
                    var _href = $j(this).attr("href");
                    pattern = "";
                    if (data.activity_id != undefined && parseInt(data.activity_id) > 0)
                        pattern = "/fromResults/"+data.activity_id;
                    if(!~_href.indexOf(pattern)) {
                        $j(this).attr("href", _href + pattern);
                    }
                    $j(this).addClass("disabled");
                });
            }
		},
		error:function(){
			showLoadingScreen(false);
			showErrorScreen(true);	
		}
		});
}
function showBadgePopups(badgeNotifications){
    var counter = 0;
    //badge.badge_type_description, badge.image_source, and badge.badge_display_name exist for each badge
    badgeNotifications.each(function(badge){
        $j('#all_badge_popups').append("<div class = \"badge_popup show\" style=\"bottom: " + counter*110 + "px\"> " +
            "<img src=\"" + badge.image_source + "\" height=\"20px\" width=\"20px\">" +
            "Congratulations! You earned the " + badge.badge_display_name + " badge! </div>");
        ++counter;
    });
    setTimeout(function(){ $j(".badge_popup").removeClass("show").addClass(""); }, 7500);
}
function playAudioResponse() {
	if(!fromAssessment) {
		if(!quizResults.isPassed) {
			$j("#resultsReread")[0].play();
		}
		else if(!quizResults.isPerfect) {
			$j("#resultsRetake")[0].play();
		}
		else {
			$j("#resultsSuper")[0].play();
		}
	} else if (subject != 'phonics') {
		$j("#resultsAssessment")[0].play();
	}
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//							Question Change									//
//																			//
//////////////////////////////////////////////////////////////////////////////

function changeQuizNav(questionIndex) {
	var selected = $j(".quizNav").find(".selected").removeClass("selected");	
	var selectedQuestionIndex = selected.parent().index();
	var isAnswered = false;
	if(selectedQuestionIndex >= 0 ){
	   if(quiz.questions[selectedQuestionIndex]){
		   var correct_answer_id = quiz.questions[selectedQuestionIndex].correct_answer_id;		
		   if(correct_answer_id){
			   if ($j(".answers").find(".active").length>0 ){
				isAnswered = true;
			   }
		   } else if ($j(".crAnswerBox").val()){
				     if ($j(".crAnswerBox").val().length>0 ){
						isAnswered = true;
					  }
		   }
	}
	}else{
		if ($j(".answers").find(".active").length>0 ){
			isAnswered = true;
		}
	}
	
	if((isAnswered && !isDoneButton(selected)) || isCompletedQuestion(selected)) { 
		selected.addClass("active");
	} else {
		selected.removeClass("active");
	}
		
	var chosen = $j(".quizNav .button:eq(" + questionIndex + ")");
	chosen.removeClass("active");
	chosen.addClass("selected");
	getQuizNumber();
	var quizNumber = quizIndex;
	if (quizIndex == 0) {
		$j(".pageArrowBack").hide();
	} else {
		$j(".pageArrowBack").show();
	}
	
	$j(".question").show();
	$j(".pageArrowForward-home").hide();
	if (quizNumber + 1 == quiz.questions.length && isQuizComplete()){
		$j('#forward-page').show();
		$j(".quizContent").removeClass("rewardPage");
	} else if (quizNumber + 1 >= quiz.questions.length && !isQuizComplete()) {
		if ($j('a.button.doneOn').hasClass("selected")) {
			$j(".question").hide();
			$j(".quizContent").addClass("rewardPage book-landscape");
			setResultsNavigationLinks();
		} else if (quizNumber + 1 == quiz.questions.length) {
			$j('.pageArrowForward').hide();
			$j(".quizContent").removeClass("rewardPage");
		}
	} else {
		$j(".quizContent").addClass("rewardPage");
		if(quizNumber + 1 < quiz.questions.length) {
		    $j('#forward-page').show();
			$j('.pageArrowForward').removeClass('pageArrowForward-done').text('Next');
			$j(".quizContent").removeClass("rewardPage");
        } else {
        	setResultsNavigationLinks();
        }
	}

	if(isPreview && quizNumber + 1 == quiz.questions.length && isQuizComplete()) {
		$j('#forward-page').hide();
	}
	
}

function isAllAnswersCorrect() {
	var totalCorrect = 0;
	var totalMultipleChoice = 0
	$j( ".quizNav li" ).each(function( index ) {
		if ($j(this).find('a').hasClass("correct")) {
			totalCorrect++;			
		}
		if ($j(this).find('a').hasClass("correct") || $j(this).find('a').hasClass("incorrect")) {
			totalMultipleChoice++;			
		}
	});

	if (totalCorrect == totalMultipleChoice && totalCorrect > 0) {
		return true;
	}
	
	return false;
}

function changeQuestionText(questionIndex) {
	$j(".question").empty();
	
	var question = quiz.questions[questionIndex];
	var questionText = replaceImageAndAudioIfPossible(question.question, question.images, false, question.question_audio);
	$j(".question").html(questionText);
}

function changeAnswers(questionIndex) {
	$j(".answers").children().empty();
	
	var correct_answer_id = quiz.questions[questionIndex].correct_answer_id;	

	if (isCurrentQuestionCorrect())
		responseArray[questionIndex].isCorrect = true;
	
	var wordCountDiv = 'wordCount';

    if(correct_answer_id){
          var i = 0; var numChoices = quiz.questions[questionIndex].choices.length;
          for(; i < numChoices; ++i) {
                 var letter = String.fromCharCode(65 + i);
                 var choice = quiz.questions[questionIndex].choices[i];
                 var answerText = replaceImageAndAudioIfPossible(choice.answer, choice.images, true, choice.answer_audio);
                 
                 var appendString = "<li><a ";
                        appendString += (isSelectedAnswer(questionIndex, choice.answer_id)) ? "class='active' " : "";
                        appendString += (isCurrentQuestionCorrect()) ? "><span class='answersBtn disabled'>" : "><span class='answersBtn'>";
                        appendString += String.fromCharCode(65 + i) + "</span></a> ";
                        appendString += "<span class='answerText'>" + answerText + "</span></li>";
                 
                 $j(".answers").children("ul").append(appendString);               
        }
    } else if (responseArray[questionIndex].open_answer_text && responseArray[questionIndex].open_answer_text.length > 1 && quiz.questions[questionIndex].question_format_id == 2) {
       var appendAnswerBox ='<li>';
       var isChrome = window.chrome;
       var openAnswerLength;
		if(isChrome) {
	        openAnswerLength =  responseArray[questionIndex].open_answer_text.replace(/\r\n/g, '\n')     
	       .replace(/\r/g, '\n')       
	       .replace(/\n/g, '\r\n').length;
	  	} else {
	  		openAnswerLength = responseArray[questionIndex].open_answer_text.length;
	  	}
       var charactersRemaining = maxConstructedResponseLength - openAnswerLength;
           appendAnswerBox +='<span >';
           appendAnswerBox +='<label class="box lg"><strong class="floatR" id="wordCount">' + charactersRemaining + '</strong></label>';          
           appendAnswerBox +='<textarea maxlength =' + maxConstructedResponseLength + ' class="crAnswerBox active"' + ' onkeyup="clg.commonUtils.textAreaWordCountDown(' + maxConstructedResponseLength + ', this, '+wordCountDiv+');">';
           appendAnswerBox +='</textarea>';
           appendAnswerBox += "</span></li>";
           $j(".answers").children("ul").append(appendAnswerBox);
           $j(".crAnswerBox").text(responseArray[questionIndex].open_answer_text);
 } else {
       var appendAnswerBox ='<li>';
           appendAnswerBox +='<span >';
           appendAnswerBox +='<label class="box lg"><strong class="floatR" id="wordCount">' + maxConstructedResponseLength + '</strong></label>';
           appendAnswerBox +='<textarea maxlength =' + maxConstructedResponseLength + ' class="crAnswerBox" placeholder="Type your answer here..."' + ' onkeyup="clg.commonUtils.textAreaWordCountDown(' + maxConstructedResponseLength + ', this, '+wordCountDiv+');">';
           appendAnswerBox +='</textarea>';
           appendAnswerBox += "</span></li>";
          $j(".answers").children("ul").append(appendAnswerBox);
                        
      }


}

function replaceImageAndAudioIfPossible(originalText, imageArray, isAnswer, audioUrl) {
	if(imageArray !== undefined) {
		// Pulls out the digits in the string "{img:ddd}"
		var imageId = originalText.match(/{img:(\d+)}/);
		
		var img = "<img src=" + imageArray[imageId[1]].url;
			img += (isAnswer) ? " class='choiceImg'>" : " class='questionImg'>";		

		originalText = originalText.replace(/{img:[\d]+}/, img);
	}
	
	if(audioUrl !== undefined && audioUrl != "") {
		originalText = "<span class='audioLoad'>" + originalText + "</span>";
		originalText += "<audio src='" + audioUrl + "'></audio>";
	}
	
	return originalText;
}

function checkmarkAnswerIfQuestionIsCorrect(questionIndex) {
	if(isCurrentQuestionCorrect()) {
		var index = getIndexOfCorrectAnswer(questionIndex);
		var correctAnswer = $j(".answers ul li:eq(" + index + ") a");

		correctAnswer.html("<span class='answersBtn correct'><span class='icon icon-ok'></span></span>");
	}
}

function getIndexOfCorrectAnswer(questionIndex) {
	var i = 0;
	var numChoices = quiz.questions[questionIndex].choices.length;
	for(; i < numChoices; ++i) {
		if(quiz.questions[questionIndex].choices[i].answer_id == responseArray[questionIndex].answerId) {
			return i;
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//																			//
//								Misc										//
//																			//
//////////////////////////////////////////////////////////////////////////////

function resetResultsDiv() {
	$j("#results").children(":not(audio)").remove();
	
	var selected = $j(".quizNav").find(".selected");
	if (isDoneButton(selected)) {
		$j(".quizContent").addClass("rewardPage book-landscape");
		$j(".quizContent").append("<a class='pageArrowForward pageArrowForward-home' id='resultsHome' href='" + navigationLink + "'>Home</a>");
	}
	
	if ($j('#results').css("display") == "block") {
		$j(".question").hide();
		setResultsNavigationLinks();
	}

    if (fromAssessment) {
        $j("#results").append("<div id='resultsScore'><p id='resultsAudioString'></p></div>");
        setupBenchmarkRewardPage();
    } else {
        $j("#results").append("<div id='resultsScore'><h1></h1><p id='resultsAudioString'></p></div>");
    }

	$j("#results").append("<div class='rewardRobot' id='resultsImgDiv'></div>");
	$j("#results").append("<div class='clear'></div>");
	var assignmentParam = "";
    if (activityInfo.studentAssignmentId != "false" && $j.isNumeric(activityInfo.studentAssignmentId)) {
        assignmentParam = '/student-assignment-id/' + activityInfo.studentAssignmentId;
    }
    if (isBookReviewFavoritesFeatureEnabled && canFavoriteResource) {
        $j('#results').append(
            "<div class='favorite-button'>" +
                "<a id='favorite_"+ kidsBookId +"' class='favorite tool tool-alt' title='Favorite this book!'><span class='icon icon-heart'></span></a>" +
            "</div>"
        );
        if (isFavorite) {
            $j('.favorite').addClass('is-active');
        }
        var favorite = clg.razKids.FavoriteController($j);
        $j('.favorite').click(function(){
            favorite.toggleFavorite($j(this));
        });
    }
	if (listenInfo.resourceDeploymentId && !fromAssessment) {
		$j("#results").append(
			"<a class='listen activityIconContainer activityIconContainer-lg' href='"+listenInfo.href+assignmentParam+"'>" +
			"	<span class='icon icon-listenC'></span>" +
			"</a>"
		);
		if (listenInfo.completionStatus == "true") {
			$j(".activityIconContainer.listen").addClass("activityIconContainer-perfect").append(
			"	<img class='icon-perfect' src='/images/icons/ico-complete-perfect.png' style='display: block;' />"
			);
		}
	}
	
	if (readInfo.resourceDeploymentId && !fromAssessment) {
		$j("#results").append(
			"<a class='read activityIconContainer activityIconContainer-lg' href='"+readInfo.href+assignmentParam+"'>" +
			"	<span class='icon icon-readC'></span>" +
			"</a>"
		);
		if (readInfo.completionStatus == "true") {
			$j(".activityIconContainer.read").addClass("activityIconContainer-perfect").append(
			"	<img class='icon-perfect' src='/images/icons/ico-complete-perfect.png' style='display: block;' />"
			);
		}
	}
	
	if (quizInfo.resourceDeploymentId && !fromAssessment) {
		if (quizResults.isPerfect == "" && (quizResults.isPassed == "1" || quizResults.isPassed == "")) {
			$j("#results").append(
				"<a class='quiz activityIconContainer activityIconContainer-lg' href='#' onclick='goToFirstIncorrectQuestion(); return false;'>" +
				"	<span class='icon icon-quizC'></span>" +
				"</a>"
			);
		} else {
            $j("#results").append(
                "<a class='quiz activityIconContainer activityIconContainer-lg' href='"+quizInfo.href+assignmentParam+"'>" +
                "	<span class='icon icon-quizC'></span>" +
                "</a>"
            );
		}
		
		if (quizInfo.completionStatus == "perfect" || quizResults.isPerfect) {
			$j(".activityIconContainer.quiz").addClass("activityIconContainer-perfect").append(
			"	<img class='icon-perfect' src='/images/icons/ico-complete-perfect.png' style='display: block;' />"
			);
		} else if (quizInfo.completionStatus == "passed" || quizResults.isPassed) {
			$j(".activityIconContainer.quiz").addClass("activityIconContainer-complete").append(
			"	<img class='icon-complete' src='/images/icons/ico-complete.png' style='display: block;' />"
			);
		}
	}
}

function resetResultsCompletionDiv() {
	$j("#results").children(":not(audio)").remove();
	
	var selected = $j(".quizNav").find(".selected");
	if (isDoneButton(selected)) {
		$j(".quizContent").addClass("rewardPage book-landscape");
		$j(".quizContent").append("<a class='pageArrowForward pageArrowForward-home' id='resultsHome' href='" + navigationLink + "'>Home</a>");
	}
	
	$j(".question").hide();
	setResultsNavigationLinks();
	
	$j("#results").append("<div id='resultsScore'><h1></h1><p id='resultsAudioString'></p></div>");
	$j("#results").append("<div class='rewardRobot' id='resultsImgDiv'></div>");
	$j("#results").append("<div class='clear'></div>");
	$j("#results").append("<h1 class='resultsHeading marginB5'>Assignment Complete!</h1>");
}

function setResultsNavigationLinks() {
	$j("#forward-page").hide();
	$j("#back-page").hide();
	$j(".pageArrowForward.pageArrowForward-home").show();
	$j(".pageArrowForward.pageArrowForward-home").text('Home');
}

function setupBenchmarkRewardPage() {
    if($j(".backBtn").length === 0) {
        if (subject === 'phonics') {
            $j(".ebookHeader").prepend("<a href='" + navigationLink + "' class='backBtn'>Headsprout</a>");
        } else if (subject === 'reading') {
            $j(".ebookHeader").prepend("<a href='" + navigationLink + "' class='backBtn'>Reading</a>");
        }
    }
    $j(".quizNav").remove();
    $j(".quizHeader").css("height",60);
    $j(".quizContent.rewardPage").css("padding-bottom",0);
}

function showLoadingScreen(showLoad) {
	if(showLoad) {
		$j("#contentArea").prepend("<div id='quizLoading'></div>");
		$j("#quizLoading").height($j("#quizContent").height());
		$j("#quizContent").hide();
	}
	else {
		$j("#quizLoading").remove();
		$j("#quizContent").show();
	}
}

function showErrorScreen(showError) {
	if(showError) {
		$j("#contentArea").prepend("<div id='quizError'></div>")
		$j("#quizError").height("100%");
		$j("#quizContent").remove();
		
		$j("#quizError").prepend("<div class='errorMessage'>Error encountered when recording quiz results.<br>Please try again.</div>");
		$j("#quizError").prepend("<div class='errorSpacer'></div>");
	}
	else {
		$j("#quizError").remove();
		$j("#quizContent").show();
	}
}

function pauseAndResetAudioClips() {
	var audioTags = $j("audio");
	if(audioTags) {
		audioTags.each(function() {
			var audioElement = $j(this)[0];
			if(audioElement.duration) {
				audioElement.pause();
				audioElement.currentTime = 0;
			}
		});
	}
}

function isDoneButton(button) {
	return (button.hasClass("doneOn") || button.hasClass("doneOff"));
}

function isCompletedQuestion(button) {
	return (button.hasClass("correct") || button.hasClass("incorrect"));
}

function isCurrentQuestionCorrect() {
	return $j(".quizNav .button.selected").hasClass("correct");
}

function isSelectedAnswer(questionIndex, answerId) {
	return (responseArray[questionIndex].answerId == answerId);
}

function isQuizComplete() {
	var i = 0; var complete = true;
	var length = responseArray.length;
	for(; i <length; ++i) {
		if(responseArray[i].question_format_id ==1 && !responseArray[i].answerId){
			complete = false;
		}
	}
	return complete;
}

function enableDoneButtonIfQuizComplete() {
	if(isQuizComplete() && !isPreview) {
		$j(".doneOff").removeClass("doneOff").addClass("doneOn");
		if ($j('.question').css("display") == "block")
			$j('#forward-page').show();		
	}
}

function disableDoneButton() {
	$j(".doneOn").removeClass("doneOn").addClass("doneOff");
}

function disableQuestions() {
	$j(".quizNav a").each(function() {
		$j(this).removeAttr("href");
		$j(this).removeClass("active").addClass("disabled");
	});
}

function zeroPad(number, width) {
	number = number.toString();
	while(number.length < width) {
		number = "0" + number;
	}
	
	return number;
}

function validateAndZeroIndexStartQuestionNumber(quiz) {
	if(quiz.start_question_number >= 1 && quiz.start_question_number <= quiz.questions.length) {
		return quiz.start_question_number - 1; // Comes in 1-indexed, must be 0-indexed
	}
	else {
		return 0;
	}
}

function atLeastOneQuestionAnswered() {
	for(var i = 0; i < responseArray.length; ++i) {
		if(responseArray[i].answerId || responseArray[i].open_answer_text) {
			return true;
		}
	}
	return false;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//																													//
//											Bookmarking Functions													//
//																													//
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function bookmarkAndRedirect(leave, caller) {
	var i = 0;
	var choice_answers = {};
	var open_answers = {};
	var returnData;
	var question_format_id;
	
	for(; i < responseArray.length; ++i){
		question_format_id = quiz.questions[i].question_format_id;
		if(question_format_id==1) {
			choice_answers[responseArray[i].questionId] = responseArray[i].answerId;
		} else if(question_format_id==2){
			open_answers[responseArray[i].questionId] = responseArray[i].open_answer_text;
		}
	}
	
	if (currentQuizGrade == "perfect" && quiz_result_id == null && isAllAnswersCorrect()) shouldBookmark = false;
	if (caller != "returnToBook" && currentQuizGrade == "passed") shouldBookmark = false;
	if(shouldBookmark && atLeastOneQuestionAnswered()) {
		var currentQuestion = $j(".quizNav .button.selected");
		var questionNumber = currentQuestion.parent().index() + 1; // Must be 1-indexed
						
		shouldBookmark = false;
		 $j.ajax({
			url : '/main/HTML5QuizPlayerService/action/bookmark_incomplete_quiz',
			data: {' kidsBookId':kidsBookId, 'resource_deployment_id': html5ResourceDeploymentId, 'withinQuiz':1, 'questionNumber': questionNumber, 'choice_answers' : choice_answers, 'open_answers': open_answers},
			type: "POST",
			async: false,
			success: function(data) {
				bookmarkCallback(data, caller);
			},
			error:function(){
				bookmarkFailure(data);
				showLoadingScreen(false);
				showErrorScreen(true);
			}
		});
	}
	else if(leave) {
		window.location = $j('.backBtn').attr('href');
	}
}

function bookmarkCallback(data, caller) {
	if (caller) {
		window.location = $j('.'+caller).attr('href');
	} else {
		window.location = $j('.backBtn').attr('href');
	}
}

function bookmarkFailure(data) {
	window.location = $j('.backBtn').attr('href');
}

function goToFirstIncorrectQuestion() {
	questionIndex = 0;
	$j(".quizNav .button").each(function(index) {
		if ($j(this).hasClass("incorrect")) {
			questionIndex = index;
			return false;
		}
	});	
	changeQuestion(questionIndex);
}
