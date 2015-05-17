/* Error Handler
 *
 * Handle errors that are raised up from all components
 *
 */

 (function (exports) {
    "use strict";

    /**
     * This is a list of error types for each components to slot a specific error. NETWORK_ERROR is now used in model.js. This list should be extended
     * as we deal with more error cases.
     */
    exports.ErrorTypes = {
        NETWORK_ERROR : {
          errTitle : "Network Error",
          errToDev : "Network error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        INITIAL_NETWORK_ERROR : {
          errTitle : "Network Error",
          errToDev : "Network error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        CATEGORY_NETWORK_ERROR : {
          errTitle : "Network Error",
          errToDev : "Network error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        SUBCATEGORY_NETWORK_ERROR : {
          errTitle : "Network Error",
          errToDev : "Network error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        SEARCH_NETWORK_ERROR : {
          errTitle : "Network Error",
          errToDev : "Network error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        TIMEOUT_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Timeout error",
          errToUser : "An unexpected error occurred. Select OK to exit, or check your network and try again."
        },
        SLOW_RESPONSE : {
          errTitle : "Slow Response",
          errToDev : "Slow response",
        },
        CONTENT_SRC_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Video source not available or supported",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        CONTENT_DECODE_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Content decode error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        VIDEO_NOT_FOUND : {
          errTitle : "Video Playback Error",
          errToDev : "Video not found",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        HTML5_PLAYER_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Video cannot be played in the html5 player or there's something wrong with the player",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        EMBEDDED_PLAYER_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Video cannot be played in the embedded player",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        INITIAL_FEED_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Initial feed error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        CATEGORY_FEED_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Category Feed Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SUBCATEGORY_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Subcategory Feed Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        INITIAL_PARSING_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Initial Parsing error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        CATEGORY_PARSING_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Category Parsing Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SUBCATEGORY_PARSING_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Subcategory Parsing Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        INITIAL_FEED_TIMEOUT : {
          errTitle : "Video Feed Error",
          errToDev : "Initial Feed Timeout",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        CATEGORY_FEED_TIMEOUT : {
          errTitle : "Video Feed Error",
          errToDev : "Category Feed Timeout",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SUBCATEGORY_TIMEOUT : {
          errTitle : "Video Feed Error",
          errToDev : "Subategory Feed Timeout",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        YOUTUBE_SECTION_ERROR : {
          errTitle : "Video Feed Error",
          errToDev : "Youtube Section Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SEARCH_TIMEOUT : {
          errTitle : "Search Error",
          errToDev : "Search Timeout",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SEARCH_PARSING_ERROR : {
          errTitle : "Search Error",
          errToDev : "Search Parsing Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        SEARCH_ERROR : {
          errTitle : "Search Error",
          errToDev : "Search Error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        },
        IMAGE_LOAD_ERROR : {
          errTitle : "Image Load Error",
          errToDev : "Image load error",
          errToUser : "Unable to load thumbnail image."
        },
        PLAYER_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Player Error",
          errToUser : "An unexpected error occurred. Select OK to exit."
        },
        TOKEN_ERROR : {
          errTitle : "Video Playback Error",
          errToDev : "Token Error",
          errToUser : "An unexpected error occurred. Select OK to exit."
        },
        UNKNOWN_ERROR : {
          errTitle : "Unknown Error",
          errToDev : "Unknown error",
          errToUser : "An unexpected error occurred. Select OK to exit, or try again."
        }
    };

    /**
     * @class ErrorHandler
     * @description The errorHandler object, this handles error reporting, logging, and displaying error dialog.
     */
    function ErrorHandler() {

        /**
         * This is a helper function to generate error stacktrace
         * @return {String}
         */
        this.genStack = function() {
            var e = Error();
            return e.stack;
        };

        /**
         * Write error details to console
         * @param {String} type of error (generic)
         * @param {String} error detail with context info
         * @param {String} full callstack when error occurs
         */
        this.writeToConsole = function(errType, errToDev, errStack) {
            var errStr = "ErrorType : " + errType.errTitle + "\nErrorMessage : " + errType.errToDev + "\nErrorStack : " + errStack + "\nTimestamp : " + new Date();
            console.error(errStr);
        };

        /**
         * Report error to app developer. By default it is no op. App dev can follow the example code to complete the implementation
         * @param {String} type of error (generic)
         * @param {String} error detail with context info
         * @param {String} full callstack when error occurs
         */
        this.informDev = function(errType, errToDev, errStack) {
            if (errType && errToDev && errStack) {
              /**
               * This commented code is an example of how to report error back to app developer.
               *
                 var errorObj = {
                     type: errType,
                     message: errToDev,
                     stack: errStack,
                     timestamp: new Date()
                 };

                 var requestData = {
                     url : "PUT-APP-ERROR-REPORT-URL-HERE",
                     type : 'GET',
                     crossDomain : true,
                     dataType : 'json',
                     context : this,
                     cache : false,
                     data : errorObj,
                     error : function() {
                         this.writeToConsole(ErrorTypes.NETWORK_ERROR, "Failed to report error to app developer", this.genStack());
                     }.bind(this)
                  };
                  utils.ajaxWithRetry(requestData);
               */
               return true;
             }
        };

        /**
         * Create error pop up. app.js will manage the view creation.
         * @param {String} error title to user
         * @param {String} error message to user
         * @param {Object} list of buttons with text string, and click callback
         */
        this.createErrorDialog = function(title, message, buttons) {
            var errorObj = {
                title: title,
                message: message,
                buttons: buttons
            };
            return new DialogView(errorObj);
        };
    }

    exports.ErrorHandler = ErrorHandler;
}(window));
