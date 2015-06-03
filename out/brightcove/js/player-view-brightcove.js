/* Brightcove Player View
 *
 * Handles the media playback of Brightcove videos
 *
 */

(function(exports) {
    "use strict";

    /**
     * @class BrightcovePlayerView
     * @description Handles the media playback of Brightcove videos
     */
    function BrightcovePlayerView(settings) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'videoStatus', 'videoError', 'indexChange', 'error']);

        //jquery variables
        this.$el = null;
        this.$currSeekTime = null;

        //class variables
        this.currentVideo = null;
        this.canplay = null;
        this.controlsView = null;
        this.durationFound = false;
        this.fullscreenOpen = false;
        this.playerHTML = null;
        this.brightcovePlayer = null;
        this.isAdPlaying = false;
        this.knownPlayerErrorTriggered = false;
        this.playerTimeout = null;
        this.playerSlowResponse = null;
        this.items = null;
        this.currentIndex = null;
        this.scriptLoaded = false;

        this.buttonDowntime = null;
        this.isSkipping = false;
        this.isFF = false;
        this.isRW = false;
        
        //constants
        this.PLAYER_TIMEOUT = 30000;
        this.PLAYER_SLOW_RESPONSE = 15000;
        this.SCRIPT_TIMEOUT = 25000;
        this.SKIP_LENGTH_DEFAULT = 5;
        this.BUTTON_INTERVALS = [100, 200, 300, 400, 500];
        // the button intervals for when slowing fast forward near the end of the video
        this.DECELLERATION_BUTTON_INTERVALS = [500, 400, 300, 200, 100];
        // the fast forward/reverse individual jump percentage higher is faster
        this.FAST_SEEK_JUMP_AMOUNT = 0.03;
        // the percentage left in the video when slowing fast forward begins
        this.DECELLERATION_PERCENTAGE_MOMENT = 0.3;
        this.currButtonSpeed = null;

        //set skip length
        this.skipLength = settings.skipLength || this.SKIP_LENGTH_DEFAULT;

        //data-embed is an attribute defined in the video element. Used to display information if you are using embeds (parent-child player relationships)
        this.DATA_EMBED = 'default';

        /**
         * @function hasValidTimeAndDuration
         * @description function that checks if the brightcove player has valid duration and current time
         * @return {Boolean}
         */
        this.hasValidTimeAndDuration = function() {
            return this.brightcovePlayer && this.brightcovePlayer.duration && this.brightcovePlayer.currentTime;
        };

        /**
         * @function registerAdTimeUpdateHandler
         * @description function that registers the ad timeupdate handler
         */
        this.registerAdTimeUpdateAndDurationChangeHandler = function() {
            if (this.brightcovePlayer.ima3.adPlayer) {
                this.brightcovePlayer.ima3.adPlayer.on('timeupdate', this.timeUpdateHandler);
                this.brightcovePlayer.ima3.adPlayer.on('durationchange', this.durationChangeHandler);
                this.brightcovePlayer.ima3.adPlayer.on('pause', this.pauseEventHandler);
            } else {
                setTimeout(this.registerAdTimeUpdateAndDurationChangeHandler, 250);
            }
        }.bind(this);

        /**
         * @function registerAdPlayerEvents
         * @description function that registers events corresponding to ad playback 
         */
        this.registerAdPlayerEvents = function() {

            this.registerAdTimeUpdateAndDurationChangeHandler();

            this.brightcovePlayer.on('ima3error', function() {
                this.isAdPlaying = false;
                this.updateTitleAndDescription(this.currentVideo.title, this.currentVideo.description);
            }.bind(this));

            this.brightcovePlayer.on('ima3-ad-error', function() {
                this.isAdPlaying = false;
                this.updateTitleAndDescription(this.currentVideo.title, this.currentVideo.description);
            }.bind(this));

            this.brightcovePlayer.on("adstart", function() {
                this.isAdPlaying = true;
                this.updateTitleAndDescription("Advertisement", "Your video will resume shortly.");
            }.bind(this));

            this.brightcovePlayer.on("adend", function() {
                this.isAdPlaying = false;
                this.clearTimeouts();
                this.setTimeouts();
                this.updateTitleAndDescription(this.currentVideo.title, this.currentVideo.description);
            }.bind(this));

        }.bind(this);

        /**
         * @function canPlayHandler
         * @description handler for video 'canplay' event
         */
        this.canPlayHandler = function() {
            this.canplay = true;
            if (this.hasValidTimeAndDuration()) {
                this.buttonDowntime = this.brightcovePlayer.currentTime();
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'canplay');
            }
        }.bind(this);

        /**
         * @function pauseEventHandler
         * @description Handles video element pause event
         */
        this.pauseEventHandler = function() {
            // we trigger the video status in the pause event handler because the pause event can come from the system
            // specifically it can be caused by the voice search functionality of Fire OS

            /* We don't want to show the pause icon for the following cases
             * - when an ad starts and the brightcove player is paused
             * - when a video ends and the brightcove player is paused
             */
            if (this.brightcovePlayer.currentTime() !== 0 && this.brightcovePlayer.currentTime() !== this.brightcovePlayer.duration()) {
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'paused');
                this.clearTimeouts();
            }

        }.bind(this);

        this.playEventHandler = function() {
            this.clearTimeouts();
            this.setTimeouts();
        }.bind(this);

        this.setTimeouts = function() {
            this.playerTimeout = setTimeout(function() {
                            if (!this.knownPlayerErrorTriggered) {
                                this.trigger('error', ErrorTypes.TIMEOUT_ERROR, errorHandler.genStack());
                            }
                            this.knownPlayerErrorTriggered = true;
                        }.bind(this), this.PLAYER_TIMEOUT);
            this.playerSlowResponse = setTimeout(function() {
                            this.trigger('error', ErrorTypes.SLOW_RESPONSE, errorHandler.genStack());
                        }.bind(this), this.PLAYER_SLOW_RESPONSE);
        }.bind(this);

        this.setScriptTimeout = function() {
            setTimeout(function() {
                        if (!this.scriptLoaded && !this.knownPlayerErrorTriggered) {
                            this.knownPlayerErrorTriggered = true;
                            this.trigger('error', ErrorTypes.PLAYER_ERROR, errorHandler.genStack());
                        } 
            }.bind(this), this.SCRIPT_TIMEOUT);
        }.bind(this);

        /**
         * @function videoEndedHandler
         * @description handler for video 'ended' event
         */
        this.videoEndedHandler = function() {
            if (this.hasValidTimeAndDuration()) {
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'ended');
            }
        }.bind(this);

        /*
         * @function controlsCurrentlyShowing
         * @description check if controls are currently showing status indicator
         * @return {Boolean}
         */
        this.controlsCurrentlyShowing = function() {
            return this.controlsView.controlsShowing();
        }.bind(this);

        /*
         * @function durationChangeHandler
         * @description handler for the 'durationchange' event
         */
        this.durationChangeHandler = function() {
            if (this.hasValidTimeAndDuration() && this.brightcovePlayer.duration() > 0) {
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'durationChange');
                this.durationFound = true;
            }
        }.bind(this);

        /*
         * @function timeUpdateHandler
         * @description handler for the 'timeupdate' event
         */
        this.timeUpdateHandler = function() {
            if (this.previousTime !== this.brightcovePlayer.currentTime()) {
                this.previousTime = this.brightcovePlayer.currentTime();
                this.clearTimeouts();
                if (!this.knownPlayerErrorTriggered) {
                    this.setTimeouts();
                }
            }

            if (this.hasValidTimeAndDuration()  && !this.isSkipping) {
                this.buttonDowntime = this.brightcovePlayer.currentTime();
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'playing');
            }
        }.bind(this);

        /*
         * @function errorHandler
         * @description Handler for the media 'error' event
         * @param {Event} e the error event
         */
        this.errorHandler = function(e) {
            this.clearTimeouts();
            if (this.knownPlayerErrorTriggered) {
                return;
            }
            var errType;
            var error = this.brightcovePlayer.error();
            if (error) {
                switch (error.message) {
                    //A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.
                    case "MEDIA_ERR_NETWORK" :
                        errType = ErrorTypes.NETWORK_ERROR;
                        this.knownPlayerErrorTriggered = true;
                        break;
                    //An error of some description occurred while decoding the media resource, after the resource was established to be usable.
                    case "MEDIA_ERR_DECODE" :
                        errType = ErrorTypes.CONTENT_DECODE_ERROR;
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
            this.trigger('error', errType, errorHandler.genStack());
        }.bind(this);

        /**
         * @function remove
         * @description remove the brightcove player from the app
         */
        this.remove = function() {
            this.clearTimeouts();
            buttons.resetButtonIntervals();
            this.brightcovePlayer.dispose();
            this.$el.remove();
        };

        /**
         * @function clearTimeouts
         * @description clear timeouts
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
         * @function hide
         * @description hide the video
         */
        this.hide = function() {
            this.$el.css("visibility", "hidden");
        };

        /**
         * @function show
         * @description show the video
         */
        this.show = function() {
            this.$el.css("visibility", "");
            if (this.durationFound) {
                this.controlsView.showAndHideControls();
            }
        };

        /**
         * Update title and description of the video
         * @param {string} title to set
         * @param {string} description to set
         */
        this.updateTitleAndDescription = function(title, description) {
            if (this.controlsView) {
                this.controlsView.updateTitleAndDescription(title, description);
            }
        }.bind(this);

        /**
         * @function adPlaying
         * @description function that returns true if ad is playing
         * @return {Boolean}
         */
        this.adPlaying = function() {
            return this.isAdPlaying;
        }.bind(this);

        /**
         * @function render
         * @description creates the main content view from the template and appends it to the given element
         * @param {Object} $container the app container
         * @param {Object} data the complete data
         * @param {Object} index the index corresponding to the data to be rendered
         */
        this.render = function($container, data, index) {
            // Build the main content template and add it
            this.items = data;
            var video_data = data[index];
            this.currentVideo = video_data;
            this.currentIndex = index;
            var html = utils.buildTemplate($("#player-view-template"), video_data);
            $container.append(html);
            this.$el = $container.children().last();

            this.$containerControls = $container.find(".player-controls-container");
            this.containerControls = this.$containerControls[0];

            // dynamically build the player video element
            this.playerHTML = '<video id="' + video_data.id + '" data-account="' + settings.accountID +
                '" data-player="' + settings.playerID + '" data-embed="' + this.DATA_EMBED +
                '" data-video-id="' + video_data.id + '" class="video-js player-content-video"></video>';

            this.$el.append(this.playerHTML);

            this.scriptLoaded = false;

            var tag = document.createElement('script');
            this.$el.append(tag);
            tag.onload = function() {
                videojs(video_data.id.toString()).ready(function() {

                    this.scriptLoaded = true;

                    this.clearTimeouts();

                    this.brightcovePlayer = videojs(video_data.id.toString());

                    //Disable default controls
                    this.brightcovePlayer.controls(false);
                    $(".vjs-control-bar").css("display", "none");
                    $(".vjs-ad-control-bar").css("display", "none");

                    //Disable big play button
                    $(".vjs-big-play-button").css("display", "none");

                    //Disable spinner
                    $(".vjs-loading-spinner").css("display", "none");

                    //Disable error dialogs
                    $(".video-js .vjs-error-display").css("display", "none");


                    this.canPlayHandler();
                    this.brightcovePlayer.on("ended", this.videoEndedHandler);
                    this.brightcovePlayer.on("timeupdate", this.timeUpdateHandler);
                    this.brightcovePlayer.on("error", this.errorHandler);
                    this.brightcovePlayer.on("durationchange", this.durationChangeHandler);
                    this.brightcovePlayer.on("pause", this.pauseEventHandler);
                    this.brightcovePlayer.on("play", this.playEventHandler);

                    this.registerAdPlayerEvents();

                }.bind(this));
            }.bind(this);
            tag.type = "text/javascript";
            tag.src = "http://players.brightcove.net/" + settings.accountID + "/" + settings.playerID +
                "_" + this.DATA_EMBED + "/index.js";
            this.setScriptTimeout();

            this.controlsView = new ControlsView();
            this.controlsView.render(this.$el, video_data, this);
            this.setTimeouts();
            this.knownPlayerErrorTriggered = false;

        }.bind(this);

        /**
         * @function pauseAd
         * @description pause the currently playing ad, called when app loses focus
         */
        this.pauseAd = function() {
            if (this.brightcovePlayer.ima3.adPlayer) {
                this.brightcovePlayer.ima3.adPlayer.pause();
            }
        }.bind(this);

        /**
         * @function resumeAd
         * @description resume the currently playing ad, called when app regains focus
         */
        this.resumeAd = function() {
            if (this.brightcovePlayer.ima3.adPlayer) {
                this.brightcovePlayer.ima3.adPlayer.play();
                if (this.hasValidTimeAndDuration()) {
                    this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                        'resumed');
                }
            }
        }.bind(this);

        /**
         * @function playVideo
         * @description start the video playing
         */
        this.playVideo = function() {
            if (this.brightcovePlayer) {
                this.brightcovePlayer.play();
                if (this.hasValidTimeAndDuration()) {
                    this.buttonDowntime = this.brightcovePlayer.currentTime();
                    buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                    this.currButtonSpeed = this.BUTTON_INTERVALS;                    
                    this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                        'playing');
                }
            }
        }.bind(this);

        /**
         * @function pauseVideo
         * @description pause the currently playing video, called when app loses focus
         */
        this.pauseVideo = function() {
            if (this.brightcovePlayer) {
                this.brightcovePlayer.pause();
            }
        }.bind(this);

        /**
         * @function resumeVideo
         * @description resume the currently playing video, called when app regains focus
         */
        this.resumeVideo = function() {
            if (this.brightcovePlayer) {
                this.brightcovePlayer.play();
                if (this.hasValidTimeAndDuration()) {
                    this.buttonDowntime = this.brightcovePlayer.currentTime();
                    this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                        'resumed');
                }
            }
        }.bind(this);

        /**
         * @function seekVideo
         * @description navigate to a position in the video
         * @param {Number} position the timestamp
         */
        this.seekVideo = function(position) {
            if (this.hasValidTimeAndDuration()) {
                this.controlsView.continuousSeek = false;
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'playing');
                this.brightcovePlayer.currentTime(position);
                this.trigger('videoStatus', this.brightcovePlayer.currentTime(), this.brightcovePlayer.duration(),
                    'seeking');
            }
        };

        /**
         * @function handlePlayPauseButton
         * @description handle play/pasuse/select button events
         */
        this.handlePlayPauseButton = function() {
            if (!this.isSkipping) {
                if (this.isAdPlaying && this.brightcovePlayer.ima3.adPlayer) {
                    if (this.brightcovePlayer.ima3.adPlayer.paused()) {
                        this.resumeAd();
                    } else {
                        this.pauseAd();
                    }
                } else if (!this.isAdPlaying && this.brightcovePlayer) {
                    if (this.brightcovePlayer.paused()) {
                        this.resumeVideo();
                    } else {
                        this.pauseVideo();
                    }
                }
            }
        }.bind(this);

        /**
         * Navigate to a position in the video, used when holding down the buttons
         * @param {number} direction the seek direction, positive for forward, negative for reverse
         */
        this.seekVideoRepeat = function(direction) {
            this.controlsView.continuousSeek = true;
            var newPosition = null;
            if (direction > 0) {
                if (this.buttonDowntime < this.brightcovePlayer.duration()) {
                    if (this.buttonDowntime > this.brightcovePlayer.duration() - (this.brightcovePlayer.duration() * this.DECELLERATION_PERCENTAGE_MOMENT)) {
                        buttons.setButtonIntervals(this.DECELLERATION_BUTTON_INTERVALS);
                        this.currButtonSpeed = this.DECELLERATION_BUTTON_INTERVALS;  
                    }
                    else {
                        buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                        this.currButtonSpeed = this.BUTTON_INTERVALS;  
                    }
                    newPosition = this.buttonDowntime + (this.brightcovePlayer.duration() * this.FAST_SEEK_JUMP_AMOUNT);
                } else {
                    newPosition = this.brightcovePlayer.duration();
                }
            
            }
            else {
                if (this.currButtonSpeed !== this.BUTTON_INTERVALS) {
                    buttons.setButtonIntervals(this.BUTTON_INTERVALS);
                    this.currButtonSpeed = this.BUTTON_INTERVALS;  
                }
                if (this.buttonDowntime > this.skipLength) {
                   newPosition = this.buttonDowntime - (this.brightcovePlayer.duration() * this.FAST_SEEK_JUMP_AMOUNT);
                } else {
                   newPosition = 0;
                }
            }

            this.trigger('videoStatus', this.buttonDowntime, this.brightcovePlayer.duration(), 'playing');
            //Move the indicator while pressing down the skip buttons by updating buttonDownTime
            this.buttonDowntime = newPosition;
            this.trigger('videoStatus', this.buttonDowntime, this.brightcovePlayer.duration(), 'seeking');
        };

        /**
         * @function seekVideoFinal
         * @description Navigate to a position in the video, used when button released after continuous seek
         */
        this.seekVideoFinal = function() {
            if (this.isFF) {
                this.buttonDowntime =  this.buttonDowntime !== this.brightcovePlayer.duration() ? this.buttonDowntime - this.skipLength : this.buttonDowntime;
                this.isFF = false;
            } else if (this.isRW) {
                this.buttonDowntime = this.buttonDowntime !== 0 ? this.buttonDowntime + this.skipLength : 0 ;
                this.isRW = false;
            }
            this.trigger('videoStatus', this.buttonDowntime, this.brightcovePlayer.duration(), 'playing');
            this.brightcovePlayer.currentTime(this.buttonDowntime);
            this.trigger('videoStatus', this.buttonDowntime, this.brightcovePlayer.duration(), 'seeking');
            this.isSkipping = false;
        };

        /**
         * @function handleControls
         * @description Handle button events, connected to video API for a few operations
         * @param {Event} e
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
                        // Disable seeking during Ad playback
                        if (!this.isAdPlaying && this.hasValidTimeAndDuration()) {
                          this.seekVideo(this.brightcovePlayer.currentTime() - this.skipLength);
                        }
                        break;

                    case buttons.RIGHT:
                    case buttons.FAST_FORWARD:
                        // Disable seeking during Ad playback
                        if (!this.isAdPlaying && this.hasValidTimeAndDuration()) {
                           this.seekVideo(this.brightcovePlayer.currentTime() + this.skipLength);
                        }
                        break;

                    case buttons.SELECT:
                    case buttons.PLAY_PAUSE:
                        this.handlePlayPauseButton();
                        break;
                    case buttons.UP:
                        this.controlsView.showAndHideControls();
                        break;
                    case buttons.DOWN:
                        if (this.brightcovePlayer && !this.brightcovePlayer.paused()) {
                            this.controlsView.hide();
                        }
                        break;
                }
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.LEFT:
                    case buttons.REWIND:
                        this.isSkipping = true;
                        this.isRW = true;
                        if (!this.isAdPlaying) {
                            this.seekVideoRepeat(-1);
                        }
                        break;

                    case buttons.RIGHT:
                    case buttons.FAST_FORWARD:
                        this.isSkipping = true;
                        this.isFF = true;
                        if (!this.isAdPlaying) {
                            this.seekVideoRepeat(1);
                        }
                        break;
                }
            } else if (this.isSkipping && e.type === 'buttonrelease') {
                if (!this.isAdPlaying) {
                    this.seekVideoFinal();
                }
            }
        }.bind(this);

    };

    exports.BrightcovePlayerView = BrightcovePlayerView;
}(window));
