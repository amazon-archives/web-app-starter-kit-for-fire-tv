/* PlaylistPlayerView
 *
 * Handles playing videos continulously from a playlist
 */

(function (exports) {
    "use strict";

    /**
     * @class PlaylistPlayerView
     * @description Handles playing videos continulously from a playlist
     */
    function PlaylistPlayerView(settings) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'videoStatus', 'indexChange', 'error']);

        this.currentPlayerView = null;
        this.preloadedPlayerView = null;
        this.currentIndex = null;
        this.nextIndex = null;
        this.items = null;
        this.$el = null;
        this.settings = settings;
        this.currentView = null;
        this.PlayerView = settings.PlayerView;
        this.previewDismissed = false;
        this.$previewEl = null;
        this.$countdown_text = null;
        this.previewTime = settings.previewTime;
        this.timeTillPlay = null;
        this.preloadedPlayerViewError = null;


        this.PREVIEW_TIME_DEFAULT = 10;

        /**
         * @function remove
         * @description function to remove current player view and the preloaded player view
         */
        this.remove = function () {
            if (this.currentPlayerView) {
                this.currentPlayerView.remove();
            }
            if (this.preloadedPlayerView) {
                this.preloadedPlayerView.remove();
            }
        };

        /**
         * @function render
         * @description initial function to setup and start the playlist of media
         * @param {Object} $el the app container
         * @param {Object} items the complete data
         * @param {Object} startIndex the index corresponding to the data to be rendered
         */
        this.render = function($el, items, startIndex) {
            if (!this.previewTime) {
                this.previewTime = this.PREVIEW_TIME_DEFAULT;
            }
            this.$el = $el;
            this.currentPlayerView = new this.PlayerView(this.settings);
            this.currentPlayerView.render($el, items, startIndex);

            this.currentPlayerView.on('exit', this.exit, this);

            this.currentIndex = startIndex;
            this.items = items;

            this.currentPlayerView.on('videoStatus', this.handleVideoStatus, this);
            this.currentPlayerView.on('error', this.errorHandlerCurrent, this);
            this.currentView = this.currentPlayerView;

            //touch events
            touches.registerTouchHandler("player-content-video", this.handleTouchPlayer);
            touches.registerTouchHandler("player-controls-container", this.handleTouchPlayer);
            touches.registerTouchHandler("player-back-button", this.handleTouchPlayer);
            touches.registerTouchHandler("player-pause-indicator", this.handleTouchPlayer);

            this.setUpNextPlayer();
        };

        /**
         * @function errorHandlerCurrent
         * @description handle video errors from player view
         * @param {Object} errType type of the error
         * @param {String} errStack stack trace of the error
         */
        this.errorHandlerCurrent = function(errType, errStack) {
            this.trigger('error', errType, errStack);
        };

        /**
         * @function errorHandlerPreview
         * @description handle video errors from preloaded player view
         * @param {Object} errType type of the error
         * @param {String} errStack stack trace of the error
         */
        this.errorHandlerPreview = function(errType, errStack) {
            //different error handler for current and preloaded player view,
            //because the preloaded player view is loaded the same time as
            //the current player view, their errors need to be handled at different times
            this.preloadedPlayerViewError = {
                errType : errType,
                errStack : errStack
            };
        };

       /**
         * @function handleTouchPlayer
         * @description handle Touch events for the player
         * @param {Event} e
         */
        this.handleTouchPlayer = function(e) {
            if(e.target.className === "player-back-button") { //back button
                this.currentView.handleControls({type : "touch", keyCode : buttons.BACK});
            } else { 
                this.currentView.handleControls({type : "touch", keyCode : buttons.PLAY_PAUSE});
            }
        }.bind(this);

        /**
         * @function transitionToNextVideo
         * @description handles showing the view to transition from playing one video to the next
         */
        this.transitionToNextVideo = function() {
            if (this.preloadedPlayerView) {
                if (this.$previewEl) {
                    this.$previewEl.remove();
                    this.$previewEl = null;
                }
                this.currentIndex = this.nextIndex;
                this.currentPlayerView.remove();
                this.previewDismissed = false;
                this.trigger("indexChange", this.currentIndex);
                this.startNextVideo();
            }
            else {
                this.exit();
            }
        };

        /**
         * @function showTransitionView
         * @description show transition view for the player
         */
        this.showTransitionView = function () {
            if (this.preloadedPlayerView) {
                var html = utils.buildTemplate($("#next-video-view-template"), this.items[this.currentIndex + 1]);
                this.$el.append(html);
                this.$previewEl = this.$el.children().last();
                this.$countdown_text = this.$previewEl.find(".next-video-starttext");
                this.$countdown_text.text("" + this.previewTime);
            }
        };

        /**
         * @function setUpNextPlayer
         * @description helper function to set up the next player
         */
        this.setUpNextPlayer = function () {
            var foundVideo = false;
            this.nextIndex = this.currentIndex + 1;
            while (!foundVideo && this.items.length > this.nextIndex) {
                if (this.items[this.currentIndex + 1].videoURL !== null) {
                    foundVideo = true;
                }
                else {
                    this.nextIndex++;
                }
            }
            if (this.items.length > this.nextIndex) {
                this.preloadedPlayerView = new this.PlayerView(settings);
                this.preloadedPlayerView.on('error', this.errorHandlerPreview, this);
                this.preloadedPlayerView.render(this.$el, this.items, this.nextIndex);
                this.preloadedPlayerView.hide();
            }
        };

        /**
         * @function handleVideoStatus
         * @description status handler for video status events to convert them into showing correct controls
         * @param {Number} currentTime the current time of video playback
         * @param {Number} duration the total duration of the video
         * @param {Number} type the type of video status event
         */
        this.handleVideoStatus = function(currentTime, duration, type) {       
            if (type === "playing") {
                if (this.$previewEl) {
                    this.timeTillPlay = Math.round((duration - currentTime));
                    this.$countdown_text.text("" + this.timeTillPlay);
                }
                else if (duration > 0 && duration - currentTime <= this.previewTime) {
                    // dont show preview if its an advertisement playing
                    if(this.currentPlayerView.adPlaying && this.currentPlayerView.adPlaying()){
                        return;
                    }
                    else if (!this.currentPlayerView.controlsCurrentlyShowing()) {
                        this.showTransitionView();
                    }
                }
            }

            if (type === "ended") {
                this.transitionToNextVideo();
            }
            else {
                this.trigger('videoStatus', currentTime, duration, type);
            }
        }.bind(this);
        
        /**
         * @function exit
         * @description cleanup and exit the playlist/player/next video view
         */
        this.exit = function() { 
            this.trigger("exit");
        };

        /**
         * @function playVideo
         * @description play the video in the current player
         */
        this.playVideo = function() {
            this.currentPlayerView.playVideo();
        };

        /**
         * @function updateTitleAndDescription
         * @description Updates the title and description 
         * @param {string} new title to set
         * @param {string} new description to set
         */
        this.updateTitleAndDescription = function(title, description) {
            if(this.currentPlayerView) {
                this.currentPlayerView.updateTitleAndDescription(title, description);
            }
        }.bind(this);
        
        /**
         * @function startNextVideo
         * @description start the next video after the transition view is complete
         */
        this.startNextVideo = function () {
            // trigger error event if there are errors
            if (this.preloadedPlayerViewError) {
                this.trigger('error', this.preloadedPlayerViewError.errType, this.preloadedPlayerViewError.errStack);
                this.preloadedPlayerViewError = null;
            }
            this.currentPlayerView.remove();
            this.currentPlayerView = this.preloadedPlayerView;
            this.preloadedPlayerView = null;

            this.currentPlayerView.on('videoStatus', this.handleVideoStatus, this);
            this.currentPlayerView.on('error', this.errorHandlerCurrent, this);
            this.setUpNextPlayer();
            this.currentView = this.currentPlayerView;
            this.currentPlayerView.show();
            if (this.currentPlayerView.canplay) {
                this.currentPlayerView.playVideo();
            }

            this.currentPlayerView.on('exit', this.exit, this);
        };

        /**
         * @function seekAction
         * @description check to see if we have a seek action
         * @param {Number} key the keyCode of the event
         * @return {Boolean}
         */
        this.seekAction = function(key) {
             return (key === buttons.LEFT || key === buttons.RIGHT || key === buttons.FAST_FORWARD || key === buttons.REWIND);
        };

        /**
         * @function handleControls
         * @description handle button events, send them to the current playlist view that is selected.
         * @param {Event} e
         */
        this.handleControls = function (e) {
            if (this.currentView) {
                if (this.$previewEl && this.$previewEl.is(':visible') && !this.previewDismissed && !this.seekAction(e.keyCode)) {
                    switch (e.keyCode) {
                        case buttons.BACK:
                        case buttons.DOWN:
                            this.$previewEl.remove();
                            this.previewDismissed = true;
                            break;
                        case buttons.SELECT:
                            this.transitionToNextVideo();
                            break;
                        case buttons.PLAY_PAUSE:
                            this.currentView.handleControls(e);
                            break;
                    }
                }
                else if (this.$previewEl && !this.currentPlayerView.controlsCurrentlyShowing() && !this.$previewEl.is(':visible') && !this.previewDismissed) {
                    switch (e.keyCode) {
                        case buttons.UP:
                            this.$previewEl.show();
                            break; 
                    }
                }
                else {
                    // hide the preview if player controls are used like skipping
                    if (this.$previewEl && this.$previewEl.is(':visible')) {
                        this.$previewEl.remove();
                        this.$previewEl = null;
                    }
                    this.currentView.handleControls(e);
                }
            }
        }.bind(this);
    }

    exports.PlaylistPlayerView = PlaylistPlayerView;
}(window));
