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
        Events.call(this, ['exit', 'videoStatus', 'indexChange', 'error']);

        //jquery constants
        this.$el = null;
        this.$currSeekTime = null;
        this.canplay = null;
        this.controlsView = null;
        this.durationFound = false;
        this.isLive = false;

        //class variables
        this.fullscreenOpen = false;
        this.buttonDowntime = null;
        this.paused = false;
        this.isSkipping = false;
        this.items = null;
        this.currentIndex = null;

        this.SKIP_LENGTH_DEFAULT = 5;
        this.PLAYER_TIMEOUT = 60000;
        this.PLAYER_SLOW_RESPONSE = 30000;
        this.BUTTON_INTERVALS = [100, 200, 300, 400, 500];
        // the button intervals for when slowing fast forward near the end of the video
        this.DECELLERATION_BUTTON_INTERVALS = [500, 400, 300, 200, 100];
        // the fast forward/reverse individual jump percentage higher is faster
        this.FAST_SEEK_JUMP_AMOUNT = 0.03;
        // the percentage left in the video when slowing fast forward begins
        this.DECELLERATION_PERCENTAGE_MOMENT = 0.3;
        this.knownPlayerErrorTriggered = false;

        //set skip length
        this.skipLength = settings.skipLength || this.SKIP_LENGTH_DEFAULT;

        /**
         * Handler for video 'canplay' event
         */
        this.canPlayHandler = function() {
            this.canplay = true;
            //prevent triggering 'canplay' event when skipping or when video is paused
            if (!this.paused && !this.isSkipping) {
                this.buttonDowntime = this.videoElement.currentTime;
                this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'canplay');
            }
        }.bind(this);

        /**
         * Handles video element pause event
         */
        this.pauseEventHandler = function() {
            // we trigger the video status in the pause event handler because the pause event can come from the system
            // specifically it can be caused by the voice search functionality of Fire OS
            this.clearTimeouts();
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'paused');
        }.bind(this);

        /**
         * Handler for video 'ended' event
         */
        this.videoEndedHandler = function() {
            this.clearTimeouts();
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
            this.clearTimeouts();
            if (!this.videoElement.paused) {
                this.playerTimeout = setTimeout(function() {
                                if (!this.knownPlayerErrorTriggered) {
                                    this.trigger('error', ErrorTypes.TIMEOUT_ERROR, errorHandler.genStack());
                                    this.knownPlayerErrorTriggered = true;
                                }
                            }.bind(this), this.PLAYER_TIMEOUT);
                this.playerSlowResponse = setTimeout(function() {
                                this.trigger('error', ErrorTypes.SLOW_RESPONSE, errorHandler.genStack());
                            }.bind(this), this.PLAYER_SLOW_RESPONSE);
            }
            // Don't update when skipping
            if (!this.isSkipping) {
                this.buttonDowntime = this.videoElement.currentTime;
                this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
            }
        }.bind(this);

        /*
         * Handler for the media 'error' event
         */
        this.errorHandler = function(e) {
            this.clearTimeouts();
            if (this.knownPlayerErrorTriggered) {
                return;
            }
            var errType;
            if (e.target.error && e.target.error.code) {
                switch (e.target.error.code) {
                    //A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.
                    case e.target.error.MEDIA_ERR_NETWORK:
                        errType = ErrorTypes.NETWORK_ERROR;
                        this.knownPlayerErrorTriggered = true;
                        break;
                    //An error of some description occurred while decoding the media resource, after the resource was established to be usable.
                    case e.target.error.MEDIA_ERR_DECODE:
                        errType = ErrorTypes.CONTENT_DECODE_ERROR;
                        this.knownPlayerErrorTriggered = true;
                        break;
                    //The media resource indicated by the src attribute was not suitable.
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errType = ErrorTypes.CONTENT_SRC_ERROR;
                        this.knownPlayerErrorTriggered = true;
                        break;
                    default:
                        errType = ErrorTypes.UNKNOWN_ERROR;
                        break;
                }
            } else {
                // no error code, default to unknown type
                errType = ErrorTypes.UNKNOWN_ERROR;
            }
            this.trigger('error', errType, errorHandler.genStack(), arguments);
        }.bind(this);

        /**
         * Remove the video element from the app
         */
        this.remove = function() {
            this.videoElement.removeEventListener("error", this.errorHandler);
            this.clearTimeouts();
            this.videoElement.pause();
            this.videoElement.src = "";
            buttons.resetButtonIntervals();
            this.controlsView.remove();
            this.$el.remove();
        };

        /**
         * Clear timeouts
         */
        this.clearTimeouts = function() {
            if (this.playerTimeout) {
                clearTimeout(this.playerTimeout);
                this.playerTimeout = 0;
            }
            if (this.playerSlowResponse) {
                clearTimeout(this.playerSlowResponse);
                this.playerSlowResponse = 0;
            }
        };

        /**
         * Hides the video
         */
        this.hide = function() {
            this.$el.css("visibility", "hidden");
        };

        /**
         * Show the video
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
            this.items = data;
            var video_data = data[index];
            this.currentIndex = index;
            var html = utils.buildTemplate($("#player-view-template"), video_data);
            $container.append(html);
            this.$el = $container.children().last();

            this.$containerControls = $container.find(".player-controls-container");
            this.containerControls = this.$containerControls[0];

            // create the video element
            this.videoElement = document.createElement('video');
            this.videoElement.className = 'player-content-video';
            this.videoElement.src = video_data.videoURL;
            this.videoElement.type = 'video/mp4';
            this.handleClosedCaptioning(video_data.tracks);
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
            if (video_data.type === "video-live") {
                this.isLive = true;
                this.controlsView = new LiveControlsView();
                this.controlsView.render(this.$el, video_data, this); 
            }
            else {
                this.controlsView = new ControlsView();
                this.controlsView.render(this.$el, video_data, this); 
            }

            this.videoElement.addEventListener('durationchange', this.durationChangeHandler);
            this.knownPlayerErrorTriggered = false;
        };

        /**
         *  Start the video playing
         */
        this.playVideo = function() {
            this.videoElement.play();
            this.paused = false;
            buttons.setButtonIntervals(this.BUTTON_INTERVALS);
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        };

        /**
         *  Pause the currently playing video
         */
        this.pauseVideo = function() {
            // this no longer directly sends a video status event, as the pause can come from Fire OS and not just
            // user input, so this strictly calls the video element pause
            if (!this.isSkipping) {
                this.videoElement.pause();
                this.paused = true;
            }
        };

        /**
         * Resume the currently playing video
         */
        this.resumeVideo = function() {
            this.videoElement.play();
            this.paused = false;
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'resumed');
        };

        /**
         * Navigate to a position in the video
         */
        this.seekVideo = function(position) {
            this.controlsView.continuousSeek = false;
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
            this.videoElement.currentTime = position;
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'seeking');
        };

        /**
         * Navigate to a position in the video, used when holding down the buttons
         * @param {number} the seek direction, positive for forward, negative for reverse
         */
        this.seekVideoRepeat = function(direction) {
            this.controlsView.continuousSeek = true;
            var newPosition = null;
            if (direction > 0) {
                // fast forward
                if (this.buttonDowntime < this.videoElement.duration) {
                    // if we hit near the end of the video decellerate
                    if (this.buttonDowntime > this.videoElement.duration - (this.videoElement.duration * this.DECELLERATION_PERCENTAGE_MOMENT)) {
                        buttons.setButtonIntervals(this.DECELLERATION_BUTTON_INTERVALS);
                    }
                    else {
                        buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                    }
                    newPosition = this.buttonDowntime + (this.videoElement.duration * this.FAST_SEEK_JUMP_AMOUNT);
                } 
                // end of the video just stop seeking
                else {
                    newPosition = this.videoElement.duration;
                }
            
            }
            // reverse
            else {
                // reset button intervals incase they were decellerating 
                buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                if (this.buttonDowntime > this.skipLength) {
                   newPosition = this.buttonDowntime - (this.videoElement.duration * this.FAST_SEEK_JUMP_AMOUNT);
                } else {
                   newPosition = 0;
                }
            }

            this.trigger('videoStatus', this.buttonDowntime, this.videoElement.duration, 'playing');
            //Move the indicator while pressing down the skip buttons by updating buttonDownTime
            this.buttonDowntime = newPosition;
            this.trigger('videoStatus', this.buttonDowntime, this.videoElement.duration, 'seeking');
        };

        /**
         * Handle button events, connected to video API for a few operations
         */
        this.handleControls = function(e) {
            if (e.type === 'buttonpress') {
                this.isSkipping = false;
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
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.LEFT:
                    case buttons.REWIND:
                        this.isSkipping = true;
                        if (!this.isLive) {
                            this.seekVideoRepeat(-1);
                        }
                        break;

                    case buttons.RIGHT:
                    case buttons.FAST_FORWARD:
                        this.isSkipping = true;
                        if (!this.isLive) {
                            this.seekVideoRepeat(1);
                        }
                        break;
                }

            } else if (this.isSkipping && e.type === 'buttonrelease') {
                //perform the final seek
                this.trigger('videoStatus', this.buttonDowntime, this.videoElement.duration, 'playing');
                this.videoElement.currentTime = this.buttonDowntime;
                this.trigger('videoStatus', this.buttonDowntime, this.videoElement.duration, 'seeking');
                this.isSkipping = false;
            }

        }.bind(this);

        /**
         * If closed caption tracks are available, display options to enable and select them
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
