/* Buttons utility
 *
 * Normalize input to a simple 5 way nav plus back button
 *
 */

(function(exports) {
    "use strict";

    /**
     * Buttons provides a simple abstraction for a 5-way nav plus back and media buttons.
     * Buttons trigger events: 'buttonpress', optionally 'buttonrepeat' at a decaying interval, and 'buttonrelease'
     * Only one button at a time can be pressed, other key events are ignored until that button is released.
     * Button codes are based on keyboard keyCodes for simplicity.
     * @return {*}
     * @constructor
     */
    function Buttons() {
        // make it a singleton
        if (exports.buttons) {
            return buttons;
        }

        /**
         * Buttons uses Events to trigger the button events
         */
        Events.call(this, ['buttonpress', 'buttonrepeat', 'buttonrelease']);

        /**
         * constants for buttons, based onf keyCode for key events:
         */
        this.UP = 38;
        this.DOWN = 40;
        this.LEFT = 37;
        this.RIGHT = 39;
        this.SELECT = 13;
        this.BACK = 8;
        this.REWIND = 227;
        this.PLAY_PAUSE = 179;
        this.FAST_FORWARD = 228;

        this.KEYCODES = [8, 13, 37, 38, 39, 40, 179, 227, 228];
        this.BUTTON_INTERVALS = [250, 350, 500];

        // records if the button is currently held down for different interaction on button hold
        this.startHeldDown = {};
        this.intervalIndex = 0;
        this.currentKey = 0;
        this.scrollTimerId = 0;
        this.suspended = false;
        this.buttonIntervals = this.BUTTON_INTERVALS;
        this.currentInterval = 0;

        /**
         * reset abandons any subsequent events from the current button press, no more buttonrepeat or buttonrelease events
         * will be generated even if the button remains held down
         */
        this.reset = function() {
            this.currentKey = 0;
            if (this.scrollTimerId) {
                window.clearTimeout(this.scrollTimerId);
                this.scrollTimerId = 0;
            }
            this.suspended = false;
        };

        /**
         * resync with browser key state, needed when window loses focus and system keyUp events may get lost
         * if a button is held down the next keyDown event (from auto-repeat) will trigger a 'buttonpress'
         */
        this.resync = function() {
            this.reset();
            this.startHeldDown = {};
        };

        /**
         * suspend processing of key events and let them propagate normally, e.g. so that an input
         * element can get text, call reset() to end suspension
         */
        this.suspend = function() {
            this.resync();
            this.suspended = true;
        };

        // gets the next delay interval, pass reset=true to start over
        this.getButtonInterval = function(reset) {
                if (reset) {
                    this.intervalIndex = this.buttonIntervals.length;
                }
                
                if (this.intervalIndex > 0) {
                    this.intervalIndex--;
                }
                this.currentInterval = this.buttonIntervals[this.intervalIndex];
                return this.currentInterval;
        };

        // browser integration, de-bounce and de-duplicate key events, only allow one button at a time to be handled
        this.handleKeyDown = function (e) {
            var keyCode = e.keyCode;
            if (!this.suspended && this.KEYCODES.indexOf(keyCode) >= 0) {
                e.preventDefault();
                if (!this.startHeldDown[keyCode]) { // ignore any repeated keyDown events (cleared on keyUp)
                    this.startHeldDown[keyCode] = e.timeStamp;
                    if (!this.currentKey) {
                        this.currentKey = keyCode;
                        this.scrollTimerId = window.setTimeout(this.doRepeat, this.getButtonInterval(true));
                        this.trigger('buttonpress', {type: 'buttonpress', keyCode: keyCode});
                    }
                }
            }
        }.bind(this);

        this.handleKeyUp = function (e) {
            var keyCode = e.keyCode;
            if (!this.suspended && this.KEYCODES.indexOf(keyCode) >= 0) {
                e.preventDefault();
                if (this.startHeldDown[keyCode]) { // ignore any keyUp events that aren't for keys which are down
                    this.startHeldDown[keyCode] = 0;

                    // only emit release if this handler also got press
                    if (this.currentKey === keyCode) {
                        this.currentKey = 0;
                        if (this.scrollTimerId) {
                            window.clearTimeout(this.scrollTimerId);
                            this.scrollTimerId = 0;
                        }
                        this.trigger('buttonrelease', {type: 'buttonrelease', keyCode: keyCode});
                    }
                }
            }
        }.bind(this);

        this.doRepeat = function () {
            if (!this.suspended && this.currentKey && this.startHeldDown[this.currentKey]) {
                this.scrollTimerId = window.setTimeout(this.doRepeat, this.getButtonInterval());
                this.trigger('buttonrepeat', {type: 'buttonrepeat', keyCode: this.currentKey});
            }
        }.bind(this);

        this.resetButtonIntervals = function() {
            this.setButtonIntervals(this.BUTTON_INTERVALS);
        }.bind(this);

        this.setButtonIntervals = function(interval) {
            if (this.buttonIntervals !== interval) {
                this.buttonIntervals = interval;
                this.intervalIndex = this.buttonIntervals.length;
            }
        }.bind(this);


        window.addEventListener("keydown", this.handleKeyDown, false);
        window.addEventListener("keyup", this.handleKeyUp, false);

        // the system handles the 'back' button on the remote and turns it into a browser back event, so
        // we use the history API to watch for 'popstate' (back button press) events and convert these into
        // button press events for the BACKSPACE key.
        // this is documented more in the AWV app knowledge base
        window.addEventListener("load", function () {
            window.addEventListener("popstate", function (evt) {
                if (window.history.state !== "backhandler") {
                    // state will be AFTER the 'backhandler' is popped, so we ignore it if it's popping dummy state
                    // handle same as BACKSPACE keycode
                    if (!this.suspended) {
                        this.handleKeyDown({type: 'keydown', keyCode: this.BACK, timeStamp: evt.timeStamp, preventDefault: function(){}});
                        this.handleKeyUp({type: 'keyup', keyCode: this.BACK, timeStamp: evt.timeStamp, preventDefault: function(){}});
                    }
                    window.history.pushState("backhandler", null, null);
                }
            }.bind(this));
            if (window.history.state !== "backhandler") {
                window.history.pushState("backhandler", null, null); // pushing a dummy state so that popstate is always called
            }
        }.bind(this));
    }

    exports.Buttons = Buttons;
    exports.buttons = new Buttons();
}(window));
