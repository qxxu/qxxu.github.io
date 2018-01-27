var VocabNoteCard = function (parentMenu, highlighter, word) {
	this.parentMenu = parentMenu;
    this.highlighter = highlighter;
    this.word = word;
    this.vocabWordId = this.word.vocabWordId;
    this.vocabDiv = $j('#vocab-note-card-' + this.vocabWordId);
}

VocabNoteCard.prototype.removeVocabInfo = function () {
    if (this.vocabDiv)
        this.vocabDiv.remove();
 }

VocabNoteCard.prototype.stageVocabDiv = function () {
    var _this = this;
    this.vocabDiv.html('');

    var headerElt = $j(document.createElement('div')).attr('id', 'vocab-data-header');
	    var wordElt = $j(document.createElement('span')).attr('id', 'vocab-data-word-' + this.vocabWordId);
	    var partSpeechElt = $j(document.createElement('em')).attr('id', 'vocab-data-partspeech-' + this.vocabWordId);
	    var closeIconWrapper = $j(document.createElement('span')).addClass('btn-close')
	    	var closeIconElt = $j(document.createElement('span')).addClass('icon icon-remove').click(function () { _this.vocabDiv.hide(); });
	    closeIconWrapper.append(closeIconElt);
    headerElt.append(wordElt, partSpeechElt, closeIconWrapper);

    var vocabBody = $j(document.createElement('div')).attr('class', 'vocab-body');
	    var vocabImg = $j(document.createElement('div')).attr('class', 'vocab-image');
		    var imageWrapper = $j(document.createElement('div')).attr('id', 'vocab-data-imagename-' + this.vocabWordId);
		    var imageCreditElt = $j(document.createElement('div')).attr('id', 'vocab-data-imagecredit-' + this.vocabWordId).attr('class', 'vocab-image-credit');
	    vocabImg.append(imageWrapper, imageCreditElt);
	    var vocabHeading = $j(document.createElement('h2')).attr('id', 'vocab-def-header').html('Definition');
	    var vocabDefinition = $j(document.createElement('p')).attr('id', 'vocab-data-definition-' + this.vocabWordId);
	    var vocabSentenceHeading = $j(document.createElement('h2')).attr('id', 'vocab-sentence-header').html('Sample Sentence');
	    var vocabSentence = $j(document.createElement('p')).attr('id', 'vocab-data-closesentence-' + this.vocabWordId);
	    var clearFloat = $j(document.createElement('div')).attr('class', 'clear');
    vocabBody.append(vocabImg, vocabHeading, vocabDefinition, vocabSentenceHeading, vocabSentence, clearFloat);

    this.vocabDiv.append(headerElt, vocabBody)
}

VocabNoteCard.prototype.displayVocabData = function () {
    var service = 'EBookService';
    if(isPreview) {
        service = "PreviewNoteService";
    }
    this.highlighter.unhighlightAllWords();
    if (!this.vocabDiv.length) {
        var _this = this;
        this.removeVocabInfo();
        this.vocabDiv = $j(document.createElement('div')).attr('id', 'vocab-note-card-' + this.vocabWordId).attr('class', 'vocab-card');
        this.vocabDiv.html($j(document.createElement('div')).attr('id', 'vocab-data-loader'));
        $j('body').append(this.vocabDiv)
        $j.ajax({
            type: "GET",
            url: "/main/" + service + "/action/getVocabData/word_info_id/" + this.word.infoId,
            success: function (response) {
                function capitalizeFirstLetter (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                };
                _this.stageVocabDiv();
                response.closesentence = response.sample_sentence.replace(new RegExp(response.word, "gi"), function(match) { return '<em>' + match + '</em>'; });
                $j.each(response, function (key, value) {
                    if (value) {
                        $j('#vocab-data-' + key + '-' + _this.vocabWordId).html((key == 'imagename' ? '<img src="' + value + '">'  : capitalizeFirstLetter(value)))
                    }
                });
                if (response.audio_url) {
                    var listenLink = $j(document.createElement('a'));
                    listenLink.attr('id', 'vocab-data-listen-icon').html('<span class="icon icon-audioC"></span>')
                    listenLink.click(function(e){_this.parentMenu.listenToHighlightedWord(e.target, _this.word);});
                    $j('#vocab-note-card-' + _this.vocabWordId).find('#vocab-data-header').append(listenLink)
                }
                $j(document).click(function(event) {
                    if(!$j(event.target).closest('#vocab-note-card-' + _this.vocabWordId).length && !$j(event.target).closest('.highlight-menu-item').length) {
                        _this.vocabDiv.hide();
                    }
                });
            }
        });
    } else {
        this.vocabDiv.show();
    }
}
