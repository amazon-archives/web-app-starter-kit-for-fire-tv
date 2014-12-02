/* Model
 *
 * Model for sample data
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    var MediaModel = function (dataURL) {

         this.mediaData       = [];
         this.categoryData    = [];
         this.currCategoriesData = [];
         this.currentCategory = 0;
         this.currentItem     = 0;
         this.defaultTheme    = "default";

        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
            //get all of the available unique genres in our sample data.
            $.getJSON(dataURL, function (jsonData) {
                this.categoryData = [];
                this.currentCategory = 0;
                this.mediaData = jsonData.media;
                this.modelData = jsonData;

                for (var i = 0; i < this.mediaData.length; i++) {
                    var data = this.mediaData[i];
                    var currCategories = data.categories;
                    if (currCategories) {
                        $.merge(this.categoryData, currCategories);
                    }
                 }

                 $.unique(this.categoryData);

                 //this.sortAlphabetically(this.categoryData);
                 dataLoadedCallback();
            }.bind(this));
        };

       /***************************
        *
        * Utilility Methods
        *
        ***************************/
       /**
        * Sort the data array alphabetically
        * This method is just a simple sorting example - but the
        * data can be sorted in any way that is optimal for your application
        */
        this.sortAlphabetically = function (arr) {
            arr.sort();
        };

       /***************************
        *
        * Media Data Methods
        *
        ***************************/
        /**
         * For single views just send the whole media object
         */
         this.getAllMedia = function () {
             return mediaData;
         },

       /***************************
        *
        * Category Methods
        *
        ***************************/
        /**
         * Hang onto the index of the currently selected category
         * @param {Number} index the index into the categories array
         */
         this.setCurrentCategory = function (index) {
             this.currentCategory = index;
         },

       /***************************
        *
        * Content Item Methods
        *
        ***************************/
        /**
         * Return the category items for the left-nav view
         */
         this.getCategoryItems = function () {
             return this.categoryData;
         };

        /**
         * Get and return data for a selected category
         * @param {Function} categoryCallback method to call with returned requested data
         */
         this.getCategoryData = function (categoryCallback) {
            this.currCategoriesData = [];

            for (var i = 0; i < this.mediaData.length; i++) {
                if ($.inArray(this.categoryData[this.currentCategory], this.mediaData[i].categories) > -1) {
                    this.currCategoriesData.push(this.mediaData[i]);
                }
            }
            categoryCallback(this.currCategoriesData);
         };

       /**
        * Store the refrerence to the currently selected content item
        * @param {Number} index the index of the selected item
        */
        this.setCurrentItem = function (index) {
            this.currentItem = index;
            this.currentItemData = this.currCategoriesData[index];
        };

       /**
        * Retrieve the reference to the currently selected content item
        * @param {Number} index the index of the selected item
        */
        this.getCurrentItemData = function () {
            return this.currentItemData;
        };
    };

    exports.MediaModel = MediaModel;

})(window);


