/* Live Video Controls View
 *
 * Handles the custom video controls which overlay the video on live streaming videos
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class LiveContolsView
     * @description The custom controls object, this handles everything about the custom controls.
     */
    function LiveControlsView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['loadingComplete']);

        //jquery constants
        this.$el = null;
        this.$currSeekTime = null;
        this.$containerControls = null;

        //class variables
        this.playerView = null;
        this.containerControls = null;
        this.totalDurationFound = null;
        this.removalTimeout = null;
        this.previousTime = null;
        this.MAX_SKIP_TIME = 30;
        this.SKIP_INDICATOR_OFFSET = 5;
        this.PAUSE_REMOVAL_TIME = 1500;
        this.CONTROLS_HIDE_TIME = 3000; 
        
        this.controlsHideTime = app.settingsParams.controlsHideTime || this.CONTROLS_HIDE_TIME;

       /**
        * Remove the controls element from the app
        */
        this.remove = function () {
            this.$containerControls.remove();
            clearTimeout(this.removalTimeout);
        };

       /**
        * Hide controls element
        */
        this.hide = function () {
            // using opacity here instead of .show()/.hide() because we have a transition effect that can't be done with
            // display none.
            this.containerControls.style.opacity = "0";
        };

       /**
        * Show controls element
        */
        this.show = function () {
            // using opacity here instead of .show()/.hide() because we have a transition effect that can't be done with
            // display none.
            this.containerControls.style.opacity = "0.99";
        };

      /**
        * Check if controls are currently showing
        */
        this.controlsShowing = function () {
            return (this.containerControls.style.opacity !== "0");
        };

        /* Updates the title and description */
        this.updateTitleAndDescription = function(title, description) {
            this.$containerControls.find(".player-controls-content-title").text(title);
            this.$containerControls.find(".player-controls-content-subtitle").text(this.truncateSubtitle(description));
        }.bind(this);

        /**
         * Creates the main content view from the template and appends it to the given element
         * @param {Object} $container to append to
         * @param {data} data containing the object for rendering
         * @param {Object} playerView parent to listen for events from
         */
        this.render = function ($container, data, playerView) {
            // Build the  content template and add it
            var html = utils.buildTemplate($("#controls-live-view-template"), {});

            $container.append(html);
            this.$containerControls = $container.children().last();
            this.containerControls = $container.children().last()[0];
            this.playIcon = $container.find(".player-pause-button")[0];

            this.$containerControls.find(".player-controls-content-title").text(data.title);
            this.$containerControls.find(".player-controls-content-subtitle").text(this.truncateSubtitle(data.description));

            this.playerView = playerView;
            playerView.on('videoStatus', this.handleVideoStatus, this);
        };

        /**
        * status handler for video status events to convert them into showing correct controls
        * @param {number} current playing time
        * @param {number} total duration of video
        * @param {string} status type
        */
        this.handleVideoStatus = function(currentTime, duration, type) {
            if (type === "paused") {
                this.pausePressed();
            }
            else if (type === "resumed") {
                this.resumePressed();
            }
            this.previousTime = currentTime;
        }.bind(this);

        /**
        * pause the currently playing video, called when app loses focus
        */
        this.pausePressed = function () {
            this.containerControls.style.opacity = "0.99";
            // show pause icon
            this.playIcon.style.opacity = "0.99";
            // hide the pause icon after designated time by ux
            setTimeout(function() {
                this.playIcon.style.opacity = "0";
            }.bind(this), this.PAUSE_REMOVAL_TIME);
            // cancel any pending timeouts
            clearTimeout(this.removalTimeout);

        };

        /**
        * resume the currently playing video, called when app regains focus
        */
        this.resumePressed = function() {
            // hide pause icon
            this.playIcon.style.opacity = "0";
            this.showAndHideControls();
        };

        /**
         * Shows the controls and hides them after 3s, resets the timer if this function is called again.
         */
        this.showAndHideControls = function() {
            this.containerControls.style.opacity = "0.99";
            clearTimeout(this.removalTimeout);
            this.removalTimeout = setTimeout(function() {
                 this.containerControls.style.opacity = "0";
            }.bind(this), this.controlsHideTime);
        };

        /**
         * truncate subtitle with ellipsis
         */
        this.truncateSubtitle = function(string) {
           if (string.length > 150) {
              return string.substring(0,147)+'...';
           } else {
              return string;
          }
        };
    }

    exports.LiveControlsView = LiveControlsView;
}(window));
