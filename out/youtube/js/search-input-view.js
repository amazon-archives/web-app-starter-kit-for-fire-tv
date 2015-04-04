/* Search Input View
 *
 * Search Widget for a row view container like the left nav view. 
 * 
 */
(function (exports) {
    "use strict";


   /**
    * @class SearchInputView
    * @description The search row in the left nav view. 
    */
    function SearchInputView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['searchQueryEntered']);
        this.currentSearchQuery = null;
        this.$el = null;
        
        this.render = function ($parent) {
            var html = utils.buildTemplate($("#search-input-template"), {});
  
            $parent.html(html);

            this.$el = $parent.children().eq(0);
            this.$el.on("change", this.searchQueryEntered);
        };

        this.searchQueryEntered = function(e) {
            this.currentSearchQuery = e.target.value;
            this.trigger("searchQueryEntered");
       }.bind(this);

       this.select = function () {
            this.$el.focus();
       }.bind(this);

       this.reset = function () {
            this.currentSearchQuery = null;
            this.$el.val("");
       }.bind(this);

       this.deselect = function () {
            this.$el.blur();
       }.bind(this);
    }

    exports.SearchInputView = SearchInputView;
}(window));
