/* Model
 *
 * Model for JSON data 
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    // {Object} appSettings are the user-defined settings from the index page
    var JSONMediaModel = function (appSettings) {
         this.mediaData       = [];
         this.categoryData    = [];
         this.currData = [];
         this.currentCategory = 0;
         this.currentItem     = 0;
         this.defaultTheme    = "default";
         this.currentlySearchData = false;
         this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
             $.ajax({
                 url: appSettings.dataURL,
                 type: 'GET',
                 crossDomain: true,
                 dataType: 'json',
                 context : this,
                 cache : true,
                 success:function() {
                     var contentData = arguments[0];
                     this.handleJsonData(contentData);
                 },
                 error:function() {
                     console.log(arguments);
                 },
                 complete:function() {
                     dataLoadedCallback();
                 }
             });
        }.bind(this);

       /**
        * Handles requests that contain json data
        * @param {Object} jsonData data returned from request
        */
        this.handleJsonData = function (jsonData) {
            this.categoryData = [];
            this.currentCategory = 0;
            this.mediaData = jsonData.media;

            // gather all the unique category names into a single list
            for (var i = 0; i < this.mediaData.length; i++) {
                var mediaCats = this.mediaData[i].categories;
                if (mediaCats) {
                    for (var j = 0; j < mediaCats.length; j++) {
                        if (this.categoryData.indexOf(mediaCats[j]) < 0) {
                            this.categoryData.push(mediaCats[j]);
                        }
                    }
                }
            }
            this.categoryData.sort();

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

       /**
        * Convert unix timestamp to date
        * @param {Number} d unix timestamp
        * @return {Date}
        */
        this.unixTimestampToDate = function (d) {

            var unixTimestamp = new Date(d*1000);

            var year   = unixTimestamp.getFullYear();
            var month  = this.months[unixTimestamp.getMonth()];
            var date   = unixTimestamp.getDate();
            var hour   = unixTimestamp.getHours();
            var minute = unixTimestamp.getMinutes();
            var second = unixTimestamp.getSeconds();

            return date + ',' + month + ' ' + year + ' ' + hour + ':' + minute + ':' + second ;
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
             this.currData = []; 
             for (var i = 0; i < this.mediaData.length; i++) {
                 if ($.inArray(this.categoryData[this.currentCategory], this.mediaData[i].categories) > -1) {
                     this.currData.push(this.mediaData[i]);
                 }   
             }   
             categoryCallback(this.currData);
         };   

        /**
         * Get and return data for a search term
         * @param {string} term to search for
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
         * Get and return data for a search term
         * @param {string} term to search for
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
        * @param {Number} index the index of the selected item
        */
        this.getCurrentItemData = function () {
            return this.currentItemData;
        };
    };

    exports.JSONMediaModel = JSONMediaModel;

})(window);


