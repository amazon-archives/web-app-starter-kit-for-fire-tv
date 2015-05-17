
/* YouTube API Model
 *
 * Model for using the YouTube v3 Data API, pulls channel/playlist/user info from YouTube 
 * and changes it to the data format for the template. 
 */

(function (exports) {
    "use strict";

    function YouTubeAPIModel(appSettings) {
         // mixin inheritance, initialize this as an event handler for these events:
         Events.call(this, ['error']);

         this.categoryData = [];
         this.channelData = [];
         this.currData = [];
         this.currentCategory = 0;
         this.currSubCategory = null;
         this.currentItem = 0;
         this.defaultTheme = "default";
         this.hasLatestChannel = appSettings.hasLatestChannel;
         this.currentlySearchData = false;
         this.youtubeUser = appSettings.user;
         this.appLogo = null;
         this.channelId = null;
         this.nameRequestRequired = 0;
         this.premadeChannels = appSettings.channels;
         this.devKey = appSettings.devKey;
         this.createCategoriesFromSections = appSettings.createCategoriesFromSections;

         this.MAX_RESULTS_PER_CATEGORY = 50;
         this.MAX_DEFAULT_PLAYLISTS = 30;
         //timeout default to 1 min
         this.TIMEOUT = 60000;
         this.tag = null;

        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} dataLoadedCallback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
            // load youtube player script
            this.tag = document.createElement('script');
            this.tag.src = "https://www.youtube.com/iframe_api";

            $("head").append(this.tag);

            //get all of the available unique genres in our sample data.
            utils.ajaxWithRetry({
                url: "https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername="+this.youtubeUser+"&key=" + this.devKey,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    var item = jsonData.items[0];
                    var snippet = item.snippet;
                    this.channelId = item.id;
                    this.appLogo = this.getHighestResThumb(snippet.thumbnails);
                    if (this.hasLatestChannel) {
                        this.createLatestChannel();
                    }
                    if (this.premadeChannels) {
                        this.loadPremadeChannels(dataLoadedCallback);
                    }
                    else if (this.createCategoriesFromSections) {
                        this.convertSectionsToCategories(dataLoadedCallback);
                    }
                    else {
                        this.loadPlaylists(this.MAX_DEFAULT_PLAYLISTS, dataLoadedCallback);
                    }
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
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
            });
        };

        this.categoryErrorHandler = function() {
            this.trigger("error", ErrorTypes.YOUTUBE_SECTION_ERROR, errorHandler.genStack());
        }.bind(this);

        /**
         * This function converts YouTube's section API into our App's categories, this is used if the appSettings has the createCategoriesFromSections flag set to true
         * @param {function} the callback function to call with the loaded data
         */
        this.convertSectionsToCategories = function(dataLoadedCallback) {
            var chanObj;
            utils.ajaxWithRetry({
                url: "https://www.googleapis.com/youtube/v3/channelSections?part=snippet%2C+contentDetails&channelId= " + this.channelId + "&key=" + this.devKey,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    var items = jsonData.items;
                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;
                        var type = snippet.type;
                        var contentDetails = items[i].contentDetails;
                        if (type === "singlePlaylist")
                        {
                            chanObj = {
                                type: "playlist",
                                id: contentDetails.playlists[0],
                                title: ""
                            };

                            this.channelData.push(chanObj);
                            this.categoryData.push("");
                            this.nameRequestRequired++;
                            $.ajax({
                                url: "https://www.googleapis.com/youtube/v3/playlists?part=snippet&id= " + contentDetails.playlists[0] + "&key=" + this.devKey, 
                                youtubeModel: this, 
                                currentCatIndex: this.channelData.length - 1, 
                                dataLoadedCallback: dataLoadedCallback,
                                nameCheckCallback: this.checkAllNamesFound,
                                success: function(jsonData) {
                                    this.youtubeModel.nameRequestRequired--;
                                    var title = jsonData.items[0].snippet.title;
                                    this.youtubeModel.categoryData[this.currentCatIndex] = title;
                                    this.youtubeModel.channelData[this.currentCatIndex].title = title;
                                    this.nameCheckCallback(this.dataLoadedCallback);
                                },
                                error: this.categoryErrorHandler
                            });
                        }
                        else if (type === "recentUploads") {
                            chanObj = {
                                type: "latest",
                                title: "Latest Videos"
                            };

                            this.channelData.push(chanObj);
                            this.categoryData.push("Latest Videos");
                        }
                        else if (type === "popularUploads") {
                            chanObj = {
                                type: "popular",
                                title: "Popular Videos"
                            };

                            this.channelData.push(chanObj);
                            this.categoryData.push("Popular Videos");
                        }
                        else if (type === "allPlaylists") {
                            chanObj = {
                                type: "multiPlaylists",
                                ids: [],
                                title: "All Playlists"
                            };

                            this.channelData.push(chanObj);
                            this.categoryData.push("All Playlists");
                        }
                        else if (type === "multiplePlaylists") {
                            chanObj = {
                                type: "multiPlaylists",
                                ids: contentDetails.playlists,
                                title: snippet.title
                            };

                            this.channelData.push(chanObj);
                            this.categoryData.push(snippet.title);
                        }
                    }
                        
                    if (this.nameRequestRequired === 0){
                        dataLoadedCallback();
                    }
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
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
            });
        }.bind(this);

        this.checkAllNamesFound = function(dataLoadedCallback) {
            if (this.nameRequestRequired === 0){
                dataLoadedCallback();
            }
        }.bind(this);

        /**
         * Create the "latest" channel which shows all the latest videos from the youtube channel
         */
        this.createLatestChannel = function () {
            this.channelData.push({
                type: "latest"
            });
            this.categoryData.push("Latest");
        }.bind(this);

        /**
         * Build channel list from premade channel list object of playlists and searchterms with formatted names
         */
        this.loadPremadeChannels = function (dataLoadedCallback) {
            for (var i = 0; i < this.premadeChannels.length; i++) {
                if (this.premadeChannels[i].type === "playlist") {
                    this.channelData.push({
                        type: "playlist",
                        id: this.premadeChannels[i].id
                    });
                    this.categoryData.push(this.premadeChannels[i].title);
                }
                else if (this.premadeChannels[i].type === "searchterm") {
                    this.channelData.push({
                        type: "searchterm",
                        query: this.premadeChannels[i].query
                    });
                    this.categoryData.push(this.premadeChannels[i].title);
                }
                else if (this.premadeChannels[i].type === "channel") {
                    this.channelData.push({
                        type: "channel",
                        id: this.premadeChannels[i].id,
                        getPlaylists : !!this.premadeChannels[i].getPlaylists,
                    });
                    this.categoryData.push(this.premadeChannels[i].title);
                }
            }
            dataLoadedCallback();
        }.bind(this);

        /**
         * Build channel list from the first 30 playlists with no name formatting
         */
        this.loadPlaylists = function (maxResults, dataLoadedCallback) {
            utils.ajaxWithRetry({
                url: "https://www.googleapis.com/youtube/v3/playlists?part=snippet&maxResults="+ maxResults + "&channelId="+ this.channelId +"&key=" + this.devKey,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    var items = jsonData.items;

                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;
                        this.channelData.push({
                            type: "playlist",
                            id: items[i].id
                        });
                        this.categoryData.push(snippet.title);
                     }

                    dataLoadedCallback(); 
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
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
            });
        }.bind(this);

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
         * Function to set the current subcategory object, this is used to return the subcategory results in the getSubCategory method
         * which can be modified in the model before being returned asynchronously if the model requires.
         * @param {Object} data for currently selected subcategory object
         */
         this.setCurrentSubCategory = function(data) {
            this.currSubCategory = data;
         };

        /** 
         * Return the highest res available thumbnail for a YouTube object, also handles error cases with empty image(to not crash the app)
         * @param {Object} thumbnails YouTube thumbnail object.
         */  
         this.getHighestResThumb = function(thumbnails) {
            if (!thumbnails) {
                return "";
            }
            if (thumbnails.standard) {
                return thumbnails.standard.url;
            }
            else if (thumbnails.high) {
                return thumbnails.high.url;
            }
            else if (thumbnails.medium) {
                return thumbnails.medium.url;
            }
            else if (thumbnails.default) {
                return thumbnails.default.url;
            }
            else {
                return "";
            }
         };

        /** 
         * Get and return data for a selected sub category, in YouTube's case a subcategory is a playlist.
         * @param {Function} subCategoryCallback method to call with returned requested data
         */  
         this.getSubCategoryData = function(subCategoryCallback) {
            utils.ajaxWithRetry({
                url: "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults="+ 
                    this.MAX_RESULTS_PER_CATEGORY +
                    "&playlistId="+ this.currSubCategory.id +
                    "&key=" + this.devKey,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    var contents = [];
                    var items = jsonData.items;
                    var currObj = {};
                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;
                        if (snippet.resourceId.kind === "youtube#video" && snippet.title !== "Deleted video" && snippet.title !== "Private video") { 
                            currObj = {
                                id: snippet.id,
                                title: snippet.title, 
                                description: snippet.description,
                                pubDate: exports.utils.formatDate(snippet.publishedAt),
                                imgURL: this.getHighestResThumb(snippet.thumbnails),
                                thumbURL: this.getHighestResThumb(snippet.thumbnails),
                                videoURL: snippet.resourceId.videoId
                            };
                            contents.push(currObj);
                        }
                    }
                    this.currSubCategory.contents = contents;
                    subCategoryCallback(this.currSubCategory);
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
                        return;
                    }
                    switch (textStatus) {
                        case "timeout" :
                            this.trigger("error", ErrorTypes.SUBCATEGORY_TIMEOUT, errorHandler.genStack());
                            break;
                        case "parsererror" :
                            this.trigger("error", ErrorTypes.SUBCATEGORY_PARSING_ERROR, errorHandler.genStack());
                            break;
                        default:
                            this.trigger("error", ErrorTypes.SUBCATEGORY_ERROR, errorHandler.genStack());
                            break;
                     }
                }.bind(this)
            });
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
            switch (this.channelData[this.currentCategory].type) {
                case "latest":
                    this.getDataFromSearch("", categoryCallback, "date", this.MAX_RESULTS_PER_CATEGORY);  
                    break;
                case "popular":
                    this.getDataFromSearch("", categoryCallback, "viewCount", this.MAX_RESULTS_PER_CATEGORY);
                    break;
                case "channel":
                     this.getDataFromChannel(this.MAX_RESULTS_PER_CATEGORY, this.channelData[this.currentCategory].id, this.channelData[this.currentCategory].getPlaylists, categoryCallback);
                    break;
                case "playlist":
                    this.getPlaylistData(this.MAX_RESULTS_PER_CATEGORY, categoryCallback);
                    break;  
                case "searchterm":
                    this.getDataFromSearch(this.channelData[this.currentCategory].query, categoryCallback);
                    break;
                case "multiPlaylists":
                    this.getMultiPlaylists(this.channelData[this.currentCategory].ids, this.MAX_RESULTS_PER_CATEGORY, this.channelId, categoryCallback);
                    break;   
            }
         }.bind(this);

        /**
         * Get and return data for a given multiple playlist category
         * @param {array} array of the playlist ids in the category
         * @param {number} Max results to return
         * @param {Function} callback method to call with returned requested data
         */
         this.getMultiPlaylists = function (playlistIDs, maxResults, channelId, categoryCallback) {
            var url;
            channelId = channelId || this.channelId;

            if (playlistIDs.length === 0) {
                url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=" + channelId + "&maxResults=" + maxResults + "&key=" + this.devKey;
            }
            else {
                var ids = playlistIDs.join();
                url = "https://www.googleapis.com/youtube/v3/playlists?part=snippet&" + "&id="+ ids +"&maxResults=" + maxResults + "&id="+ playlistIDs + "&key=" + this.devKey;
            }

            utils.ajaxWithRetry({
                url: url,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    this.categoryData = [];
                    var items = jsonData.items;
                    var currObj = {};
                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;
                        if (items[i].kind === "youtube#playlist") { 
                            currObj = {
                                id: items[i].id,
                                title: snippet.title,
                                description: snippet.description,
                                pubDate: exports.utils.formatDate(snippet.publishedAt),
                                imgURL: this.getHighestResThumb(snippet.thumbnails),
                                thumbURL: this.getHighestResThumb(snippet.thumbnails),
                                type: "subcategory"
                            };
                            this.categoryData.push(currObj);
                        }
                    }
                    categoryCallback(this.categoryData);
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
                        return;
                    }

                    switch (textStatus) {
                        case "timeout" :
                            this.trigger("error", ErrorTypes.CATEGORY_FEED_TIMEOUT, errorHandler.genStack());
                            break;
                        case "parsererror" :
                            this.trigger("error", ErrorTypes.CATEGORY_PARSING_ERROR, errorHandler.genStack());
                            break;
                        default:
                            this.trigger("error", ErrorTypes.CATEGORY_FEED_ERROR, errorHandler.genStack());
                            break;
                     }
                }.bind(this)
            });
         }.bind(this);

        /**
         * Get and return data for a selected playlist category
         * @param {Function} categoryCallback method to call with returned requested data
         */
         this.getPlaylistData = function (maxResults, categoryCallback) {
            utils.ajaxWithRetry({
                url: "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults="+ 
                maxResults +"&playlistId="+ 
                this.channelData[this.currentCategory].id +"&key=" + 
                this.devKey,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    this.categoryData = [];
                    var items = jsonData.items;
                    var currObj = {};
                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;                  
                        if (snippet.resourceId.kind === "youtube#video" && snippet.title !== "Deleted video" && snippet.title !== "Private video") { 
                            currObj = {
                                id: snippet.id,
                                title: snippet.title, 
                                description: snippet.description,
                                pubDate: exports.utils.formatDate(snippet.publishedAt),
                                imgURL: this.getHighestResThumb(snippet.thumbnails),
                                thumbURL: this.getHighestResThumb(snippet.thumbnails),
                                videoURL: snippet.resourceId.videoId
                            };
                            this.categoryData.push(currObj);
                        }
                    }
                    categoryCallback(this.categoryData);
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
                        return;
                    }

                    switch (textStatus) {
                        case "timeout" :
                            this.trigger("error", ErrorTypes.CATEGORY_FEED_TIMEOUT, errorHandler.genStack());
                            break;
                        case "parsererror" :
                            this.trigger("error", ErrorTypes.CATEGORY_PARSING_ERROR, errorHandler.genStack());
                            break;
                        default:
                            this.trigger("error", ErrorTypes.CATEGORY_FEED_ERROR, errorHandler.genStack());
                            break;
                     }
                }.bind(this)
            });
        }.bind(this);

        /**
         * Get and return data for a given channel
         * @param {number} maxResults results to return
         * @param {string} channelID to get data for
         * @param {Function} categoryCallback method to call with returned requested data
         */
         this.getDataFromChannel = function (maxResults, channelID, getPlaylists, categoryCallback) {
            if (getPlaylists) {
                this.getMultiPlaylists([], maxResults, channelID, categoryCallback);
            }
            else {
                var searchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + maxResults + "&channelId="+ channelID + "&key=" + this.devKey;

                utils.ajaxWithRetry({
                    url: searchURL,
                    type: 'GET',
                    dataType: 'json',
                    context : this,
                    cache: true,
                    timeout: this.TIMEOUT,
                    success: function(jsonData) {
                        this.categoryData = [];
                        var items = jsonData.items;
                        var currObj = {};
                        for (var i = 0; i < items.length; i++) {
                            var snippet = items[i].snippet;
                            if (items[i].id.kind === "youtube#video") { 
                                currObj = {
                                    id: items[i].id.videoId,
                                    title: snippet.title, 
                                    description: snippet.description,
                                    pubDate: exports.utils.formatDate(snippet.publishedAt),
                                    imgURL: this.getHighestResThumb(snippet.thumbnails),
                                    thumbURL: this.getHighestResThumb(snippet.thumbnails),
                                    videoURL: items[i].id.videoId
                                };
                                this.categoryData.push(currObj);
                            }
                        }
                        categoryCallback(this.categoryData);
                    }.bind(this),
                    error: function(jqXHR, textStatus) {
                        if (jqXHR === 0) {
                            this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
                            return;
                        }

                        switch (textStatus) {
                            case "timeout" :
                                this.trigger("error", ErrorTypes.CATEGORY_FEED_TIMEOUT, errorHandler.genStack());
                                break;
                            case "parsererror" :
                                this.trigger("error", ErrorTypes.CATEGORY_PARSING_ERROR, errorHandler.genStack());
                                break;
                            default:
                                this.trigger("error", ErrorTypes.CATEGORY_FEED_ERROR, errorHandler.genStack());
                                break;
                         }
                    }.bind(this)
                });
            }
        };

        /**
         * Get and return data for a search term
         * @param {string} searchTerm to search for
         * @param {Function} searchCallback method to call with returned search result
         * @param {string} order param for query
         * @param {string} maxResults maxResults param for query
         */
         this.getDataFromSearch = function (searchTerm, searchCallback, order, maxResults) {
            var searchURL;
            if (!maxResults) {
                maxResults = this.MAX_RESULTS_PER_CATEGORY;
            }

            if (order) {
                searchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&order=" +
                order + "&maxResults=" + maxResults + "&q=" + encodeURIComponent(searchTerm) + 
                "&channelId=" + this.channelId + "&key=" + this.devKey;
            }
            else {
                searchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + maxResults + "&q=" + 
                encodeURIComponent(searchTerm) + "&channelId="+ this.channelId + "&key=" + this.devKey;
            }

            utils.ajaxWithRetry({
                url: searchURL,
                type: 'GET',
                dataType: 'json',
                context : this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(jsonData) {
                    this.categoryData = [];
                    var items = jsonData.items;
                    var currObj = {};
                    for (var i = 0; i < items.length; i++) {
                        var snippet = items[i].snippet;
                        if (items[i].id.kind === "youtube#video" && snippet.title !== "Deleted video" && snippet.title !== "Private video") { 
                            currObj = {
                                id: items[i].id.videoId,
                                title: snippet.title, 
                                description: snippet.description,
                                pubDate: exports.utils.formatDate(snippet.publishedAt),
                                imgURL: this.getHighestResThumb(snippet.thumbnails),
                                thumbURL: this.getHighestResThumb(snippet.thumbnails),
                                videoURL: items[i].id.videoId
                            };
                            this.categoryData.push(currObj);
                        }
                    }
                    searchCallback(this.categoryData);
                }.bind(this),
                error: function(jqXHR, textStatus) {
                    if (jqXHR === 0) {
                        this.trigger("error", ErrorTypes.NETWORK_ERROR, errorHandler.genStack());
                        return;
                    }
                    
                    switch (textStatus) {
                        case "timeout" :
                            this.trigger("error", ErrorTypes.SEARCH_TIMEOUT, errorHandler.genStack());
                            break;
                        case "parsererror" :
                            this.trigger("error", ErrorTypes.SEARCH_PARSING_ERROR, errorHandler.genStack());
                            break;
                        default:
                            this.trigger("error", ErrorTypes.SEARCH_ERROR, errorHandler.genStack());
                            break;
                     }
                }.bind(this)
            });
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

    exports.YouTubeAPIModel = YouTubeAPIModel;

})(window);

