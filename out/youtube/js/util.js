/* Utilities 
 *
 * App utility methods 
 * 
 */ 

(function(exports) {
    "use strict";

    var options = { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

    var Utils = function() {
        // make it a singleton
        if (exports.utils) {
            return utils;
        }

        this.prefix = '';

        /**
         * @function buildTemplate
         * @param {object} el handlebars template element
         * @param {object} context data for filling out the template
         * @description Grabs the handlebars template, runs the data through it, and appends the final html to the homeview.
         */
        this.buildTemplate = function (el, context) {
            var source = el.html();
            var template = Handlebars.compile(source);
            return template(context);
        };

        /**
         * @function firstPageItem
         * @description Handlebars helper for only displaying items that fit in the main content view, this is decided by
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
         * @function vendorPrefix
         * @description apply vendor prefix (indiscriminately) to passed style
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

    };

    exports.Utils = Utils;
    exports.utils = new Utils();
}(window));

