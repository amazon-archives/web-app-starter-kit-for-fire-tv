/* Utilities 
 *
 * App utility methods 
 * 
 */ 

(function(exports) {
    "use strict";

    var options = { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

    function Utils(settings) {
        // make it a singleton
        if (exports.utils) {
            return utils;
        }

        // default ajax retry times is set to 3
        settings.retryTimes = settings.retryTimes || 3;
        // default ajax timeout is set to 10 seconds (ajax timeout value is in milliseconds, hence we need to multiply by 1000)
        settings.networkTimeout = 1000*(settings.networkTimeout || 10);

        this.prefix = '';
        this.errorTriggered = false;

        /**
         * Grabs the handlebars template, runs the data through it, and appends the final html to the homeview.
         * @param {object} el handlebars template element
         * @param {object} context data for filling out the template
         */
        this.buildTemplate = function (el, context) {
            var source = el.html();
            var template = Handlebars.compile(source);
            return template(context);
        };

        /**
         * Handlebars helper for only displaying items that fit in the main content view, this is decided by
         * the SHOWN_ROW_ITEM_LENGTH constant, this constant would change depending on the width of your items, this allows
         * handlebars to display items that are on the first page, and not display others.
         */
         Handlebars.registerHelper('firstPageItem', function (value, options) {
             if (value >= 6) {
                 return options.inverse(this);
             } else {
                 return options.fn(this);
             }
         });

        /**
         * apply vendor prefix (indiscriminately) to passed style
         */
        this.vendorPrefix = function(prop) {
            return this.prefix + prop;
        };

        // find the current vendor prefix
        var regex = /^(Moz|Webkit|ms)(?=[A-Z])/;
        var someScript = document.getElementsByTagName('script')[0];

        for (var prop in someScript.style) {
            if (someScript.style.hasOwnProperty(prop) && regex.test(prop))  {
                this.prefix = prop.match(regex)[0];
                break;
            }
        }

        if (!this.prefix && 'WebkitOpacity' in someScript.style) {
            this.prefix = 'Webkit';
        }
        if (!this.prefix) {
            // unprefixed, go figure
            this.prefix = '';
        }

       /**
        * Convert timestamp to formated date
        * @param {Number} date timestamp
        * @return {String}
        */
        this.formatDate = function(date){
            return new Date(date).toLocaleTimeString("en-us", options);
        };

       /**
        * Wrapper around ajax call to provide retry function
        * @param {Object} requestData data object that is to be passed to ajax call body
        */
        this.ajaxWithRetry = function(requestData) {
            requestData.timeout = settings.networkTimeout;
            this.ajaxHelper(settings.retryTimes, requestData, requestData.error, requestData.complete);
        };

       /**
        * Helper function to recursively call itself until we exhausted the retry times upon error
        * @param {Number} number of times to retry
        * @param {Object} request data object that is to be passed to ajax call body
        * @param {function} error callback function when we exhausted retries
        */
        this.ajaxHelper = function(retryTimes, requestData, errorCallBack, completeCallBack) {
            if (retryTimes < 0) {
                retryTimes = 0;
            }
            requestData.complete = function() {
                if (!this.errorTriggered && completeCallBack) {
                    completeCallBack(arguments);
                }
                this.errorTriggered = false;
            }.bind(this);

            requestData.error = function(jqXHR, textStatus, errorThrown) {
                this.errorTriggered = true;
                if (retryTimes === 0) {
                    errorCallBack(jqXHR, textStatus, errorThrown);
                } else {
                    this.ajaxHelper(retryTimes - 1, requestData, errorCallBack, completeCallBack);
                }
            }.bind(this);
            $.ajax(requestData);
        }.bind(this);
    };

    exports.Utils = Utils;
}(window));
