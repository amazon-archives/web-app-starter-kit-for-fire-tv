/* Events
 *
 * A _very_ simple event manager, here only to keep this project framework agnostic, replace with something more robust.
 *
 */

(function(exports) {
    "use strict";

    /**
     * Events provides a VERY simple event manager, with just the minimum needed to support this app, if you're
     * doing anything interesting, replace this with the event system from a framework.
     *
     * @param {array} eventSet : optional, pass an array of event types and the class will throw if an unknown event is
     * mentioned, useful for catching typos in event names
     * @constructor
     */
    function Events(eventSet) {

        this.eventSet = eventSet;
        this.eventHandlers = {};

        /**
         * register for an event
         * @param {string} event to listen for
         * @param {function} callback function to call when event is triggered, args will be whatever is passed to trigger
         * @param {object} context, 'this' for callback function, optional
         */
        this.on = function(event, callback, context) {
            if (this.eventSet && this.eventSet.indexOf(event) === -1) {
                throw "Unknown event: " + event;
            }
            var handlers = this.eventHandlers[event] || (this.eventHandlers[event] = []);
            handlers.push({callback: callback, context: context});
        };

        /**
         * unregister for (an) event(s)
         * @param {string} event to stop listening, or undefined to match all events
         * @param {function} callback function to remove, or undefined to match all functions
         * @param {object} context for function to remove, must match context passed to on
         * Note: implication is that calling off() with no args removes all handlers for all events
         */
        this.off = function(event, callback, context) {
            for (var evt in this.eventHandlers) {
                if (!event || event === evt) {
                    this.eventHandlers[evt] = this.eventHandlers[evt].filter(this.createEventHandler(callback, context));
                }
            }

        };

        /**
         * creates event handler function
         */
        this.createEventHandler = function(callback, context) {
            return function(element) {return (callback && callback !== element.callback) || (context && context !== element.context);};
        };

        /**
         * triggers an event, calling all the handlers
         * @param {string} event to trigger
         */
        this.trigger = function(event) {
            if (this.eventSet && this.eventSet.indexOf(event) === -1) {
                throw "Unknown event: " + event;
            }
            var handlers = this.eventHandlers[event];
            if (handlers) {
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i].callback.apply(handlers[i].context, Array.prototype.slice.call(arguments, 1));
                }
            }
        };
    }

    exports.Events = Events;
}(window));
