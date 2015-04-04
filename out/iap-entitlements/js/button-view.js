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
        this.selectedButton = -1;
        
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
        * Change the style of the selected element to selected 
        */
        this.setSelectedButton = function () {
            //first make sure we don't already have a selected button
            this.setStaticButton();

            //apply the selected class to the newly-selected button
            var buttonElement = $(this.$buttons[this.selectedButton]);

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
            this.showAlert(this.$buttons[this.selectedButton].innerHTML); 
        }.bind(this);

       /**
        * Event hander for tap
        * @param {Event} e
        */
        this.handleButtonTap = function (e) {
            this.showAlert(e.target.innerHTML);
        }.bind(this);

       /**
        * Display alert for button press/select
        * @param {String} buttonValue the innerHTML of the button
        */
        this.showAlert = function (buttonValue) {
            alert("You selected the '" + buttonValue + "' button");

            //resync the buttons after the alert
            buttons.resync();
        };

        /**
         * Creates the button view from the template and appends it to the given element
         * @param {Element} $el the application container
         */
        this.render = function ($el) {
            // Build the left nav template and add its
            var html = utils.buildTemplate($("#button-view-template"));

            $el.append(html);
            this.$el = $el.children().last();
            this.$buttons = $el.find(".detail-item-button-static");

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
                        //check if we are on the left button
                        if(this.selectedButton > 0) {
                            this.setCurrentSelectedIndex(0);
                            this.setSelectedButton();
                        }
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
                        //check if we are on the right button
                        if(this.selectedButton < this.$buttons.length) {
                            this.setCurrentSelectedIndex(1);
                            this.setSelectedButton();
                        }
                        //select right button
                        break;
                }
           }
        }.bind(this);

       /**
        * Set the index of the currently selected item 
        * @param {number} index the index of the selected button 
        */
        this.setCurrentSelectedIndex = function(index) {
            this.selectedButton = index;
        };

    }

    exports.ButtonView = ButtonView;

}(window));
