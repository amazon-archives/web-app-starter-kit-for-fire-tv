/* Button View
 *
 * Handles the display of buttons under the content description  
 * 
 */
(function (exports) {
    "use strict";

    //constants
    var CLASS_BUTTON_STATIC = "detail-item-button-static",

        CLASS_BUTTON_SELECTED = "detail-item-button-selected";

   /**
    * @class ButtonView 
    * @description The Button view object, this handles everything about the buttons 
    */
    function ButtonView() {

        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'revoke', 'select']);

        //global variables
        this.selectedButtonIndex = 0;
        this.handleButtonCallback = null;
        
        //jquery global variables
        this.$el = null;
        this.$buttons = null;

       /**
        * Hides the button view
        */
        this.hide = function () {
            this.$el.hide();
        };

        /**
         * Display the button view
         */
        this.show = function () {
            this.$el.show();
        };

       /**
        * Remove the button view
        */
        this.remove = function () {
            this.$el.remove();
        };

       /**
        * Remove the styling from the existing selected button
        * and add the selected style to the newly selected button
        */
        this.updateSelectedButton = function () {
            //remove hilight from last selected button
            this.setStaticButton();

            //add hilight to newly selected button
            this.setSelectedButton();
        };

       /**
        * Change the style of the selected element to selected 
        */
        this.setSelectedButton = function () {
            //apply the selected class to the newly-selected button
            var buttonElement = $(this.getCurrentSelectedButton());

            buttonElement.removeClass(CLASS_BUTTON_STATIC);
            buttonElement.addClass(CLASS_BUTTON_SELECTED);
        };

       /**
        * Change the style of the unselected button to static 
        */
        this.setStaticButton = function () {
            var buttonElement = $("." + CLASS_BUTTON_SELECTED);

            if(buttonElement) {
                buttonElement.removeClass(CLASS_BUTTON_SELECTED);
                buttonElement.addClass(CLASS_BUTTON_STATIC);
            }
        };

       /**
        * Event handler for remote "select" button press 
        */
        this.handleButtonEvent = function () {
            var currentButton = this.getCurrentSelectedButton();
            if(typeof this.handleButtonCallback === "function") {
                this.handleButtonCallback(currentButton);
            }
            else {
                console.log('no callback provided');
                alert("You pressed the " + currentButton.innerHTML + " button"); 
            }
            buttons.resync();
        }.bind(this);

      /**
        * Event hander for tap
        * @param {Event} e
        */
        this.handleButtonTap = function (e) {
            this.showAlert(e.target.innerHTML);
        }.bind(this);

        /**
         * Creates the button view from the template and appends it to the given element
         * @param {Element} $el the application container
         * @param {Array} buttonArr the buttons that need to be added
         * @param {Function} buttonCallbackHandler callback method for button selection 
         */
        this.render = function ($el, buttonArr, buttonCallbackHandler) {
            // Build the left nav template and add its
            var html = utils.buildTemplate($("#button-view-template"), {
                items:buttonArr 
            });

            $el.append(html);

            this.$el = $el.children().last();
            this.$buttons = $el.find(".detail-item-button-static");

            this.handleButtonCallback = buttonCallbackHandler;

            touches.registerTouchHandler("detail-item-button-static", this.handleButtonTap);
        };

       /**
        * Key event handler
        * handles controls: LEFT : select button to the left 
        *                   RIGHT: select button to the right 
        *                   UP:change focus back to 1D view 
        *                   DOWN:Nothing 
        *                   BACK: Change focus back to 1D view 
        * @param {event} the keydown event
        */
        this.handleControls = function (e) {
            if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.UP:
                        this.setStaticButton();
                        this.trigger('exit');
                        break;

                    case buttons.DOWN:
                        break;
                    case buttons.LEFT:
                        this.incrementCurrentSelectedIndex(-1);
                        break;
                    case buttons.BACK:
                        this.setStaticButton();
                        this.trigger('exit');
                        break;
                    case buttons.SELECT:
                        //do button action
                        this.handleButtonEvent();
                        break;
                    case buttons.RIGHT:
                        this.incrementCurrentSelectedIndex(1);
                        break;
                }
           }
        }.bind(this);

       /**
        * Get the currently selected button
        */
        this.getCurrentSelectedButton = function() {
            return this.$buttons[this.selectedButtonIndex];
        };

       /**
        * Explicitly set the index of the currently selected item 
        * @param {number} index the index of the selected button 
        */
        this.setCurrentSelectedIndex = function(index) {
            this.selectedButtonIndex = index;
        };

       /**
        * Set the index and update the button views
        * @param {number} index the index of the selected button 
        */
        this.updateCurrentSelectedIndex = function(index) {
            this.selectedButtonIndex = index;
            this.updateSelectedButton();
        };

       /**
        * Increment the index of the currently selected item 
        * @param {number} increment the number to add or subtract from the currentSelectedIndex 
        */
        this.incrementCurrentSelectedIndex = function(increment) {
            var newIdx = this.selectedButtonIndex + increment;

            if(newIdx >= 0 && newIdx < this.$buttons.length) {
                this.selectedButtonIndex = newIdx;
                this.updateSelectedButton();
             }
        };

    }

    exports.ButtonView = ButtonView;

}(window));
