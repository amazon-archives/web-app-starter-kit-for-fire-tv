/* Player View
 *
 * Handles the media playback
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class PlayerView
     * @description The detail view object, this handles everything about the detail view.
     */
    var PlayerView = function () {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['videoStarted', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select']);

        //jquery constants
        this.$el = null;
        this.$currSeekTime = null;
        this.$containerControls = null;

        //class variables
        this.containerControls = null;
        this.playIcon = null;
        this.seekHead = null;
        this.totalDurationFound = null;
        this.removalTimeout = null;
        this.fullscreenOpen = false;

       /**
        * Handler for video 'canplay' event
        */
        this.canPlayHandler = function() {
            this.playVideo();
        }.bind(this);

       /**
        * Handler for video 'ended' event
        */
        this.videoEndedHandler = function ()  {
            this.trigger('exit');
        }.bind(this);

       /**
        * Video On Event handler ONLY
        * This is the handler for the webkitfullscreen event
        * For non-visual on implimentations you can remove this method
        * as well as the event listener in the render function
        */
        this.fullScreenChangeHandler = function () {
             if(this.fullscreenOpen) {
                 this.videoEndedHandler()
                 this.fullscreenOpen = false;
             } else {
                 this.fullscreenOpen = true;
             }
        }.bind(this);

       /**
        * Remove the video element from the app
        */
        this.remove = function () {
            this.videoElement.pause();
            this.videoElement.src = "";
            this.$el.remove();
        };

        /**
         * Creates the main content view from the template and appends it to the given element
         */
        this.render = function ($container, data) {
            // Build the main content template and add it
            var html = utils.buildTemplate($("#player-view-template"), data);

            $container.append(html);
            this.$el = $container.children().last();
            this.$containerControls = this.$el.find(".player-controls-container");
            this.containerControls = this.$containerControls[0];
            this.videoElement = this.$el.find(".player-content-video")[0];
            this.playIcon = this.$el.find(".player-pause-button")[0];

            this.videoElement.focus();
            this.$containerControls.find(".player-controls-content-title").text(data.title);
            this.$containerControls.find(".player-controls-content-subtitle").text(this.truncateSubtitle(data.description));
            this.seekHead = this.$containerControls.find(".player-controls-timeline-playhead")[0];
            this.$currSeekTime = this.$containerControls.find(".player-controls-timestamp-curtime");

            //add event listeners
            this.videoElement.addEventListener("canplay", this.canPlayHandler);
            this.videoElement.addEventListener("ended", this.videoEndedHandler);
            this.videoElement.addEventListener("timeupdate", this.timeUpdateHandler);
            this.videoElement.addEventListener("durationchange", this.durationChangeHandler);

            //listener for visual on video playback only - remove for non-visual on implementation
            this.videoElement.addEventListener("webkitfullscreenchange", this.fullScreenChangeHandler);
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
        * Time Update Event handler within the video
        */
        this.timeUpdateHandler = function() {
            // Calculate the slider value
            var value = (100 / this.videoElement.duration) * this.videoElement.currentTime;
            this.seekHead.style.width = value + "%";
            this.$currSeekTime.text(this.convertSecondsToHHMMSS(this.videoElement.currentTime, this.videoElement.duration > 3600 ));
        }.bind(this);

        this.durationChangeHandler = function() {
            // check if we have found a duration yet, and that duration is a real value
            if (!this.totalDurationFound && this.videoElement.duration && this.videoElement.duration > 0) {
                    var duration = this.convertSecondsToHHMMSS(this.videoElement.duration);
                    this.$containerControls.find(".player-controls-timestamp-totaltime").text(duration);
                    this.totalDurationFound = true;

                    // show controls after duration found
                    this.containerControls.style.opacity = "0.99";
                    this.playIcon.style.opacity = "0";
                    this.showAndHideControls();

                    //tell app video has started so loading spinner can be removed
                    this.trigger('videoStarted');

            }
        }.bind(this);

        /**
        * @function playVideo
        * @description start the video playing
        */
        this.playVideo = function() {
            this.videoElement.play();
        };

        /**
        * @function pauseVideo
        * @description pause the currently playing video, called when app loses focus
        */
        this.pauseVideo = function () {
            this.containerControls.style.opacity = "0.99";
            // show pause icon
            this.playIcon.style.opacity = "0.99";
            // cancel any pending timeouts
            clearTimeout(this.removalTimeout);
            this.videoElement.pause();
        };

        /**
        * @function resumeVideo
        * @description resume the currently playing video, called when app regains focus
        */
        this.resumeVideo = function() {
            this.videoElement.play();
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
            }.bind(this), 3000);
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

        // handle button events, connected to video API for a few operations
        this.handleControls = function (e) {
            if (e.type !== 'buttonpress') { return; }

            switch (e.keyCode) {
                case buttons.BACK:
                    this.trigger('exit');
                    break;

                case buttons.LEFT:
                case buttons.REWIND:
                    this.videoElement.currentTime -= 10;
                    this.showAndHideControls();
                    break;

                case buttons.RIGHT:
                case buttons.FAST_FORWARD:
                    this.videoElement.currentTime += 10;
                    this.showAndHideControls();
                    break;

                case buttons.SELECT:
                case buttons.PLAY_PAUSE:
                    if (this.videoElement.paused) {
                        this.resumeVideo();
                    } else {
                        this.pauseVideo();
                    }
                    break;
            }
        }.bind(this);
    };

    exports.PlayerView = PlayerView;
}(window));
