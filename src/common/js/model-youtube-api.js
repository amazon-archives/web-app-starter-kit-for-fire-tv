/* YouTube API Model
 *
 * Model for using the YouTube v3 Data API, pulls channel/playlist/user info from YouTube 
 * and changes it to the data format for the template. 
 */

(function (exports) {
    "use strict";

    var YouTubeAPIModel = function (appSettings) {

         this.categoryData = [];
         this.channelData = [];
         this.currData = [];
         this.currentCategory = 0;
         this.currentItem = 0;
         this.defaultTheme = "default";
         this.hasLatestChannel = appSettings.hasLatestChannel;
         this.currentlySearchData = false;
         this.youtubeUser = appSettings.user;
         this.appLogo = null;
         this.channelId = null;
         this.premadeChannels = appSettings.channels;
         this.devKey = appSettings.devKey;
         this.MAX_RESULTS_PER_CATEGORY = 50;
         this.MAX_DEFAULT_PLAYLISTS = 30;


        /**
         * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function (dataLoadedCallback) {
            //get all of the available unique genres in our sample data.
            $.getJSON("https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername="+this.youtubeUser+"&key=" + this.devKey, function(jsonData){
                var item = jsonData.items[0];
                var snippet = item.snippet;
                this.channelId = item.id;
                this.appLogo = snippet.thumbnails.high.url;
                if (this.hasLatestChannel) {
                    this.createLatestChannel();
                }

                if (this.premadeChannels) {
                    this.loadPremadeChannels(dataLoadedCallback);
                }
                else {
                    this.loadPlaylists(this.MAX_DEFAULT_PLAYLISTS, dataLoadedCallback);
                }
            }.bind(this));
        };

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
            }
            dataLoadedCallback();
        }.bind(this);

        /**
         * Build channel list from the first 30 playlists with no name formattinga
         */
        this.loadPlaylists = function (maxResults, dataLoadedCallback) {
                $.getJSON("https://www.googleapis.com/youtube/v3/playlists?part=snippet&maxResults="+ maxResults + "&channelId="+ this.channelId +"&key=" + this.devKey, function (jsonData) {
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
            }.bind(this));
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
            if (this.channelData[this.currentCategory].type === "latest") {
                this.getDataFromSearch("", categoryCallback, "date", this.MAX_RESULTS_PER_CATEGORY);
            }
            else if (this.channelData[this.currentCategory].type === "playlist") {
                this.getPlaylistData(this.MAX_RESULTS_PER_CATEGORY, categoryCallback);
            }
            else if (this.channelData[this.currentCategory].type === "searchterm") {
                this.getDataFromSearch(this.channelData[this.currentCategory].query, categoryCallback);
            }
            
         }.bind(this);

        /**
         * Get and return data for a selected playlist category
         * @param {Function} categoryCallback method to call with returned requested data
         */
         this.getPlaylistData = function (maxResults, categoryCallback) {
                $.getJSON("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults="+ maxResults +"&playlistId="+ this.channelData[this.currentCategory].id +"&key=" + this.devKey, function (jsonData) {
                this.categoryData = [];
                var items = jsonData.items;
                var currObj = {};
                for (var i = 0; i < items.length; i++) {
                    var snippet = items[i].snippet;
                    if (snippet.resourceId.kind === "youtube#video") { 
                        currObj = {
                            id: snippet.id,
                            title: snippet.title, 
                            description: snippet.description,
                            pubDate: snippet.publishedAt,
                            imgURL: snippet.thumbnails.high.url,
                            thumbURL: snippet.thumbnails.high.url,
                            videoURL: snippet.resourceId.videoId
                        };
                        this.categoryData.push(currObj);
                    }
                }
                categoryCallback(this.categoryData);
            }.bind(this));
         }.bind(this);

        /**
         * Get and return data for a search term
         * @param {string} term to search for
         * @param {Function} searchCallback method to call with returned requested data
         */
         this.getDataFromSearch = function (searchTerm, searchCallback, order, maxResults) {
            var searchURL;
            if (!maxResults) {
                maxResults = this.MAX_RESULTS_PER_CATEGORY;
            }

            if (order) {
                searchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&order="+order+"&maxResults=" + maxResults + "&q=" + encodeURIComponent(searchTerm) + "&channelId="+ this.channelId + "&key=" + this.devKey;
            }
            else {
                searchURL = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults="+ maxResults +"&q=" + encodeURIComponent(searchTerm) + "&channelId="+ this.channelId + "&key=" + this.devKey;
            }

            $.getJSON(searchURL, function (jsonData) {
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
                            pubDate: snippet.publishedAt,
                            imgURL: snippet.thumbnails.high.url,
                            thumbURL: snippet.thumbnails.high.url,
                            videoURL: items[i].id.videoId
                        };
                        this.categoryData.push(currObj);
                    }
                }
                searchCallback(this.categoryData);
            }.bind(this));
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

    exports.YouTubeAPIModel = YouTubeAPIModel;

})(window);
