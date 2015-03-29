/* YouTube Player View
 *
 * Handles the media playback of Kaltura videos
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class KalturaPlayerView
     * @description Handles the media playback of YouTube videos
     */
    var KalturaPlayerView = function (settings) {
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

        // kaltura player embed settings:
        this.partnerId = settings.partnerId;
        this.uiconfId = settings.uiconfId;
        
       /**
        * Handler for video 'canplay' event
        */
        this.readyHandler = function() {
            this.canplay = true;
            this.trigger('videoStatus', this.player.evaluate('{video.player.currentTime}'), this.player.evaluate('{duration}'), 'canplay');
        }.bind(this);

        this.stateChangeHandler = function(currentState) {
        	this.currentState = currentState;
        	this.trigger('videoStatus', this.player.evaluate('{video.player.currentTime}'), this.player.evaluate('{duration}'), currentState);
        }.bind(this);

        this.statusUpdater = function() {
            if (this.player && this.currentState === 'playing' ) {
                this.trigger('videoStatus', this.player.evaluate('{video.player.currentTime}'), this.player.evaluate('{duration}'), 'playing');
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
            if (this.player.evaluate('{duration}') > 0) {
                this.controlsView.showAndHideControls();
            }
         };

        /**
         * Creates the main content view from the template and appends it to the given element
         */
        this.render = function ($container, data, index) {
            var _this = this;
            // Build the main content template and add it
            data = data[index];
            var html = utils.buildTemplate($("#player-view-template"), data);
            $container.append(html);
            this.$el = $container.children().last();

            this.$el.append("<div class='player-content-video' id='kaltura_player_" + index + "'></div>"); // Kaltura API replaces this element with the player
            // Assume kWidget is loaded from the data provider. 
            // always use HTML5:
            mw.setConfig('forceMobileHTML5', true);
            kWidget.embed({
            	'targetId': 'kaltura_player_' + index,
                'wid': '_' + this.partnerId,
                'uiconf_id': this.uiconfId,
                'entry_id': data.id,
                // use runtime overrides to make the player "chromeless" 
                'flashvars':{
                    'autoPlay': true,
                    'topBarContainer.plugin': false,
                    'controlBarContainer.plugin': false,
                    'largePlayBtn.plugin': false,
                    // 'loadingSpinner.plugin': false
                },
                'readyCallback': function( playerId ){
                    _this.player = $('#' + playerId )[0];
                    // setup date handler: 
                    _this.player.kBind('playerStateChange', _this.stateChangeHandler);
                    // kaltura player does not naturally trigger ended against stateChangeHandler. 
                    _this.player.kBind('playerPlayEnd', function(){
                    	_this.stateChangeHandler( 'ended' );
                    });
                    _this.player.kBind('mediaReady', _this.readyHandler);
                }
            })

            this.statusInterval = setInterval(this.statusUpdater, 1000);
            // create controls
            this.controlsView = new ControlsView();
            this.controlsView.render(this.$el, data, this);

        };
        /**
        * @function playVideo
        * @description start the video playing
        */
        this.playVideo = function() {
            if ( this.player ) {
            	this.player.sendNotification('doPlay');
            }
        };

        /**
        * @function pauseVideo
        * @description pause the currently playing video, called when app loses focus
        */
        this.pauseVideo = function () {
            if ( this.player ) {
                this.player.sendNotification('doPause');
            }
        };

        /**
        * @function resumeVideo
        * @description resume the currently playing video, called when app regains focus
        */
        this.resumeVideo = function() {
            if (this.player ) {
            	this.player.sendNotification('doPlay');
                this.trigger('videoStatus', 
                    this.player.evaluate('{video.player.currentTime}'), 
                    this.player.evaluate('{duration}'), 
                    'resumed');
            }
        };

        /**
        * @function seekVideo
        * @description navigate to a position in the video
        */
        this.seekVideo = function(change) {
        	var ct = this.player.evaluate('{video.player.currentTime}');
            this.trigger('videoStatus', ct, this.player.evaluate('{duration}'), 'playing');
            this.player.sendNotification('doSeek', (ct + change) );
            this.trigger('videoStatus', (ct + change), this.player.evaluate('{duration}'), 'seeking');
        };


        /*this.timeUpdateHandler = function() {
            this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        }.bind(this);*/

        // handle button events, connected to video API for a few operations
        this.handleControls = function (e) {
            if (e.type !== 'buttonpress') { return; }
            
            switch (e.keyCode) {
                case buttons.SELECT:
                case buttons.PLAY_PAUSE: 
                    switch (this.currentState) {
                        case 'playing':
                            this.pauseVideo();
                            break;

                        case 'paused':
                            this.resumeVideo();
                            break;
                    }
                    break;
                case buttons.BACK:
                    this.trigger('exit');
                    break;
                case buttons.LEFT:
                case buttons.REWIND:
                    this.seekVideo(-30);
                    break;

                case buttons.RIGHT:
                case buttons.FAST_FORWARD:
                    this.seekVideo(30);
                    break;
                case buttons.UP:
                    this.controlsView.showAndHideControls();
                    break;
                case buttons.DOWN:
                    if (this.currentState != 'paused') {
                        this.controlsView.hide();
                    }
                    break;
            }
        }.bind(this);
    };

    exports.KalturaPlayerView = KalturaPlayerView;
}(window));
