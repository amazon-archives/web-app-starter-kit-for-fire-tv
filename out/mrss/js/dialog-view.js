/* Dialog View
 *
 * Handles modal dialog
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class DialogView
     * @description The generic dialog view for modal dialogs
     */
    function DialogView(dialogData) {
        Events.call(this, ['exit']);

        this.title = dialogData.title;
        this.message = dialogData.message;
        this.buttons = dialogData.buttons;
        this.buttonView = null;
        this.$el = null;
        
        /**
         * renders the dialog to show the user, can have up to two buttons with callbacks
         * @param {object} $container element that contains the dialog 
         */
        this.render = function ($container) {
            var html = utils.buildTemplate($("#dialog-template"), dialogData);
            $container.append(html);
            this.$el = $container.children().last();

            // set up the button view
            var buttonView = this.buttonView = new ButtonView();

            //Create a buttons array for the buttons you want to add
            var buttonArr = [];
            for (var i = 0; i < this.buttons.length; i++) {
                buttonArr.push({
                    id: this.buttons[i].id,
                    buttonValue: this.buttons[i].text
                });
            }

            // render the button view and select the first button
            buttonView.render(this.$el.find(".dialog-buttons-container"), buttonArr, this.handleButtonCallback);
            this.buttonView.updateCurrentSelectedIndex(0);

            // reselect the same button on the exit event, basically throw away the exit event in this dialog
            buttonView.on("exit", function() {
                this.buttonView.updateCurrentSelectedIndex(this.buttonView.selectedButtonIndex);
            }.bind(this));
        };

        /**
         * handles the button click callback and passes it to the correct dialogData button callback
         * @param {object} the button which was pressed by the user
         */
        this.handleButtonCallback = function(button) {
            var clickedButton = $(button).attr('id');
            // find the matching button from the buttons list to call the callback
            for (var i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].id === clickedButton) {
                    this.buttons[i].callback(this.buttons[i]);
                    return;
                }
            }
        }.bind(this);

        /**
         * Handle key events
         * @param {event} the keydown event
         */
        this.handleControls = function (e) {
            this.buttonView.handleControls(e);
        }.bind(this);

        /**
         * Remove the dialog from the app
         */
        this.remove = function() {
            this.$el.remove();
        };
    }

    exports.DialogView = DialogView;
}(window));
