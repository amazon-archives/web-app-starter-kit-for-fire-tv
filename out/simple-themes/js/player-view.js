/* Player View
 *
 * Handles the media playback
 *
 */

(function(exports) {
    "use strict";

    /**
     * @class PlayerView
     * @description The detail view object, this handles everything about the detail view.
     */
    function PlayerView(settings) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'videoStatus', 'videoError', 'indexChange']);

        //jquery constants
        this.$el = null;
        this.$currSeekTime = null;
        this.canplay = null;
        this.controlsView = null;
        this.durationFound = false;
        this.isLive = false;

        //class variables
        this.fullscreenOpen = false;
        
        this.SKIP_LENGTH_DEFAULT = 10;

        //set skip length
        if (settings.skipLength) {
            this.skipLength = settings.skipLength;
        } else {
            this.skipLength = this.SKIP_LENGTH_DEFAULT;
        }
        /**
         * Handler for video 'canplay' event
         */
        this.canPlayHandler = function() {
            this.canplay = true;
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'canplay');
        }.bind(this);

        /**
         * @function pauseEventHandler
         * @description handles video element pause event
         */
        this.pauseEventHandler = function() {
            // we trigger the video status in the pause event handler because the pause event can come from the system
            // specifically it can be caused by the voice search functionality of Fire OS
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'paused');
        }.bind(this);

        /**
         * Handler for video 'ended' event
         */
        this.videoEndedHandler = function() {
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'ended');
        }.bind(this);

        this.updateTitleAndDescription = function(title, description) {
            if(this.controlsView) {
                this.controlsView.updateTitleAndDescription(title, description);
            }
        }.bind(this);
        /**
         * Video On Event handler ONLY
         * This is the handler for the webkitfullscreen event
         * For non-visual on implimentations you can remove this method
         * as well as the event listener in the render function
         */
        this.fullScreenChangeHandler = function() {
            if (this.fullscreenOpen) {
                this.videoEndedHandler();
                this.fullscreenOpen = false;
            } else {
                this.fullscreenOpen = true;
            }
        }.bind(this);

        /*
         * Controls currently showing status indicator
         */
        this.controlsCurrentlyShowing = function() {
            return this.controlsView.controlsShowing();
        }.bind(this);

        /*
         * Handler for the 'durationchange' event
         */
        this.durationChangeHandler = function() {
            if (this.videoElement.duration && this.videoElement.duration > 0) {
                this.durationFound = true;
            }
        }.bind(this);

        /*
         * Handler for the 'timeupdate' event
         */
        this.timeUpdateHandler = function() {
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        }.bind(this);

        /*
         * Handler for the media 'error' event
         */
        this.errorHandler = function(e) {
            var errorType;
            if (e.target.error && e.target.error.code) {
                switch (e.target.error.code) {
                    case e.target.error.MEDIA_ERR_ABORTED:
                    case e.target.error.MEDIA_ERR_NETWORK:
                        errorType = 'network';
                        break;
                    case e.target.error.MEDIA_ERR_DECODE:
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorType = 'content';
                        break;
                    default:
                        errorType = 'unknown';
                        break;
                }
            } else {
                // no error code, default to unknown type
                errorType = 'unknown';
            }
            this.trigger('videoError', errorType);
        }.bind(this);

        /**
         * Remove the video element from the app
         */
        this.remove = function() {
            this.videoElement.pause();
            this.videoElement.src = "";
            this.controlsView.remove();
            this.$el.remove();
        };

        /**
         * Hides the video
         */
        this.hide = function() {
            this.$el.css("visibility", "hidden");
        };

        /**
         * show the video
         */
        this.show = function() {
            this.$el.css("visibility", "");
            if (this.durationFound) {
                this.controlsView.showAndHideControls();
            }
        };

        /**
         * Creates the main content view from the template and appends it to the given element
         */
        this.render = function ($container, data, index) {
            // Build the main content template and add it
            data = data[index];
            var html = utils.buildTemplate($("#player-view-template"), data);
            $container.append(html);
            this.$el = $container.children().last();

            this.$containerControls = $container.find(".player-controls-container");
            this.containerControls = this.$containerControls[0];

            // create the video element
            this.videoElement = document.createElement('video');
            this.videoElement.className = 'player-content-video';
            var source = document.createElement('source');
            source.src = data.videoURL;
            source.type = 'video/mp4';
            this.videoElement.appendChild(source);
            this.handleClosedCaptioning(data.tracks);
            this.$el.append(this.videoElement);

            this.videoElement.focus();

            //add event listeners
            this.videoElement.addEventListener("canplay", this.canPlayHandler);
            this.videoElement.addEventListener("ended", this.videoEndedHandler);
            this.videoElement.addEventListener("timeupdate", this.timeUpdateHandler);
            this.videoElement.addEventListener("pause", this.pauseEventHandler);
            this.videoElement.addEventListener("error", this.errorHandler);

            //listener for visual on video playback only - remove for non-visual on implementation
            this.videoElement.addEventListener(utils.vendorPrefix('fullscreenchange').toLowerCase(), this.fullScreenChangeHandler);

            // create controls
            if (data.type === "video-live") {
                this.isLive = true;
                this.controlsView = new LiveControlsView();
                this.controlsView.render(this.$el, data, this); 
            }
            else {
                this.controlsView = new ControlsView();
                this.controlsView.render(this.$el, data, this); 
            }

            this.videoElement.addEventListener('durationchange', this.durationChangeHandler);

        };

        /**
         * @function playVideo
         * @description start the video playing
         */
        this.playVideo = function() {
            this.videoElement.play();
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        };

        /**
         * @function pauseVideo
         * @description pause the currently playing video, called when app loses focus
         */
        this.pauseVideo = function() {
            // this no longer directly sends a video status event, as the pause can come from Fire OS and not just
            // user input, so this strictly calls the video element pause
            this.videoElement.pause();
        };

        /**
         * @function resumeVideo
         * @description resume the currently playing video, called when app regains focus
         */
        this.resumeVideo = function() {
            this.videoElement.play();
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'resumed');
        };

        /**
         * @function seekVideo
         * @description navigate to a position in the video
         */
        this.seekVideo = function(position) {
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
            this.videoElement.currentTime = position;
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'seeking');
        };

        // handle button events, connected to video API for a few operations
        this.handleControls = function(e) {
            if (e.type !== 'buttonpress' && e.type !== 'touch') {
                return;
            }

            switch (e.keyCode) {
                case buttons.BACK:
                    this.trigger('exit');
                    break;

                case buttons.LEFT:
                case buttons.REWIND:
                    if (!this.isLive) {
                        this.seekVideo(this.videoElement.currentTime - this.skipLength);
                    }
                    break;

                case buttons.RIGHT:
                case buttons.FAST_FORWARD:
                    if (!this.isLive) {
                        this.seekVideo(this.videoElement.currentTime + this.skipLength);
                    }
                    break;

                case buttons.SELECT:
                case buttons.PLAY_PAUSE:
                    if (this.videoElement.paused) {
                        this.resumeVideo();
                    } else {
                        this.pauseVideo();
                    }
                    break;
                case buttons.UP:
                    this.controlsView.showAndHideControls();
                    break;
                case buttons.DOWN:
                    if (!this.videoElement.paused) {
                        this.controlsView.hide();
                    }
                    break;
            }
        }.bind(this);

        /**
         * @function handleClosedCaptioning
         * @description if closed caption tracks are available, display options to enable and select them
         */
        this.handleClosedCaptioning = function(tracks) {
            // TODO: we likely will move this out and make the options part of the controls, however for now we
            //  default to the first track if available
            if (tracks && tracks.length > 0) {
                var trackElement = document.createElement('track');
                var track = tracks[0]; // temporarily default to the first track
                trackElement.src = track.src;
                trackElement.label = track.label || "";
                trackElement.kind = track.kind || "subtitles";
                trackElement.srclang = track.srclang || window.navigator.language;
                trackElement.default = true;
                this.videoElement.appendChild(trackElement);
            }
        };

    }

    exports.PlayerView = PlayerView;
}(window));
