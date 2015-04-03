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
        Events.call(this, ['exit', 'videoStatus', 'indexChange']);

        //jquery variables
        this.$el = null;
        this.$currSeekTime = null;

        //class variables
        this.canplay = null;
        this.controlsView = null;
        this.durationFound = false;
        this.statusInterval = null;
        this.currentState = null;
       
        this.SKIP_LENGTH_DEFAULT = 30;

        //set skip length
        if (settings.skipLength) {
            this.skipLength = settings.skipLength;
        } else {
            this.skipLength = this.SKIP_LENGTH_DEFAULT;
        }
       /**
        * Handler for video 'canplay' event
        */
        this.readyHandler = function() {
            this.canplay = true;
            this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'canplay');
        }.bind(this);

        this.stateChangeHandler = function(currentState) {
            switch(currentState.data) {
                case YT.PlayerState.PLAYING:
                    this.currentState = currentState.data;
                    this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'playing');
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

        this.statusUpdater = function() {
            if (this.currentState === YT.PlayerState.PLAYING) {
                this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'playing');
            }
        }.bind(this);

       /**
        * Remove the video element from the app
        */
        this.remove = function () {
            this.controlsView.remove();
            this.$el.remove();
            clearInterval(this.statusInterval);
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
            data = data[index];
            var html = utils.buildTemplate($("#player-view-template"), data);
            $container.append(html);
            this.$el = $container.children().last();

            this.$el.append("<div id='player'></div>"); // youtube API replaces this element with the player
            if (youTubePlayerReady) {
                this.player = new YT.Player(this.$el.children('#player')[0], {
                    height: '1080',
                    width: '1920',
                    videoId: data.videoURL,
                    playerVars: {
                        enablejsapi: 1,
                        fs: 0, // disable fullscreen button
                        showinfo: 0,
                        vq: "hd1080",
                        controls: '0'
                    },
                    events: {
                        'onReady': this.readyHandler,
                        'onStateChange': this.stateChangeHandler
                    }
                });
            }

            this.statusInterval = setInterval(this.statusUpdater, 1000);
            // create controls
            this.controlsView = new ControlsView();
            this.controlsView.render(this.$el, data, this);

        };

        this.durationChangeHandler = function() {
            if (this.videoElement.duration && this.videoElement.duration > 0) {
                this.durationFound = true;
            }
        }.bind(this);

        /**
        * @function playVideo
        * @description start the video playing
        */
        this.playVideo = function() {
            if (this.player && this.player.playVideo) {
                this.player.playVideo();
            }
        };

        /**
        * @function pauseVideo
        * @description pause the currently playing video, called when app loses focus
        */
        this.pauseVideo = function () {
            if (this.player && this.player.pauseVideo) {
                this.player.pauseVideo();
            }
        };

        /**
        * @function resumeVideo
        * @description resume the currently playing video, called when app regains focus
        */
        this.resumeVideo = function() {
            if (this.player && this.player.playVideo) {
                this.player.playVideo();
                this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'resumed');
            }
        };

        /** 
         * @function controlsCurrentlyShowing 
         * Controls currently showing status indicator
         */
        this.controlsCurrentlyShowing = function() {
            return this.controlsView.controlsShowing();
        }.bind(this);

        /**
        * @function seekVideo
        * @description navigate to a position in the video
        */
        this.seekVideo = function(change) {
            this.trigger('videoStatus', this.player.getCurrentTime(), this.player.getDuration(), 'playing');
            this.player.seekTo(this.player.getCurrentTime() + change,  true);
            this.trigger('videoStatus', this.player.getCurrentTime() + change, this.player.getDuration(), 'seeking');
        };


        this.timeUpdateHandler = function() {
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        }.bind(this);

        // handle button events, connected to video API for a few operations
        this.handleControls = function (e) {
            if (e.type !== 'buttonpress') { return; }
            
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
        }.bind(this);
    }

    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    exports.onYouTubeIframeAPIReady = function() {
        youTubePlayerReady = true;
    };

    exports.YouTubePlayerView = YouTubePlayerView;
}(window));
