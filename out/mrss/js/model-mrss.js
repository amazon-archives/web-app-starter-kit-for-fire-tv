/* Model
 *
 * Model for MRSS feed data 
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    // {Object} appSettings are the user-defined settings from the index page
    function MRSSMediaModel(appSettings) {

         this.mediaData       = [];
         this.categoryData    = [];
         this.currData = [];
         this.currentCategory = 0;
         this.currentItem     = 0;
         this.defaultTheme    = "default";
         this.currentlySearchData = false;

        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
             $.ajax({
                 url: appSettings.dataURL,
                 type: 'GET',
                 crossDomain: true,
                 dataType: 'xml',
                 context : this,
                 cache : true,
                 success: function() {
                     var contentData = arguments[0];
                     this.handleXMLData(contentData);
                 }.bind(this),
                 error: function() {
                     console.log(arguments);
                 },
                 complete: function() {
                     dataLoadedCallback();
                 }
             });
        }.bind(this);

       /**
        * Handles mrss feed requests that return XML data 
        * @param {Object} xmlData data returned from request
        */
        this.handleXMLData = function (xmlData) {
            var $xml = $(xmlData);
            var cats = [];
            var itemsInCategory = []; 

            $xml.find("item").each(function() {
                var $this = $(this);
                var item = {
                    title: $this.find("title").text(),
                    link: $this.find("link").text(),
                    description: $this.find("description").eq(0).text(),
                    pubDate: exports.utils.formatDate($this.find("pubdate").text()),
                    author: $this.find("author").text(),
                    imgURL: $this.find("image").text(),
                    thumbURL: $this.find("image").text(),
                    videoURL: $this.find("url").text()
                };

                $this.find("category").each(function() {
                    var category = $(this).text();
                    category = category.replace(/&amp;/g, '&');

                    itemsInCategory[category] = itemsInCategory[category] || [];
                    itemsInCategory[category].push(item);

                     //make sure we don't have an empty category
                    if(category.length > 0) {
                        cats.push(category);
                    }
                });
            });

            $.unique(cats); // purge duplicates.
            this.categories = cats;
            this.categoryData = cats;
            this.mediaData = itemsInCategory;
            this.setCurrentCategory(0);
        }.bind(this);

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
         };

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
         };

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
             this.currData = this.mediaData[this.categoryData[this.currentCategory]];
             categoryCallback(this.currData);
         };   

        /**
         * Get and return data for a search term
         * @param {string} searchTerm to search for
         * @param {Function} searchCallback method to call with returned requested data
         */
         this.getDataFromSearch = function (searchTerm, searchCallback) {
            this.currData = [];
            for (var i = 0; i < this.mediaData.length; i++) {
                if (this.mediaData[i].title.toLowerCase().indexOf(searchTerm) >= 0 || this.mediaData[i].description.toLowerCase().indexOf(searchTerm) >= 0) {
                    this.currData.push(this.mediaData[i]);
                }
            }
            searchCallback(this.currData);
         };

       /**
        * Store the refrerence to the currently selected content item
        * @param {Number} index the index of the selected item
        */
        this.setCurrentItem = function (index) {
            this.currentItem = index;
            this.currentItemData = this.currData[index];
        };

       /**
        * Retrieve the reference to the currently selected content item
        */
        this.getCurrentItemData = function () {
            return this.currentItemData;
        };
    }

    exports.MRSSMediaModel = MRSSMediaModel;
})(window);


