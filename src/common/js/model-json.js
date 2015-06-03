/* Model
 *
 * Model for JSON data 
 */

(function (exports) {
    "use strict";

    // the model for the Media Sample Data
    // {Object} appSettings are the user-defined settings from the index page
    function JSONMediaModel(appSettings) {
         // mixin inheritance, initialize this as an event handler for these events:
         Events.call(this, ['error']);
         
         this.mediaData       = [];
         this.categoryData    = [];
         this.currSubCategory = [];
         this.currData = [];
         this.currentCategory = 0;
         this.currentItem     = 0;
         this.defaultTheme    = "default";
         this.currentlySearchData = false;

         //timeout default to 1 min
         this.TIMEOUT = 60000;

        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
            var requestData = {
                 url: appSettings.dataURL,
                 type: 'GET',
                 crossDomain: true,
                 dataType: 'json',
                 context : this,
                 cache : true,
                 timeout: this.TIMEOUT,
                 success : function() {
                     var contentData = arguments[0];
                     this.handleJsonData(contentData);
                     dataLoadedCallback();
                 }.bind(this),
                 error : function(jqXHR, textStatus) {
                     // Data feed error is passed to model's parent (app.js) to handle
                     if (jqXHR.status === 0) {
                        this.trigger("error", ErrorTypes.INITIAL_NETWORK_ERROR, errorHandler.genStack());
                        return;
                     }
                     switch (textStatus) {
                        case "timeout" :
                            this.trigger("error", ErrorTypes.INITIAL_FEED_TIMEOUT, errorHandler.genStack());
                            break;
                        case "parsererror" :
                            this.trigger("error", ErrorTypes.INITIAL_PARSING_ERROR, errorHandler.genStack());
                            break;
                        default:
                            this.trigger("error", ErrorTypes.INITIAL_FEED_ERROR, errorHandler.genStack());
                            break;
                     }
                 }.bind(this)
             };
             utils.ajaxWithRetry(requestData);
        }.bind(this);

       /**
        * Handles requests that contain json data
        * @param {Object} jsonData data returned from request
        */
        this.handleJsonData = function (jsonData) {
            this.categoryData = [];
            this.currentCategory = 0;
            this.mediaData = jsonData.media;
            if (!jsonData.folders) {
                this.createFoldersFromMediaData(jsonData);
            }
            this.folders = jsonData.folders;
            this.rootFolder = this.folders[0]; 

            // create left nav based on the folder stucture object
            for (var i = 0; i < this.rootFolder.contents.length; i++) {
                for (var j = 0; j < this.folders.length; j++) {
                    if (this.folders[j].id === this.rootFolder.contents[i].id) {
                        this.categoryData.push(this.folders[j].title);
                    }
                }
            }

         }.bind(this);

        /**
        * Handles converting JSON data that doesn't contain a folders object into the new updated JSON format with a folders object
        * for backwards compatability.
        * @param {Object} jsonData data to be converted into heirarchy folders object
        */
        this.createFoldersFromMediaData = function (jsonData) {
            // gather all the unique category names into a single list
            jsonData.folders = [{
                id: "0",
                title: "",
                description: "",
                contents: []
            }];
            // starting categories with an empty string to keep it as one to one list to the folders array
            // the empty string represents the root folder created above
            var categories = [""];
            // find all unique categories to create a folder list
            for (var i = 0; i < this.mediaData.length; i++) {
                var mediaCats = this.mediaData[i].categories;
                // create a media reference to point to the actual media object, used in the folder list
                var mediaReference = {type: "media", id: this.mediaData[i].id};
                if (mediaCats) {
                    for (var j = 0; j < mediaCats.length; j++) {
                        var catIndex = categories.indexOf(mediaCats[j]); 
                        if (catIndex < 0) {
                            categories.push(mediaCats[j]);
                            // add the folder object for the found unique category to the overall list
                            var folderObj = {
                                id: categories.length,
                                title: mediaCats[j],
                                contents: [mediaReference]
                            };
                            // add the new folder to the children of the root folder, and add it as an entry in folders array to create the hierarchy
                            jsonData.folders[0].contents.push({type: "folder", id: categories.length});
                            jsonData.folders.push(folderObj);

                        } else {
                            // there is already a unique category so just add the media reference to it
                            jsonData.folders[catIndex].contents.push(mediaReference);
                        }
                    }
                }
            }
        };

       /***************************
        *
        * Utility Methods
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

        /**
         * Function to set the current subcategory object, this be used to return the subcategory resuts in the getSubCategory method
         * which can be modified in the model before being returned asynchrounously if the model wishes.
         * @param {Object} data currently selected subcategory object
         */
         this.setCurrentSubCategory = function(data) {
            this.currSubCategory = data;
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
             var currCat;
             this.currData = [];
             for (var i = 0; i < this.folders.length; i++ ){
                if (this.rootFolder.contents[this.currentCategory].id === this.folders[i].id) {
                    currCat = this.folders[i];
                }   
             }

            this.currData = this.getFullContentsForFolder(currCat);
            this.currData = this.filterLiveData(this.currData);
            categoryCallback(this.currData);
         }; 

         /** 
          * Filter out old broadcasts of live data, add time format for upcoming, set currently live flag
          * @param {array} data the content
          **/ 
          this.filterLiveData = function(data) {
            for (var i = 0; i < data.length; i++) {  
                if (data[i].type === "video-live") {                  
                    var startTime = new Date(data[i].startTime).getTime();
                    var endTime = new Date(data[i].endTime).getTime();
                    var currTime = Date.now();
                    var isAlwaysLive = data[i].alwaysLive;
                    if (currTime < endTime && currTime >= startTime)
                    {
                        data[i].isLiveNow = true;
                    }
                    else if (isAlwaysLive) {
                        data[i].isLiveNow = true;
                    }
                    else if (currTime > endTime){
                        // remove old broadcasts
                        data.splice(i, 1);
                        i--;
                    }
                    else {
                        var upcomingTimeSeconds = Math.round((startTime - currTime) / 1000);
                        var days = Math.floor( upcomingTimeSeconds / 86400 );
                        data[i].isLiveNow = false;
                        if (days > 0) {
                            data[i].upcomingTime = exports.utils.formatDate(data[i].startTime);
                        }
                        else {
                            data[i].upcomingTime = "Starts in " + this.convertSecondsToHHMM(upcomingTimeSeconds);
                        }
                    }
                }
            }
            return data;
          };

        /**
         * convert seconds to string format for when live broadcast start
         */
        this.convertSecondsToHHMM = function(seconds, alwaysIncludeHours) {
            var hours = Math.floor( seconds / 3600 );
            var minutes = Math.floor( seconds / 60 );

            var finalString = "";
            
            if (hours > 0 || alwaysIncludeHours) {
                finalString += hours + " hours ";
            }
            return finalString + ('00' + minutes).slice(-2) + " minutes";
        };

        /** 
         * Get and return full contents objects for a given folder
         * @param {object} folder object to find contents for
         */  
         this.getFullContentsForFolder = function(folder) {
            var i, j, contents = [], currContents = folder.contents;
            for (i = 0; i < currContents.length; i++) {
                if (currContents[i].type === "folder") {
                    for (j = 0; j < this.folders.length; j++) {
                        if (this.folders[j].id === currContents[i].id) {
                            this.folders[j].type = "subcategory";
                            contents.push(this.folders[j]);  
                        }
                    }
                }
                else if (currContents[i].type === "media") {
                    for (j = 0; j < this.mediaData.length; j++) {
                        if (this.mediaData[j].id === currContents[i].id) {
                            //make sure the date is in the correct format
                            if(this.mediaData[i].pubDate) {
                                this.mediaData[i].pubDate = exports.utils.formatDate(this.mediaData[i].pubDate);
                            }
                            contents.push(this.mediaData[j]);               
                        }
                    }
                }
            }
            return contents;
         };

        /** 
         * Get and return data for a selected sub category, modified however the model wishes. Uses an asynchrounous callback to return the data.
         * @param {Function} subCategoryCallback method to call with returned requested data
         */  
         this.getSubCategoryData = function(subCategoryCallback) {
            // clone the original object
            var returnData = JSON.parse(JSON.stringify(this.currSubCategory));
            returnData.contents = this.getFullContentsForFolder(this.currSubCategory);
            returnData.contents = this.filterLiveData(returnData.contents);
            subCategoryCallback(returnData);
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
                    //make sure the date is in the correct format
                    if(this.mediaData[i].pubDate) {
                        this.mediaData[i].pubDate = exports.utils.formatDate(this.mediaData[i].pubDate);
                    }
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

    exports.JSONMediaModel = JSONMediaModel;

})(window);


