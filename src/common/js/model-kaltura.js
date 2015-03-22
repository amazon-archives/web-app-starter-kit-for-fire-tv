/* Model
 *
 * Model for Kaltura provided data 
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    // {Object} appSettings are the user-defined settings from the index page
    var KalturaMediaModel = function (appSettings) {
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
        this.loadInitialData = function ( dataLoadedCallback) {
            var _this = this;
             // load the Kaltura kWidget library
            this.kalturaWidgetLoader = $.Deferred();
            this.deferredData = $.Deferred();
            
            this.deferredData.done( dataLoadedCallback );
            
            // In all cases we will want the kWidget lib loaded for content display or additional api calls.  
            this.kalturaWidgetLoader.done( function() {
                // get a ks: 
                $.getJSON( appSettings.ksService, function(data){
                    if( data.ks ){
                        _this.loadInitialDataViaAPI( data.ks );
                    }
                });
            });
            // load kWidget lib, will resolve kalturaWidgetLoader
            this.loadKWidget();
        }.bind(this);
        
        /**
         * Loads data via API call
         */
        this.loadInitialDataViaAPI = function( ks ){
            var _this = this;
            var request = [{
                /*'service': 'baseEntry',
                'action': 'list', 
                'filter:categoryAncestorIdIn': appSettings.topCategoryId
              */  
               'service': 'baseEntry',
               'action': 'list', 
               'filter:categoryAncestorIdIn': appSettings.topCategoryId,
               'pager:pageSize':appSettings.maxEntries
                
                /*'service': 'playlist',
                'action': 'execute',
                'id': '0_aqpaqb4c'*/
            }];
            // get all category names: 
            request.push({
                'service': 'category',
                'action': 'list',
                'filter:ancestorIdIn': appSettings.topCategoryId
            });
            // for up-to 200 item response check each entries categories .
            for( var i = 0; i< appSettings.maxEntries; i++ ){
                request.push({
                    'service': 'categoryentry',
                    'action': 'list',
                    'filter:entryIdEqual': '{1:result:objects:'+i+':id}',
                    'pager:pageSize': 5
                })
            }
            new kWidget.api( {
                'wid' : '_' + appSettings.partnerId,
                'ks': ks 
            }).doRequest(request, function( data ){
                _this.hanldeDataFromPlaylist( data );
            });
                
        }.bind(this);
        
        /** 
         * Handle playlist loaded data
         */
        this.hanldeDataFromPlaylist = function(data){
            this.categoryData = [];
            this.currentCategory = 0;
            this.mediaData = [];
            
            // build the named category number index
            var categoryNames = [], entryCategories = [];
            for( var i=0; i< data[1].objects.length; i++){
                categoryNames[ data[1].objects[i].id ] = data[1].objects[i].name.replace(/[0-9]+_/,'' )
            }
            // build per entry named categories
            for( var i= 2; i< appSettings.maxEntries + 2; i++ ){
                for( var j = 0; j < data[i].objects.length; j++ ){
                    var cat = data[i].objects[j];
                    if( ! entryCategories[ cat.entryId ] ){
                        entryCategories[ cat.entryId ] = [];
                    }
                    // add to list if name is available 
                    if( categoryNames[ cat.categoryId ] ){
                        entryCategories[ cat.entryId ].push( categoryNames[ cat.categoryId ] );
                    }
                    this.categoryData.push( categoryNames[ cat.categoryId ]  )
                }
            }
            // add all the entries: 
            for(var i=0;i<data[0].objects.length;i++){
                var entry = data[0].objects[i];
                
                this.mediaData.push({
                    "id": entry.id,
                    "title": entry.name,
                    "pubDate": entry.createdAt,
                    "thumbURL": entry.thumbnailUrl,
                    "imgURL": entry.thumbnailUrl + '/width/640',
                    "videoURL": entry.dataUrl,
                    //"subtitlesURL" : "assets/sample_video-en.vtt",
                    "categories": entryCategories[entry.id],
                    "description": entry.description
                });
            }
            this.deferredData.resolve();
        };
        
        /**
         * The kWidget lib hosts the Kaltura API helper and supports Kaltura Player embedding
         * resolves the kalturaWidgetLoader promise
         */
        this.loadKWidget = function(){
            if( window.kWidget ){
                this.kalturaWidgetLoader.resolve();
                return ;
            }
            var _this = this;
            var scirptUrl =  'http://cdnapi.kaltura.com/p/' +
                appSettings.partnerId + '/sp/' + appSettings.partnerId + 
                '00/embedIframeJs/uiconf_id/' + appSettings.uiconfId + 
                '/partner_id/' + appSettings.partnerId;
            // Load the kaltura version of the library based on app settings
            // replace the kalturaWidgetLoader Deferred with an getScript call to get the script library: 
            this.appendScriptUrl( scirptUrl, function(){
                _this.kalturaWidgetLoader.resolve();
            }, null, function(){
                _this.kalturaWidgetLoader.fail();
            });
        }.bind(this);
        
        /**
         * Append a script to the dom:
         * @param {string} url
         * @param {function} done callback
         * @param {object} Document to append the script on
         * @param {function} error callback
         */
        this.appendScriptUrl = function (url, callback, docContext, callbackError) {
            if (!docContext) {
                docContext = window.document;
            }
            var head = docContext.getElementsByTagName("head")[0] || docContext.documentElement;
            var script = docContext.createElement("script");
            script.src = url;
            // Handle Script loading
            var done = false;

            // Attach handlers for all browsers
            script.onload = script.onerror = script.onreadystatechange = function () {
                if (!done && (!this.readyState ||
                    this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;

                    if (arguments &&
                        arguments[0] &&
                        arguments[0].type) {
                        if (arguments[0].type == "error") {
                            if (typeof callbackError == "function") {
                                callbackError();
                            }
                        } else {
                            if (typeof callback == "function") {
                                callback();
                            }
                        }
                    } else {
                        if (typeof callback == "function") {
                            callback();
                        }
                    }

                    // Handle memory leak in IE
                    script.onload = script.onerror = script.onreadystatechange = null;
                    if (head && script.parentNode) {
                        head.removeChild(script);
                    }
                }
            };
            // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
            // This arises when a base node is used (#2709 and #4378).
            head.insertBefore(script, head.firstChild);
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

    exports.KalturaMediaModel = KalturaMediaModel;

})(window);


