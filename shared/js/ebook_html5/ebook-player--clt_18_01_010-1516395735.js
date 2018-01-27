
/*****************************************************************
 * 
 * Player Class and functions
 * 
 * @param {json} playerData
 * @param {Object} bookRef
 *      reference to the Book that owns this object
 ****************************************************************/
var Player = function(playerData, bookRef){
    this.data = playerData;
    this.curPage = 0;
    this.book = bookRef;
    this.pageIterator = new Iterator(this.data);
    this.sectionIterator = null;
    this.phraseIterator = null;
    this.wordIterator = null;
    this.timer = null;

    var _this = this;
    
};

Player.prototype.goToPage = function(pageNoIndex, isBookStart, listenBookPageId) {
    _this = this;
    $j("#pageNumber").val(_this.data[pageNoIndex].page_number);
    if (listenBookPageId > 0) {
    	$j("#currentBookPageId").val(listenBookPageId);
    } else {
    	$j("#currentBookPageId").val('');
    }
    var pageIndex = pageNoIndex;
    if (this.pageIterator.getKey() < pageIndex){
        while(this.pageIterator.getKey() < pageIndex){
            this.pageIterator.next();
        }
    } else if (this.pageIterator.getKey() > pageIndex){
        while(this.pageIterator.getKey() > pageIndex){
            this.pageIterator.previous();
        }
    }
};

Player.prototype.resetIteratorsFromPage = function(){
    this.sectionIterator = new Iterator(this.pageIterator.getValue()["sections"]);
    this.phraseIterator = new Iterator(this.sectionIterator.getValue()["phrases"]);
    this.wordIterator = new Iterator(this.phraseIterator.getValue()["words"]);
};
