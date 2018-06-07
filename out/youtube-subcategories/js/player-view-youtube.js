/* YouTube Player View
 *
 * Handles the media playback of YouTube videos
 *
 */

(function (exports) {
    "use strict";

    var youTubePlayerReady = false;

    /**
     * @class YouTubePlayerView
     * @description Handles the media playback of YouTube videos
     */
    function YouTubePlayerView(settings) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'videoStatus', 'indexChange', 'error']);

        //jquery variables
        this.$el = null;
        this.$currSeekTime = null;

        //class variables
        this.canplay = null;
        this.controlsView = null;
        this.durationFound = false;
        this.statusInterval = null;
        this.currentState = null;
        this.buttonDownTime = 0;
        this.isSkipping = false;
        this.knownPlayerErrorTriggered = false;
        this.previousTime = null;
        this.items = null;
        this.currentIndex = null;

        this.SKIP_LENGTH_DEFAULT = 30;
        this.PLAYER_TIMEOUT = 60000;
        this.PLAYER_SLOW_RESPONSE = 30000;
        this.BUTTON_INTERVALS = [100, 200, 300, 400, 500];
        // the button intervals for when slowing fast forward near the end of the video
        this.DECELLERATION_BUTTON_INTERVALS = [500, 400, 300, 200, 100];
        // the fast forward/reverse individual jump percentage higher is faster
        this.FAST_SEEK_JUMP_AMOUNT = 0.03;
        // the percentage left in the video when slowing fast forward begins
        this.DECELLERATION_PERCENTAGE_MOMENT = 0.3;
        // the final point you can't skip past so that the user doesn't accidently skip to the next video
        this.FINAL_SKIP_POINT = 2;

        //set skip length
        this.skipLength = settings.skipLength || this.SKIP_LENGTH_DEFAULT;

        /**
         * Handler for video 'canplay' event
         */
        this.readyHandler = function() {
            this.canplay = true;
            this.previousTime = this.player.getCurrentTime();
            this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'canplay');
        }.bind(this);

        /**
         * Handler for state changes
         */
        this.stateChangeHandler = function(currentState) {
            switch(currentState.data) {
                case YT.PlayerState.PLAYING:
                    this.currentState = currentState.data;
                    if (!this.isSkipping){
                        this.buttonDownTime = this.player.getCurrentTime();
                        this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'playing');
                    }
                    break;
                case YT.PlayerState.ENDED:
                    this.currentState = currentState.data;
                    this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'ended');
                    break;
                case YT.PlayerState.PAUSED:
                    this.currentState = currentState.data;
                    this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'paused');
                    break;
            }
        }.bind(this);

        /**
         * Update status as video is playing
         */
        this.statusUpdater = function() {
            //if player's current time is updating, clear and reset the timeouts
            if (this.player.getCurrentTime && this.previousTime !== this.player.getCurrentTime()) {
                this.previousTime = this.player.getCurrentTime();
                this.clearTimeouts();
                if (this.currentState !== YT.PlayerState.PAUSED) {
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
            }
            if (this.currentState === YT.PlayerState.PLAYING) {
                var timeDiff = this.buttonDownTime - this.player.getCurrentTime();
                //Won't update when video is skipping
                if (timeDiff < this.skipLength && timeDiff > -this.skipLength) {
                    // dont send a real event while skipping to update controls bar in the wrong way
                    if (!this.isSkipping) {
                        this.buttonDownTime = this.player.getCurrentTime();
                        this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'playing');
                    }
                }
            }
        }.bind(this);

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
         * Remove the video element from the app
         */
        this.remove = function () {
            buttons.buttonIntervals = buttons.BUTTON_INTERVALS;
            this.controlsView.remove();
            this.$el.remove();
            clearInterval(this.statusInterval);
            this.clearTimeouts();
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
            if (this.player.getDuration() > 0) {
                this.controlsView.showAndHideControls();
            }
         };

        this.updateTitleAndDescription = function(title, description) {
            if(this.controlsView) {
                this.controlsView.updateTitleAndDescription(title, description);
            }
        }.bind(this);
        
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

            this.$el.append("<div id='player'></div>"); // youtube API replaces this element with the player
            
            this.player = new YT.Player(this.$el.children('#player')[0], {
                height: '1080',
                width: '1920',
                videoId: video_data.videoURL,
                playerVars: {
                    enablejsapi: 1,
                    fs: 0, // disable fullscreen button
                    showinfo: 0,
                    vq: "hd1080",
                    controls: '0'
                },
                events: {
                    'onReady': this.readyHandler,
                    'onStateChange': this.stateChangeHandler,
                    'onError': this.errorHandler
                }
            });

            this.statusInterval = setInterval(this.statusUpdater, 1000);
            // create controls
            this.controlsView = new ControlsView();
            this.controlsView.render(this.$el, video_data, this);

            this.knownPlayerErrorTriggered = false;

        };

        this.errorHandler = function(errorType) {
            this.clearTimeouts();
            clearInterval(this.statusInterval);
            //prevent triggering error twice
            if (this.knownPlayerErrorTriggered === true) {
                return;
            }
            var errType = null;
            switch (errorType.data) {
                case 2:
                    //The request contains an invalid parameter value
                    errType = ErrorTypes.CONTENT_SRC_ERROR;
                    this.knownPlayerErrorTriggered = true;
                    break;
                case 100:
                    //The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred
                    errType = ErrorTypes.VIDEO_NOT_FOUND;
                    this.knownPlayerErrorTriggered = true;
                    break;
                case 5:
                    //The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private
                    errType = ErrorTypes.HTML5_PLAYER_ERROR;
                    this.knownPlayerErrorTriggered = true;
                    break;
                case 101:
                case 150:
                    //The owner of the requested video does not allow it to be played in embedded players
                    errType = ErrorTypes.EMBEDDED_PLAYER_ERROR;
                    this.knownPlayerErrorTriggered = true;
                    break;
                default:
                    errType = 'unknown';
            }
            this.trigger("error", errType, errorHandler.genStack());
        }.bind(this);

        this.durationChangeHandler = function() {
            if (this.videoElement.duration && this.videoElement.duration > 0) {
                this.durationFound = true;
            }
        }.bind(this);

        /**
         * Start the video playing
         */
        this.playVideo = function() {
            if (this.player && this.player.playVideo) {
                this.player.playVideo();
                buttons.buttonIntervals = this.BUTTON_INTERVALS;
            }
        };

        /**
         * Pause the currently playing video
         */
        this.pauseVideo = function () {
            if (this.player && this.player.pauseVideo && !this.isSkipping) {
                this.player.pauseVideo();
                this.clearTimeouts();
            }
        };

        /**
         * Resume the currently playing video
         */
        this.resumeVideo = function() {
            if (this.player && this.player.playVideo) {
                this.player.playVideo();
                this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'resumed');
            }
        };

        /** 
         * Controls currently showing status indicator
         */
        this.controlsCurrentlyShowing = function() {
            return this.controlsView.controlsShowing();
        }.bind(this);

        /**
         * Navigate to a position in the video
         */
        this.seekVideo = function(change) {
            this.controlsView.continuousSeek = false;
            this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'playing');
            this.buttonDownTime = this.buttonDownTime + change;
            if (this.buttonDownTime <= 0) {
                this.buttonDownTime = 0;
            }
            else if (this.buttonDownTime >= this.player.getDuration()) {
                this.buttonDownTime = this.player.getDuration() - this.FINAL_SKIP_POINT;
            }
            this.player.seekTo(this.buttonDownTime, true);
            this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'seeking');
        };

        /**
         * Navigate to a position in the video, used when skipping continuously
         * @param {number} the seek direction, positive for forward, negative for reverse
         */
        this.seekVideoRepeat = function(direction) {
            this.controlsView.continuousSeek = true;
            var newPosition = null;
            if (direction > 0) {
                if (this.buttonDownTime < this.player.getDuration()) {
                    if (this.buttonDownTime > this.player.getDuration() - (this.player.getDuration() * this.DECELLERATION_PERCENTAGE_MOMENT)) {
                        buttons.setButtonIntervals(this.DECELLERATION_BUTTON_INTERVALS);
                        this.currButtonSpeed = this.DECELLERATION_BUTTON_INTERVALS; 
                    }
                    else {
                        buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                        this.currButtonSpeed = this.BUTTON_INTERVALS;  
                    }
                    newPosition = this.buttonDownTime + (this.player.getDuration() * this.FAST_SEEK_JUMP_AMOUNT);
                } else {
                    newPosition = this.player.getDuration();
                }
            
            }
            else {
                if (this.currButtonSpeed !== this.BUTTON_INTERVALS) {
                    buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                    this.currButtonSpeed = this.BUTTON_INTERVALS;  
                }
                if (this.buttonDownTime > this.skipLength) {
                   newPosition = this.buttonDownTime - (this.player.getDuration() * this.FAST_SEEK_JUMP_AMOUNT);
                } else {
                   newPosition = 0;
                }
            }

            this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'playing');
            //Move the indicator while pressing down the skip buttons by updating buttonDownTime
            this.buttonDownTime = newPosition;
            this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'seeking');
        };

        this.timeUpdateHandler = function() {
            // dont send a real event while skipping to update controls bar in the wrong way
            if (!this.isSkipping) {
                this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
            }
        }.bind(this);

        /**
         * Handle button events, connected to video API for a few operations
         */
        this.handleControls = function (e) {
            if (e.type === 'buttonpress') {
                this.isSkipping = false;
                switch (e.keyCode) {
                    case buttons.SELECT:
                    case buttons.PLAY_PAUSE: 
                        switch (this.currentState) {
                            case YT.PlayerState.PLAYING:
                                this.pauseVideo();
                                break;

                            case YT.PlayerState.PAUSED:
                                this.resumeVideo();
                                break;
                        }
                        break;
                    case buttons.BACK:
                        this.trigger('exit');
                        break;
                    case buttons.LEFT:
                    case buttons.REWIND:
                        this.seekVideo(-this.skipLength);
                        break;

                    case buttons.RIGHT:
                    case buttons.FAST_FORWARD:
                        this.seekVideo(this.skipLength);
                        break;
                    case buttons.UP:
                        this.controlsView.showAndHideControls();
                        break;
                    case buttons.DOWN:
                        if (this.currentState !== YT.PlayerState.PAUSED) {
                            this.controlsView.hide();
                        }
                        break;
                }
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.LEFT:
                    case buttons.REWIND:
                        this.isSkipping = true;
                        this.seekVideoRepeat(-1);
                        break;

                    case buttons.RIGHT:
                    case buttons.FAST_FORWARD:
                        this.isSkipping = true;
                        this.seekVideoRepeat(1);
                        break;
                }
            } else if (this.isSkipping && e.type === 'buttonrelease') {
                    //perform the final seek
                    this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'playing');
                    this.player.seekTo(this.buttonDownTime, true);
                    this.trigger('videoStatus', this.buttonDownTime, this.player.getDuration(), 'seeking');
                    this.isSkipping = false;
                    this.controlsView.continuousSeek = false;
            }

        }.bind(this);
    }

    exports.YouTubePlayerView = YouTubePlayerView;
}(window));
