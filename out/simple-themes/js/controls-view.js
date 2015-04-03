/* Controls View
 *
 * Handles the custom video controls which overlay the video
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class ContolsView
     * @description The custom controls object, this handles everything about the custom controls.
     */
    function ControlsView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['loadingComplete']);

        //jquery constants
        this.$el = null;
        this.$currSeekTime = null;
        this.$containerControls = null;
        this.$rewindIndicator = null;
        this.$forwardIndicator = null;
        this.$forwardIndicatorText = null;
        this.$rewindIndicatorText = null;


        //class variables
        this.rewindIndicator = null;
        this.forwardIndicator = null;
        this.playerView = null;
        this.containerControls = null;
        this.playIcon = null;
        this.seekHead = null;
        this.totalDurationFound = null;
        this.removalTimeout = null;
        this.previousTime = null;
        this.MAX_SKIP_TIME = 30;
        this.SKIP_INDICATOR_OFFSET = 5;
        this.PAUSE_REMOVAL_TIME = 1500;
        this.CONTROLS_HIDE_TIME = 3000;


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
         */
        this.render = function ($container, data, playerView) {
            // Build the  content template and add it
            var html = utils.buildTemplate($("#controls-view-template"), {});

            $container.append(html);
            this.$containerControls = $container.children().last();
            this.containerControls = $container.children().last()[0];
            this.playIcon = $container.find(".player-pause-button")[0];

            this.$containerControls.find(".player-controls-content-title").text(data.title);
            this.$containerControls.find(".player-controls-content-subtitle").text(this.truncateSubtitle(data.description));
            this.seekHead = this.$containerControls.find(".player-controls-timeline-playhead")[0];
            this.$currSeekTime = this.$containerControls.find(".player-controls-timestamp-curtime");
            this.$forwardIndicator = this.$containerControls.find("#forward-indicator");
            this.$rewindIndicator = this.$containerControls.find("#rewind-indicator");
            this.forwardIndicator = this.$forwardIndicator[0];
            this.rewindIndicator = this.$rewindIndicator[0];
            this.$forwardIndicatorText = this.$forwardIndicator.find(".player-controls-skip-number");
            this.$rewindIndicatorText = this.$rewindIndicator.find(".player-controls-skip-number");
            this.playerView = playerView;
            playerView.on('videoStatus', this.handleVideoStatus, this);
        };

        /**
         * @function convertSecondsToHHMMSS
         * @description convert seconds to string format for custom controls
         */
        this.convertSecondsToHHMMSS = function(seconds, alwaysIncludeHours) {
            var hours = Math.floor( seconds / 3600 );
            var minutes = Math.floor( seconds / 60 ) % 60;
            seconds = Math.floor( seconds % 60 );

            var finalString = "";

            if (hours > 0 || alwaysIncludeHours) {
                finalString += hours + ":";
            }
            return finalString + ('00' + minutes).slice(-2) + ":" + ('00' + seconds).slice(-2);
        };

        /**
        * @function handleVideoStatus
        * @description status handler for video status events to convert them into showing correct controls
        */
        this.handleVideoStatus = function(currentTime, duration, type) {
            // video has been loaded correctly
            if (!this.totalDurationFound) {
                this.durationChangeHandler(duration);
            }

            if (type === "paused") {
                this.pausePressed();
            }
            else if (type === "playing") {
                this.timeUpdateHandler(duration, currentTime);
            }
            else if (type === "resumed") {
                this.resumePressed();
            }
            else if (type === "seeking") {
                this.seekPressed(currentTime);
            }
            this.previousTime = currentTime;
        }.bind(this);

        /**
        * @function seekPressed
        * @description show the seek/rewind controls
        */
        this.seekPressed = function(currentTime) {
            var skipTime;

            if (this.previousTime > currentTime) {
                // skip forward
                skipTime = Math.round(Math.abs(this.previousTime - currentTime));
                if (skipTime <= this.MAX_SKIP_TIME) {
                    this.showAndHideControls();
                    this.$rewindIndicatorText.text(skipTime);
                    this.$rewindIndicator.css("display", "flex");
                    this.$forwardIndicator.hide();
                    setTimeout(function() {
                        this.$rewindIndicator.hide();
                    }.bind(this), this.CONTROLS_HIDE_TIME);
                }
            }
            else if (currentTime > this.previousTime) {
                // skip backwards
                skipTime = Math.round(Math.abs(currentTime - this.previousTime));
                if (skipTime <= this.MAX_SKIP_TIME) {
                    this.showAndHideControls();
                    this.$forwardIndicatorText.text(skipTime);
                    this.$forwardIndicator.css("display", "flex");
                    this.$rewindIndicator.hide();
                    setTimeout(function() {
                        this.$forwardIndicator.hide();
                    }.bind(this), this.CONTROLS_HIDE_TIME);
                }
            }
        }.bind(this);

       /**
        * Time Update Event handler within the video
        */
        this.timeUpdateHandler = function(videoDuration, videoCurrentTime) {

            // Calculate the slider value
            var value = (100 / videoDuration) * videoCurrentTime;
            this.seekHead.style.width = value + "%";
            this.forwardIndicator.style.left = (value - this.SKIP_INDICATOR_OFFSET) + "%";
            this.rewindIndicator.style.left = (value - this.SKIP_INDICATOR_OFFSET) + "%";
            this.$currSeekTime.text(this.convertSecondsToHHMMSS(videoCurrentTime, this.videoDuration > 3600 ));
        }.bind(this);

        this.durationChangeHandler = function(videoDuration) {
            // check if we have found a duration yet, and that duration is a real value
            if (!this.totalDurationFound && videoDuration && videoDuration > 0) {
                    var duration = this.convertSecondsToHHMMSS(videoDuration);
                    this.$containerControls.find(".player-controls-timestamp-totaltime").text(duration);
                    this.totalDurationFound = true;

                    // show controls after duration found
                    this.containerControls.style.opacity = "0.99";
                    this.playIcon.style.opacity = "0";
                    this.showAndHideControls();
            }
        }.bind(this);

        /**
        * @function pauseVideo
        * @description pause the currently playing video, called when app loses focus
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
        * @function resumeVideo
        * @description resume the currently playing video, called when app regains focus
        */
        this.resumePressed = function() {
            // hide pause icon
            this.playIcon.style.opacity = "0";
            this.showAndHideControls();
        };

        /**
         * @function showAndHideControls
         * @description Shows the controls and hides them after 3s, resets the timer if this function is called again.
         */
        this.showAndHideControls = function() {
            this.containerControls.style.opacity = "0.99";
            clearTimeout(this.removalTimeout);
            this.removalTimeout = setTimeout(function() {
                 this.containerControls.style.opacity = "0";
                 this.$rewindIndicator.hide();
                 this.$forwardIndicator.hide();
            }.bind(this), this.CONTROLS_HIDE_TIME);
        };

        /**
         * @function truncateSubtitle
         * @description truncate subtitle with elipsis
         */
        this.truncateSubtitle = function(string) {
           if (string.length > 150) {
              return string.substring(0,147)+'...';
           } else {
              return string;
          }
        };
    }

    exports.ControlsView = ControlsView;
}(window));
