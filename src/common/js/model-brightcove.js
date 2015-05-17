/* Brightcove API Model
 *
 * Model for using the Brightcove Media API.
 * This module handles ajax requests for Brightcove content including retriving playlists, videos contained in a playlist 
 * and searching based on a search term. Addiotnally the model handles data transformation for the application.
 *
 * Brightcove Content Hierarchy - 
 *
 * Videos in Brightcove are organized into 'Playlists'. A playlist is a collection of videos that are grouped together 
 * in a particular order for playback in the Brightcove Player. You can create two kinds of playlists: manual or smart.
 * For more information about how to create playlists refer to http://support.brightcove.com/en/video-cloud/docs/creating-and-managing-playlists
 * 
 * The Brightcove model will display only those playlists that have a 'FireTV' prefix in the Reference ID. The template will directly map playlists
 * to categories and the names of the playlists will be displayed in the left navigation view. The model does not support subcategory structure.
 * When a category or playlist is selected, the model retrieves all videos corresponing to the playlist from the specified Brightcove account.
 * 
 * Brightcove Feed Structure - 
 *
 * Playlist Feed Structure - structure of feed returned when we request all the playlists in Brightcove. This data is used to populate the left nav view.
 *
 * {
 *   "items": [
 *       {
 *           "id": "Playlist Id",
 *           "referenceId": "Refernece Id",
 *           "name": "Playlist Name",
 *           "shortDescription": "Playlist Description"
 *       },
 *       ...
 *   ],
 *   "page_number": page number,
 *   "page_size": page size,
 *   "total_count": total count
 * }
 *
 * Video Feed Structure - structure of feed returned when we request all videos for a given playlist in Brightcove
 *
 * {  
 *   "id":"Playlist Id",
 *   "referenceId":"Reference Id",
 *   "name":"Playlist Name",
 *   "shortDescription":"Playlist Description",
 *   "videos":[  
 *      {  
 *         "id":"Video Id",
 *         "name":"Video Name",
 *         "longDescription":"Video Description",
 *         "videoStillURL":"http://video_still_URL",
 *         "thumbnailURL":"http://thumbnail_URL"
 *      }
 *      ...
 *   ],
 *   "playlistType":"Playlist Type"
 * }
 *
 * Search Videos Feed Structure - structure of feed returned when we search for videos in Brightcove
 *
 * {  
 *    "items":[  
 *      {  
 *         "id":"Video Id",
 *         "name":"Video Name",
 *         "longDescription":"Video Description",
 *         "videoStillURL":"http://video_still_URL",
 *         "thumbnailURL":"http://thumbnail_URL"
 *      },
 *      ...
 *   ],
 *   "page_number": page number,
 *   "page_size": page size,
 *   "total_count": total count
 * }
 *
 * Module Structure - 
 *
 * This module will make requests for feeds as needed and pass the data back to the main app module. 
 * To handle requests there is a single method called 'makeGetRequest' which is called. This method is called to retrieve initial
 * data for the left navigation panel, the video data for a specific category/playlist and the search results.
 * 
 */

(function(exports) {
    "use strict";

    /**
     * @class BrightcoveAPIModel
     * @description Model for using the Brightcove Media API
     * @params {Object} appSettings are the user-defined settings from the index page
     */
    function BrightcoveAPIModel(appSettings) {

        Events.call(this, ['error']);

        this.mediaData = [];
        this.categoryData = [];
        this.playlistIds = [];
        this.currSubCategory = [];
        this.currData = [];
        this.currentCategory = 0;
        this.currentItem = 0;
        this.defaultTheme = "default";
        this.currentlySearchData = false;

        //timeout default to 1 min
        this.TIMEOUT = 60000;
        this.REF_ID_PREFIX = "firetv";

        /**
         * @function makeGetRequest
         * @description function to make AJAX request
         * @param {Function} getDataUrl method to call with params to retrieve the URL for the AJAX request
         * @param {Function} successCallback method to call after AJAX response is receieved to parse the data returned 
         * @param {Function} errorCallback method to call after AJAX response is receieved to handle errors 
         * @param {Function} completeCallback method to call with returned requested data
         * @param {Function} params additional parameters needed to build the URL for the AJAX request
         */
        this.makeGetRequest = function(getDataUrl, successCallback, errorCallback, completedCallback, params) {
            utils.ajaxWithRetry({
                url: getDataUrl(params),
                type: 'GET',
                crossDomain: true,
                dataType: 'json',
                context: this,
                cache: true,
                timeout: this.TIMEOUT,
                success: function(contentData) {
                    if (contentData.error) {
                        this.trigger("error", ErrorTypes.TOKEN_ERROR, errorHandler.genStack());
                        completedCallback = null;
                    } else {
                    successCallback(contentData);
                    }
                },
                error: function(jqXHR, textStatus) {
                    if (errorCallback) {
                        errorCallback(jqXHR, textStatus);
                        completedCallback = null;
                    }
                },
                complete: function() {
                    if (completedCallback) {
                        completedCallback(this.currData);
                    }
                }.bind(this)
            });
        };

        /**
         * @function categoryErrorCallbackHandler
         * @description Category Error Callback Handler
         * @param {Object} type the error type returned from the request 
         */
        this.categoryErrorCallbackHandler = function(jqXHR, type) {
            if (jqXHR.status === 0) {
                this.trigger("error", ErrorTypes.CATEGORY_NETWORK_ERROR, errorHandler.genStack());
                return;
            } 
            switch (type) {
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
        }.bind(this);
        
        /**
         * @function initialErrorCallbackHandler
         * @description Initial Error Callback Handler
         * @param {Object} type the error type returned from the request 
         */
        this.initialFeedErrorCallbackHandler = function(jqXHR, type) {
            if (jqXHR.status === 0) {
                this.trigger("error", ErrorTypes.INITIAL_NETWORK_ERROR, errorHandler.genStack());
                return;
            }
            switch (type) {
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
        }.bind(this);

        /**
         * @function searchErrorCallbackHandler
         * @description Error Callback Handler
         * @param {Object} type the error type returned from the request 
         */
        this.searchErrorCallbackHandler = function(jqXHR, type) {
            if (jqXHR.status === 0) {
                this.trigger("error", ErrorTypes.SEARCH_NETWORK_ERROR, errorHandler.genStack());
                return;
            }
            switch (type) {
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
        }.bind(this);

        /**
         * @function loadInitialData
         * @descriptionThis function loads the initial data needed to start the app and calls the provided callback with the data when
         * it is fully loaded
         * @param {function} the callback function to call with the loaded data
         */
        this.loadInitialData = function(dataLoadedCallback) {
            this.makeGetRequest(this.findAllPlaylistsRequestUrl, this.handlePlaylistData, this.initialFeedErrorCallbackHandler,
                dataLoadedCallback);
        };

        /**
         * @function findAllPlaylistsRequestUrl
         * @description function that returns the request url to find all the playlists or categories
         * @return {string}
         */
        this.findAllPlaylistsRequestUrl = function() {
            return appSettings.dataURL + '?command=find_all_playlists' +
                '&page_size=' + appSettings.numberOfCategories +
                '&playlist_fields=id%2CreferenceId%2Cname%2CshortDescription' +
                '&video_fields=id%2Cname%2ClongDescription%2CpublishedDate' +
                '&media_delivery=default&page_number=0&get_item_count=true' +
                '&token=' + appSettings.developerToken;
        };

        /**
         * @function handlePlaylistData
         * @description handles requests that contain json data representing the list of playlists. Only playlists with "FireTV" prefix in 
         * the RefID are displayed
         * @param {Object} jsonData data returned from request
         */
        this.handlePlaylistData = function(jsonData) {
            this.categoryData = [];
            this.currentCategory = 0;
            this.mediaData = jsonData.items;

            for (var i = 0; i < this.mediaData.length; i++) {
                if (this.mediaData[i].referenceId && this.mediaData[i].referenceId.substring(0, 6).toLowerCase() === this.REF_ID_PREFIX) {
                    this.categoryData.push(this.mediaData[i].name);
                    this.playlistIds.push(this.mediaData[i].id);
                }
            }
        }.bind(this);

        /***************************
         *
         * Category Methods
         *
         ***************************/
        
        /**
         * @function setCurrentCategory
         * @description store the index of the currently selected category
         * @param {Number} index the index into the categories array
         */
        this.setCurrentCategory = function(index) {
            this.currentCategory = index;
        };

        /***************************
         *
         * Content Item Methods
         *
         ***************************/
        
        /**
         * @function getCategoryItems
         * @description return the category items for the left-nav view
         * @return {Object}
         */
        this.getCategoryItems = function() {
            return this.categoryData;
        };

        /** 
         * @function getCategoryData
         * @description get and return data for a selected category
         * @param {Function} categoryCallback method to call with returned requested data
         */
        this.getCategoryData = function(categoryCallback) {
            this.currData = [];
            this.getPlaylistVideos(this.playlistIds[this.currentCategory], categoryCallback);
        };

        /**
         * @function getPlaylistVideos
         * @description this function makes the AJAX request to get all videos corresponding to a playlist and invokes the provided 
         * callback with the video data
         * @param {Number} playlist_id the playlist id
         * @param {Function} categoryCallback the callback function to call with the loaded data
         */
        this.getPlaylistVideos = function(playlist_id, categoryCallback) {
            this.makeGetRequest(this.findPlaylistVideosRequestUrl, this.handlePlaylistVideoData, this.categoryErrorCallbackHandler,
                categoryCallback, playlist_id);
        };

        /**
         * @function findPlaylistVideosRequestUrl
         * @description function that returns the request url to find all the videos in a playlist
         * @param {Number} playlist_id the playlist id
         * @return {string}
         */
        this.findPlaylistVideosRequestUrl = function(playlist_id) {
            return appSettings.dataURL + '?command=find_playlist_by_id' +
                '&playlist_id=' + playlist_id +
                '&playlist_fields=id%2CreferenceId%2Cname%2CshortDescription%2CplayListType%2Cvideos' +
                '&video_fields=id%2Cname%2ClongDescription%2CvideoStillURL%2CthumbnailURL%2CpublishedDate&media_delivery=default' +
                '&token=' + appSettings.developerToken;
        };

        /**
         * @function handlePlaylistVideoData
         * @description handles requests that contain json data representing the list of videos corresponding to a playlist.
         * @param {Object} data the data returned from request
         */
        this.handlePlaylistVideoData = function(data) {
            this.catData = data.videos;
            for (var i = 0; i < this.catData.length; i++) {
                this.addVideoData(this.catData[i]);
            }
        }.bind(this);

        /**
         * @function getDataFromSearch
         * @description get and return data for a search term
         * @param {String} searchTerm to search for
         * @param {Function} searchCallback method to call with returned requested data
         */
        this.getDataFromSearch = function(searchTerm, searchCallback) {
            this.currData = [];
            this.getSearchVideos(searchTerm, searchCallback);
        };

        /**
         * @function getSearchVideos
         * @description this function makes the AJAX request to search all videos that contain the search term and invokes the provided callback with the video data returned
         * @param {String} searchTerm the search term
         * @param {Function} searchCallback the callback function to call with the data returned
         */
        this.getSearchVideos = function(searchTerm, searchCallback) {
            this.makeGetRequest(this.searchVideosRequestUrl, this.handleSearchData, this.searchErrorCallbackHandler,
                searchCallback, searchTerm);
        };

        /**
         * @function searchVideosRequestUrl
         * @description function that returns the request url to search Brightcove for all the videos corresponding to a search term
         * @param {String} searchTerm the search string
         */
        this.searchVideosRequestUrl = function(searchTerm) {
            return appSettings.dataURL + '?command=search_videos&any=' + searchTerm + '&page_size=30' +
                '&video_fields=id%2Cname%2ClongDescription%2CvideoStillURL%2CthumbnailURL%2CpublishedDate' +
                '&media_delivery=default&sort_by=DISPLAY_NAME%3AASC&page_number=0' +
                '&token=' + appSettings.developerToken;
        };

        /**
         * @function handleSearchData
         * @description handles requests that contain json data representing the list of videos corresponding to a search
         * @param {Object} data the data returned from request
         */
        this.handleSearchData = function(data) {
            this.searchData = data.items;
            for (var i = 0; i < this.searchData.length; i++) {
                this.addVideoData(this.searchData[i]);
            }
        }.bind(this);

        /**
         * @function addVideoData
         * @description helper function to add video data to the list of current data
         * @param {Object} data the video metadata
         */
        this.addVideoData = function(data) {
            var currObj = {
                id: data.id,
                title: data.name,
                description: data.longDescription,
                pubDate: exports.utils.formatDate(data.publishedDate/1000),
                imgURL: data.videoStillURL,
                thumbURL: data.thumbnailURL,
                videoURL: data.videoId
            };
            this.currData.push(currObj);
        };

        /**
         * @function setCurrentItem 
         * @description Store the refrerence to the currently selected content item
         * @param {Number} index the index of the selected item
         */
        this.setCurrentItem = function(index) {
            this.currentItem = index;
            this.currentItemData = this.currData[index];
        };

        /**
         * @function getCurrentItemData
         * @description retrieve the reference to the currently selected content item
         * @return {Number} 
         */
        this.getCurrentItemData = function() {
            return this.currentItemData;
        };
    }

    exports.BrightcoveAPIModel = BrightcoveAPIModel;

})(window);
