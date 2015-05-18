/* Touches utility
 *
 * Handle template touch events
 *
 */

(function(exports) {
    "use strict";

    /**
     * Touches handle touch events on tablet devices
     * @return {*}
     * @constructor
     */
    function Touches() {
        // make it a singleton
        if (exports.touches) {
            return touches;
        }

        /**
         * Touches uses Events to trigger touch events
         */
        Events.call(this, ['touch', 'touchhold', 'swipe']);

        this.UP = 38;
        this.DOWN = 40;
        this.LEFT = 37;
        this.RIGHT = 39;

        this.currentKey = 0;
        this.fingers = 0;
        this.startX = 0;
        this.startY = 0;
        this.curX = 0;
        this.curY = 0;
        this.minSwipe = 70;
        this.swipeLength = 0;
        this.swipeAngle = null;
        this.swipeDirection = null;

       /**
        * Reset touch handler variables
        */
        this.reset = function() {
            // reset the variables back to default values
            this.fingers = 0;
            this.startX = 0;
            this.startY = 0;
            this.curX = 0;
            this.curY = 0;
            this.swipeLength = 0;
            this.swipeAngle = null;
            this.swipeDirection = null;
        };

       /**
        * Touch Start Handler
        * @param {Event} event touch event
        */
        this.touchStart = function(event) {
            event.preventDefault();

            // get the total number of fingers touching the screen
            this.fingers = event.touches.length;

            //make sure we only have a single finger touch
            if ( this.fingers === 1 ) {
                // get starting coordinates
                this.startX = event.touches[0].pageX;
                this.startY = event.touches[0].pageY;
            } else {
                //don't handle muli-touch gestures
                this.reset();
            }
        }.bind(this);

       /**
        * Touch Move Handler
        * @param {Event} event touch event
        */
        this.touchMove = function(event) {
            event.preventDefault();
                if ( event.touches.length === 1 ) {
                this.curX = event.touches[0].pageX;
                this.curY = event.touches[0].pageY;
            } else {
                this.reset();
            }
        }.bind(this);

       /**
        * Touch End Handler
        * @param {Event} event touch event
        */
        this.touchEnd = function(event) {
            event.preventDefault();
            //Make sure we only have a single finger touch
            if ( this.fingers === 1 && this.curX !== 0 ) {
                //calculate length of swipe
                this.swipeLength = Math.round(Math.sqrt(Math.pow(this.curX - this.startX,2) + Math.pow(this.curY - this.startY,2)));

                //if we have met the minimum swipe distance then handle the swipe
                if ( this.swipeLength >= this.minSwipe ) {
                    this.caluculateAngle();
                    this.getSwipeDirection();
                    this.implementTouchEvent();
                    this.reset();
                } else {
                    this.handleTap(event);
                }
            } else {
                this.handleTap(event);
            }
        }.bind(this);

       /**
        * Handles single tap as opposed to swipe
        * @param {Event} event
        */
        this.handleTap = function(event) {
            var ele = event.target;
            for(var c=0; c<ele.classList.length; c++) {
                if(touchObj[ele.classList[c]]) {
                    touchObj[ele.classList[c]](event);
                    break;
                }
            }
        };

       /**
        * Calculate angle of swipe
        */
        this.caluculateAngle = function() {
            var X = this.startX-this.curX;
            var Y = this.curY-this.startY;
            var r = Math.atan2(Y,X);
            this.swipeAngle = Math.round(r*180/Math.PI);
            if ( this.swipeAngle < 0 ) { this.swipeAngle =  360 - Math.abs(this.swipeAngle); }
        };

       /**
        * If swipe - get the direction
        */
        this.getSwipeDirection= function() {
            if ( (this.swipeAngle <= 45) && (this.swipeAngle >= 0) ) {
                this.swipeDirection = 'left';
            } else if ( (this.swipeAngle <= 360) && (this.swipeAngle >= 315) ) {
                this.swipeDirection = 'left';
            } else if ( (this.swipeAngle >= 135) && (this.swipeAngle <= 225) ) {
                this.swipeDirection = 'right';
            } else if ( (this.swipeAngle > 45) && (this.swipeAngle < 135) ) {
                this.swipeDirection = 'down';
            } else {
                this.swipeDirection = 'up';
            }
        };

       /**
        * Trigger the correct touch event
        */
        this.implementTouchEvent = function() {
            if ( this.swipeDirection === 'left' ) {
                this.trigger('swipe', {type: 'swipe', keyCode: this.LEFT});
            } else if ( this.swipeDirection === 'right' ) {
                this.trigger('swipe', {type: 'swipe', keyCode: this.RIGHT});
            } else if ( this.swipeDirection === 'up' ) {
                this.trigger('swipe', {type: 'swipe', keyCode: this.UP});
            } else if ( this.swipeDirection === 'down' ) {
                this.trigger('swipe', {type: 'swipe', keyCode: this.DOWN});
            }
        };

        var touchObj = {};

        this.registerTouchHandler = function(touchEle, touchHandler) {
            touchObj[touchEle] = touchHandler;
        };

        window.addEventListener("touchstart", this.touchStart, false);
        window.addEventListener("touchend", this.touchEnd, false);
        window.addEventListener("touchmove", this.touchMove, false);

    }

    exports.Touches = Touches;
    exports.touches = new Touches();
}(window));
