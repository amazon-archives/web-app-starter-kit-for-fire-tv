/* SubCategory View
 *
 * Handles the subcategory view which is a OneD view with a different title.  
 * 
 */
(function (exports) {
    "use strict";

    function SubCategoryView() {

        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['noContent', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce', 'loadComplete']);

        this.$el = null;

        this.oneDView = null;

       /**
        * Hides the subcat view
        */
        this.hide = function () {
            this.$el.css("opacity", "0");
            this.oneDView.hide();
        };

        /**
         * Display the subcat view
         */
        this.show = function () {
            this.$el.css("opacity", "");
            this.oneDView.show();
        };

        this.fadeIn = function() {
            this.$el.css("opacity", "");
            this.oneDView.fadeIn();
        };

        this.fadeOut = function() {
            this.$el.css("opacity", "0");
            this.oneDView.fadeOut();
        };

        /**
         * Remove the subcat view
         */
        this.remove = function () {
            this.oneDView.remove();
            this.$el.remove();
        };

        /**
         * Creates the subcategory view from the template and appends it to the given element
         */
        this.render = function ($el, title, rowData, displayButtonsParam) {
            var html = utils.buildTemplate($("#subcategory-view-template"), {"title": title});
            $el.append(html);
            this.$el = $el.children().last();

            this.oneDView = new OneDView();
            this.oneDView.render(this.$el, rowData, displayButtonsParam);
            
            // set up oneD handlers to uplevel events...

            this.oneDView.on('noContent', function() {
                this.trigger('noContent');
            }, this);

            this.oneDView.on('exit', function() {
                this.trigger('exit');
            }, this);
            
            this.oneDView.on('startScroll', function(direction) {
                this.trigger('startScroll', direction);
            }, this); 
            
            this.oneDView.on('indexChange', function(index) {
                this.trigger('indexChange', index);
            }, this);
            
            this.oneDView.on('stopScroll', function(index) {
                this.trigger('stopScroll', index);
            }, this);
            
            this.oneDView.on('select', function(index) {
                this.trigger('select', index);
            }, this);
            
            this.oneDView.on('bounce', function(direction) {
                this.trigger('bounce', direction);
            }, this);
            
            this.oneDView.on('loadComplete', function() {
                this.trigger('loadComplete');
            }, this);
        };

        this.changeIndex = function(index) {
            this.oneDView.changeIndex(index);
        }.bind(this);
        
       /**
        * Key event handler
        * passes controls to the OneDView
        */
        this.handleControls = function (e) {
            this.oneDView.handleControls(e);
        }.bind(this);
    }

    exports.SubCategoryView = SubCategoryView;
}(window));
