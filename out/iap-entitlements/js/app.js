/* Main Application
 *
 * This module initializes the application and handles
 * transition between different views
 *
 */

(function(exports) {
    "use strict";

   /**
    * The 'pause' event is fired when the app is sent to the background (app completely hidden) or when its partially obscured 
    */
    function onPause() {
        if (app.playerView) {
            app.playerView.pauseVideo();
        }
    }

   /**
    * The 'resume' event is fired when the app is brought to the foreground (app completely visible) including when the Voice Search Dialog is dismissed
    */
    function onResume() {
         if (app.playerView) {
             app.playerView.resumeVideo();
         }
    }

   /**
    * Add listeners for pause and resume when the platform is ready
    */
    function onAmazonPlatformReady() {
        document.addEventListener("pause" , onPause, false);
        document.addEventListener("resume" , onResume, false);
    }

   /**
    * Handle device rotation event
    * When in portrait mode put up the app overlay div and notify the user
    * to change back to landscape
    */
    function handleDeviceOrientation() {
        //disregard on FireTV
        if(navigator.userAgent.match(/AFT/i)) {return;}

        //wrap in a timer to make sure the height and width are updated
        setTimeout(function() {
            if(window.innerWidth < window.innerHeight) {
                $('#overlay-message').html('please rotate your device back to landscpe');
                $('#app-overlay').css('display', 'block'); 
            } 
            else {
                $('#overlay-message').html('');
                $('#app-overlay').css('display', 'none'); 
            }
        }, 500);
    }

    document.addEventListener("amazonPlatformReady" , onAmazonPlatformReady, false);  
    window.addEventListener('orientationchange', handleDeviceOrientation, false); 

   /**
    * The app object : the controller for the app, it creates views, manages navigation between views
    *                  routes input to the currently focused view, giving data to the views, and otherwise stitching things together
    * @param {Object} settingsParams settings for the application
    *                 settingsParams.dataURL {String} url of the initial data request 
    *                 settingsParams.displayButtons {Boolean} flag that tells the app to display the buttons or not
    */
    function App(settingsParams) {

        //hold onto the app settings
        this.settingsParams = settingsParams;
        this.showSearch = settingsParams.showSearch;

        //main application container div
        this.$appContainer = $("#app-container");

       /**
        * Handle the call to the model to get our data 
        */
        this.makeInitialDataCall = function () {
            this.data.loadInitialData(this.dataLoaded);
        };

       /**
        * Callback from XHR to load the data model, this really starts the app UX
        */
        this.dataLoaded = function() {
            var logo;
            this.$appContainer.empty();

            //check for entitlement services
            if(settingsParams.entitlement) {
                this.initializeEntitlementView();
            }

            // quick template render to add the logo to the app, probably doesnt need an entire view since its one line
            if (app.data.appLogo) {
                logo = app.data.appLogo;
            } 
            else {
                logo = "assets/img_logo.png";
            }
            
            var html = utils.buildTemplate($("#app-header-template"), {
                img_logo:logo
            });
            this.$appContainer.append(html);
            
            this.initializeLeftNavView();

            this.initializeOneDView();

            this.selectView(this.oneDView);

        }.bind(this);

       /** 
        * Set the application's current view
        * @param {Object} view the current view
        */
        this.selectView = function (view) {
            this.currentView = view;
        };

       /**
        * User has pressed the back button
        */
        this.exitApp = function () {
            if (confirm("Are you sure you want to exit?")) {
                window.open('', '_self').close();
            }
            buttons.resync();
        };

        this.exitPlayerView = function () {
            this.loadingSpinner.hide.all();

            // incase this was a livestream we need to clear the livestream updater
            clearTimeout(this.liveUpdater);
            if (this.subCategoryView) {
                this.transitionFromPlayerToSubCategory();
            }
            else {
                this.transitionFromPlayerToOneD();
            }
        };

       /**
        * All button events route through here, send them to current view
        * Views are switched based on the type of key press - up and down
        * key events will make the left-nav menu the focus while left and 
        * right control the oneDView. When the video player has focus it
        * will handle all key events
        * @param {Event} e
        */
        this.handleButton = function(e) {
            //TODO: hijack button events when error dialog is active. We may not need special logic if we set dialog view to currentView.
            //Pending implementation detail.
            if (this.currentView) {
                this.currentView.handleControls(e);
            } 
            else if (e.type === 'buttonpress' && e.keyCode === buttons.BACK) {
                this.exitApp();
            }
        };

       /**
        * Handle touch events
        */
        this.handleTouch = function(e) {
            if(e.type === 'swipe') {
                if($("#left-nav-list-container").hasClass('leftnav-menulist-collapsed')) {
                    this.currentView = this.oneDView;
                } 
                else {
                    this.currentView = this.leftNavView;
                }
            }
            this.currentView.handleControls(e);
        };

       /***************************
        *
        * IAP Purchase Flow 
        *
        **************************/
        this.initializeEntitlementView = function() {
            var entitlementView = this.entitlementView = new EntitlementView();

           /**
            * Event Handler - Handle leaving the entitlement view
            */
            entitlementView.on('exit', function() {
                this.transitionOutOfEntitlementView();
            }, this);

            entitlementView.render(app.$appContainer);
        };

       /***************************
        *
        * Left Nav View Object
        *
        **************************/
        this.initializeLeftNavView = function() {

            var leftNavView = this.leftNavView = new LeftNavView();
            if (this.showSearch) {
                this.searchInputView = new SearchInputView();
            }

           /**
            * Event Handler - Select menu item
            * @param {Number} index the index of the selected item
            */
            leftNavView.on('select', function(index) {
                if (!this.showSearch || index !== 0) {
                    //remove the contents of the oneDView
                    this.oneDView.remove();
                    
                    //show the spinner
                    this.loadingSpinner.show.spinner();

                    //set the newly selected category index
                    if(this.showSearch) { index--;}
                    app.data.setCurrentCategory(index);

                    //update the content
                    this.oneDView.updateCategory();   
                    
                    //set the selected view
                    this.selectView(this.oneDView);
                    
                    //hide the leftNav
                    this.leftNavView.collapse();

                    if (this.showSearch) {
                        this.leftNavView.searchUpdated = false;
                        this.searchInputView.reset();
                    }
                }
                else {
                    //remove the contents of the oneDView
                    this.oneDView.remove();
                    
                    //show the spinner
                    this.loadingSpinner.show.spinner();
                    this.oneDView.updateCategoryFromSearch(this.searchInputView.currentSearchQuery);

                    //set the selected view
                    this.selectView(this.oneDView);
                    
                    //hide the leftNav
                    this.leftNavView.collapse();
                }
            }, this);

           /**
            * Event Handler - deselect leftnav view
            */
            leftNavView.on('deselect', function() {
                this.transitionFromLefNavToOneD();
                if (this.oneDView.noItems) {
                    this.exitApp();
                }
            }, this);
   
           /**
            * Event Handler - exit the left nav back to oneD
            */
            leftNavView.on('exit', function() {
                this.leftNavView.collapse();
                this.transitionToLeftNavView();
            }, this);

            if (this.showSearch) {
                this.searchInputView.on('searchQueryEntered', function() {
                    if (this.leftNavView.currSelectedIndex === 0) {
                    this.leftNavView.searchUpdated = true;
                    this.leftNavView.confirmNavSelection();
                    }   
                }, this);
            }

           /**
            * Event Handler - Make this the active view
            */
            leftNavView.on('makeActive', function() {
                this.transitionToExpandedLeftNavView();
            }, this);

           /**
            * Event Handler - Change index of currently selected menu item 
            * @param {Number} index the index of the selected item
            */
            leftNavView.on('indexChange', function(index) {
                //set the newly selected category index
                if (this.showSearch && index === 0) {
                    this.searchInputView.select();
                }
                else {
                    if (this.showSearch) {
                        app.data.setCurrentCategory(index - 1);
                    } 
                    else {
                        app.data.setCurrentCategory(index);
                    }
                    if (this.showSearch) {
                        this.searchInputView.deselect();
                    }
                }

            }, this);

           /**
            * Event Handler - When the left nav is loaded remove the 
            *                 app overlay until the content is loaded
            */
            leftNavView.on('loadComplete', function() {
                this.loadingSpinner.hide.overlay();
            }, this);

            //render the left nav right now
            var leftNavData = app.data.getCategoryItems().slice(0);
            var startIndex = 0;
            if (this.showSearch) {
                leftNavData.unshift(this.searchInputView);
                startIndex = 1;
            }

            leftNavView.render(app.$appContainer, leftNavData, startIndex);
        };

       /***************************
        *
        * One D View 
        *
        **************************/
        this.initializeOneDView = function() {
            // create and set up the 1D view
            var oneDView = this.oneDView = new OneDView();

           /** 
            * Event Handler - Select shoveler item
            * @param {Number} index the index of the selected item
            */
            oneDView.on('select', function(index) {
                this.data.setCurrentItem(index);
                if (this.categoryData[index].type === "subcategory") {
                    this.transitionToSubCategory(this.categoryData, index);
                } 
                else if (this.categoryData[index].type === "video-live" && !this.categoryData[index].isLiveNow) {
                    alert("This video is not yet available.");
                    buttons.resync();
                }
                else {
                    this.createLiveStreamUpdater(this.categoryData, index);
                    this.transitionToPlayer(this.categoryData, index);
                }
            }, this);

           /** 
            * Event Handler - No content found for oneD event
            */
            oneDView.on('noContent', function() {
                window.setTimeout(function(){
                    this.loadingSpinner.hide.spinner();
                    this.transitionToLeftNavView();
                    this.leftNavView.setHighlightedElement();
                }.bind(this), 10);
            }, this);

           /**
            * Go back to the left-nav menu list
            * @param {String} direction keypress direction
            */
            oneDView.on('bounce', function(dir) {
                if(dir === buttons.DOWN) {
                    if(this.settingsParams.entitlement) {
                        this.transitionToEntitlementView();
                    }
                } 
                else {
                    this.transitionToLeftNavView();
                }
            }, this);

           /**
            * Exit the application if they go back from the oneD view
            */
            oneDView.on('exit', function() {
                this.exitApp();
            }, this);

           /** 
            * Event Handler - Load Complete 
            * @param {Number} index the index of the selected item
            */
            oneDView.on('loadComplete', function() {
                this.loadingSpinner.hide.spinner();
                handleDeviceOrientation();
            }, this);

           /** 
            * Success Callback handler for category data request
            * @param {Object} categoryData
            */
            var successCallback = function(categoryData) {
                this.succeededCategoryIndex = this.leftNavView.confirmedSelection;
                this.categoryData = categoryData;
                $("#one-D-view-item-elements").remove();
                oneDView.render(this.$appContainer, categoryData, this.settingsParams.displayButtons);
            }.bind(this);

           /**
            * Get data set for newly-selected category
            */
            oneDView.updateCategoryFromSearch = function(searchTerm) {
                app.data.getDataFromSearch(searchTerm, successCallback);
            }.bind(this);

            oneDView.updateCategory = function() {
                app.data.getCategoryData(successCallback);
            }.bind(this);

            //get the first category right now
            this.oneDView.updateCategory();
        };

        this.openSubCategory = function(data) {
            this.succeededSubCategoryIndex = this.oneDView.currSelection;
            if (this.subCategoryView) {
                if (!this.subCategoryStack) {
                    this.subCategoryStack = [];
                }
                this.subCategoryStack.push(this.subCategoryView);
                this.subCategoryView.hide();
            }
            var subCategoryView = this.subCategoryView = new SubCategoryView();
            this.subCategoryView.data = data.contents;
            this.oneDView.fadeOut();
            this.leftNavView.fadeOut();
            subCategoryView.render(this.$appContainer, data.title, data.contents, this.settingsParams.displayButtons);
            subCategoryView.hide();
            subCategoryView.fadeIn();
            this.selectView(this.subCategoryView);

           /** 
            * Event Handler - Select shoveler item
            * @param {Number} index the index of the selected item
            */
            subCategoryView.on('select', function(index) {
                if (this.subCategoryView.data[index].type === "subcategory") {
                    this.transitionToSubCategory(this.subCategoryView.data, index);
                }
                else if (this.subCategoryView.data[index].type === "video-live" && !this.subCategoryView.data[index].isLiveNow) {
                    alert("This video is not yet available.");
                    buttons.resync();
                }
                else {
                    this.createLiveStreamUpdater(this.subCategoryView.data, index);
                    this.transitionToPlayer(this.subCategoryView.data, index);
                }
            }, this);

           /**
            * Go back to the left-nav menu list if the user presses back
            */
            subCategoryView.on('exit', function() {
                this.subCategoryView.remove();
                this.subCategoryView = null;
                if (this.subCategoryStack && this.subCategoryStack.length > 0) {
                    this.subCategoryView = this.subCategoryStack.pop();
                    this.subCategoryView.fadeIn();
                    this.selectView(this.subCategoryView);
                }
                else {
                    this.leftNavView.fadeIn();
                    this.oneDView.fadeIn();
                    this.selectView(this.oneDView);
                }

            }, this);
        }.bind(this);
        
       /**
        * Change to subcategory
        * @param {Object} data subcategory
        * @param {Number} index the index of the category
        */
        this.transitionToSubCategory = function(data, index) {
            app.data.setCurrentSubCategory(data[index]);
            app.data.getSubCategoryData(this.openSubCategory);
        }.bind(this);

       /** 
        * Sets up the update function for changing the live stream title and description when the content changes on it.
        * @param {Object} data to get the updated information from
        * @param {Number} current index what is playing
        */
        this.createLiveStreamUpdater = function (data, index) {
            if (index + 1 < data.length) {
                var nextIndex = index + 1;
                if (data[nextIndex].type === "video-live")
                {             
                    var startTime = new Date(data[nextIndex].startTime).getTime();
                    var currTime = new Date().getTime();
                    var updateTime = startTime - currTime;
                    this.liveUpdater = setTimeout(function() {
                        this.updateLiveStream(data, nextIndex);
                    }.bind(this), updateTime);
                }
            }
        }.bind(this);

        /* Update the title and description of the live stream when the time has come and set up the next updator */
        this.updateLiveStream = function(data, index) {
            if (this.playerView) {
                this.playerView.updateTitleAndDescription(data[index].title, data[index].description);
            }
            this.createLiveStreamUpdater(data, index);
        }.bind(this);

       /**
        * loadingSpinner Object 
        * Used to show/hide the loading spinner and app overlay
        */
        this.loadingSpinner = {
            show : {
                overlay : function() {
                    $('#app-overlay').show();
                },
                spinner : function() {
                    $('#app-loading-spinner').show();
                },
                all : function() {
                    this.overlay();
                    this.spinner();
                }
            },

            hide : {
                overlay : function() {
                    $('#app-overlay').fadeOut(250);
                },
                spinner : function() {
                    $('#app-loading-spinner').hide();
                },
                all : function() {
                    this.overlay();
                    this.spinner();
                }
            },
        };

       /**
        * Hide application header bar - typically used
        * when another view takes over the screen (i.e. player)
        */
        this.hideHeaderBar = function() {
            $("#app-header-bar").hide();
        };

       /**
        * Show application header bar 
        */
        this.showHeaderBar = function() {
            $("#app-header-bar").show();
        };

/***********************************
 * 
 * Application Transition Methods
 *
 ***********************************/
       /**
        * Set the UI appropriately for the left-nav view
        */
        this.transitionToLeftNavView = function() {
            this.selectView(this.leftNavView);
            this.leftNavView.setHighlightedElement();

            //change size of selected shoveler item 
            this.oneDView.shrinkShoveler();
        };

       /**
        * Set the UI appropriately for the entitlement view
        */
        this.transitionToEntitlementView = function() {
            this.selectView(this.entitlementView);

            //handle content buttons
            this.oneDView.transitionToExternalView();

            //set button to selected state
            this.entitlementView.highlightButton();
        };

       /**
        * Set the UI back to the oneDView 
        */
        this.transitionOutOfEntitlementView = function() {
            this.selectView(this.oneDView);

            //set active view in the oneDView
            this.oneDView.transitionFromExternalView();

            //set button to selected state
            this.entitlementView.deselectButton();
        };

       /** 
        * For touch there is no need to select the chosen left-nav
        * item, so we go directly to the expanded view
        */
        this.transitionToExpandedLeftNavView = function() {
            this.selectView(this.leftNavView);

            //expand the left nav
            this.leftNavView.expand();

            //change size of selected shoveler item 
            this.oneDView.shrinkShoveler();
        };

       /**
        * Transition from left nav to the oneD view
        */
        this.transitionFromLefNavToOneD = function () {
            if (this.oneDView.noItems) {
                this.leftNavView.setHighlightedElement();
                return;
            }
            this.leftNavView.collapse();
            this.selectView(this.oneDView);

            //change size of selected shoveler item 
            this.oneDView.expandShoveler();
        };

       /**
        * Transition from player view to one-D view 
        */
        this.transitionFromPlayerToOneD = function () {
            this.selectView(this.oneDView);
            if (this.playerView) {
                this.playerView.off('videoStatus', this.handleVideoStatus, this);
                this.playerView.remove();
                this.playerView = null;
            }
            this.oneDView.show();
            this.leftNavView.show();
            this.oneDView.shovelerView.show();
            this.showHeaderBar();
        };

        /**
        * Transition from player view to SubCategory view 
        */
        this.transitionFromPlayerToSubCategory = function () {
            this.selectView(this.subCategoryView);
            if (this.playerView) {
                this.playerView.off('videoStatus', this.handleVideoStatus, this);
                this.playerView.remove();
                this.playerView = null;
            }
            this.subCategoryView.show();
            this.showHeaderBar();
        };

       /**
        * Opens a player view and starts video playing in it. 
        * @param {Array} data of current play list
        * @param {integer} index of currently selected item
        */
        this.transitionToPlayer = function (data, index) {
            var playerView;
            this.playerSpinnerHidden = false;
            if (this.settingsParams.PlaylistView && data[index].type !== "video-live") {
                playerView = this.playerView = new this.settingsParams.PlaylistView(this.settingsParams);
            }
            else {
                playerView = this.playerView = new this.settingsParams.PlayerView(this.settingsParams);
            }
            this.oneDView.hide();
            if (this.subCategoryView) {
                this.subCategoryView.hide();
            }
            this.leftNavView.hide();
            this.hideHeaderBar();

            //start the loader
            this.loadingSpinner.show.all();

            playerView.on('exit', this.exitPlayerView, this);

            playerView.on('indexChange', function(index) {
                if (this.subCategoryView) {
                    this.subCategoryView.changeIndex(index);
                }
                else {
                    this.oneDView.changeIndex(index);
                }
            }, this);

            this.selectView(playerView);

            playerView.on('videoStatus', this.handleVideoStatus, this);
            playerView.on('error', function(errType, errStack) {
                var errorDialog;

                switch (errType) {
                    case ErrorTypes.PLAYER_ERROR:
                        var buttons = this.createOkButtonForErrorDialog(this.exitAppCallback);
                        errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                        this.transitionToErrorDialog(errorDialog);
                        break;
                    case ErrorTypes.CONTENT_SRC_ERROR:
                    case ErrorTypes.CONTENT_DECODE_ERROR:
                    case ErrorTypes.VIDEO_NOT_FOUND:
                    case ErrorTypes.TIMEOUT_ERROR:
                    case ErrorTypes.NETWORK_ERROR:
                    case ErrorTypes.HTML5_PLAYER_ERROR:
                    case ErrorTypes.EMBEDDED_PLAYER_ERROR:
                        var buttons = this.createButtonsForErrorDialog(this.playerErrorOkCallback, this.playerErrorRetryCallback);
                        errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                        this.transitionToErrorDialog(errorDialog);
                        break;
                    default:
                        errType.errToDev = "An unknown error occurred in the player adapter";
                        errType.errToUser = "There is an error with the player.";
                        break;
                }
                errorHandler.writeToConsole(errType, errType.errToDev, errStack);
                errorHandler.informDev(errType, errType.errToDev, errStack);
            }.bind(this));

            playerView.render(this.$appContainer, data, index);
        };

       /**
        * Apps player status handler, currently just checks for playing and hides spinner and turns off the handler.
        */
        this.handleVideoStatus = function(currTime, duration, type) {
            if (!this.playerSpinnerHidden && type === "playing") {
                this.loadingSpinner.hide.all();
                this.playerSpinnerHidden = true;
            }
            else if (type === "canplay") {
                this.playerView.playVideo();
            }
            else if (type === "ended") {
                this.loadingSpinner.hide.all();
                this.transitionFromPlayerToOneD();
            }
        };

        // set up button handlers
        buttons.on('buttonpress', this.handleButton, this);
        buttons.on('buttonrepeat', this.handleButton, this);
        buttons.on('buttonrelease', this.handleButton, this);

        touches.on('touch', this.handleTouch, this);
        touches.on('swipe', this.handleTouch, this);
        
        // initialize error handler instance that will be used globally
        exports.errorHandler = new ErrorHandler();
        // initialize utils instance
        exports.utils = new Utils(this.settingsParams);

        // an error has occured that should generate a dialog to the user transition to that error
        this.transitionToErrorDialog = function(dialogView) {
            // show the error dialog
            if ($('#app-loading-spinner').is(":visible")) {
                this.loadingSpinner.hide.spinner();
            }
            $('#app-overlay').show();
            this.errorDialog = dialogView;
            this.errorDialog.render(this.$appContainer);
            this.appViewBeforeError = this.currentView;
            this.selectView(this.errorDialog);

        }.bind(this);

        // transition the error dialog back to the previous view
        this.transitionFromErrorDialog = function() {
           // remove the error dialog
           this.errorDialog.remove();
           this.errorDialog = null;
            var $appOverlay = $('#app-overlay');

            if ($appOverlay.css('display') !== 'none') {
                $appOverlay.fadeOut(250);
            }
           this.selectView(this.appViewBeforeError);
        }.bind(this);

        //create OK button for error dialog
        this.createOkButtonForErrorDialog = function(okCallback) {
            var buttons = [{
                        text : "OK",
                        id : "ok",
                        callback : okCallback
                    }];
            return buttons;
        }

        //create buttons for error dialog
        this.createButtonsForErrorDialog = function(okCallback, retryCallback) {
            var buttons = [{
                        text : "OK",
                        id : "ok",
                        callback : okCallback
                    },
                    {
                        text : "Retry",
                        id : "retry",
                        callback : retryCallback
                    }];
            return buttons;
        };

        //player error callback function for the OK button
        this.playerErrorOkCallback = function() {
            //go back to one D view
            this.exitPlayerView();
            if (this.subCategoryStack && this.subCategoryStack.length > 0) {
                this.appViewBeforeError = this.subCategoryView;
                this.transitionFromErrorDialog();
                this.transitionFromPlayerToSubCategory();
            }
            else {
                this.appViewBeforeError = this.oneDView;
                this.transitionFromErrorDialog();
                this.transitionFromPlayerToOneD();
            }
        }.bind(this);

        //player error callback function for the retry button
        this.playerErrorRetryCallback = function() {
            //retry playing the video from the beginning
            if (this.appViewBeforeError instanceof PlaylistPlayerView || this.appViewBeforeError instanceof PlayerView){
                this.transitionFromErrorDialog();
                this.playerView.remove();
                var el = this.appViewBeforeError.$el;
                var data = this.appViewBeforeError.items;
                var index = this.appViewBeforeError.currentIndex;
                this.appViewBeforeError.render(el, data, index);
            }
        }.bind(this);

        //callback function for the OK button
        this.exitAppCallback = function() {
            window.open('', '_self').close();
        };

        //initial feed error callback function for the retry button
        this.initialFeedErrorRetryCallback = function() {
            this.transitionFromErrorDialog();
            this.data.loadInitialData(this.dataLoaded);
        }.bind(this);

        //category error callback function for the OK button
        this.categoryErrorOkCallback = function() {
            this.transitionFromErrorDialog();
            //if there's an error when loaing the first category, exit the app
            if (!this.succeededCategoryIndex) {
                this.exitAppCallback();
            }
            //go back to previous category
            this.leftNavView.currSelectedIndex = this.succeededCategoryIndex;
            if (this.showSearch) {
                this.data.setCurrentCategory(this.succeededCategoryIndex - 1);
            } else {
                this.data.setCurrentCategory(this.succeededCategoryIndex);
            }
            this.leftNavView.selectLeftNavItem();
            this.leftNavView.confirmNavSelection();
        }.bind(this);

        //category error callback function for the retry button
        this.categoryErrorRetryCallback = function() {
            //retry updating category
            this.transitionFromErrorDialog();
            this.loadingSpinner.show.spinner();
            this.oneDView.updateCategory();
            this.selectView(this.oneDView);
            this.leftNavView.collapse();

            if (this.showSearch) {
                this.leftNavView.searchUpdated = false;
                this.searchInputView.reset();
            }
        }.bind(this);

        //subcategory error callback function for the OK button
        this.subCategoryErrorOkCallback = function() {
            //go back to previous sub category
            this.transitionFromErrorDialog();
            this.data.setCurrentSubCategory(this.succeededSubCategoryIndex);
            this.data.getSubCategoryData(this.openSubCategory);
        }.bind(this);

        //subcategory error call back function for the retry button
        this.subCategoryErrorRetryCallback = function() {
            //retry updating subcategory
            this.transitionFromErrorDialog();
            this.data.getSubCategoryData(this.openSubCategory);
        }.bind(this);

        //search error callback functino for the OK button
        this.searchErrorOkCallback = function() {
            //transition from error dialog to previous view
            this.transitionFromErrorDialog();
        }.bind(this);

        //search error callback function for the retry button
        this.searchErrorRetryCallback = function() {
            //retry
            this.transitionFromErrorDialog();
            this.loadingSpinner.show.spinner();
            this.oneDView.updateCategoryFromSearch(this.searchInputView.currentSearchQuery);
            //set the selected view
            this.selectView(this.oneDView);
            //hide the leftNav
            this.leftNavView.collapse();
        }.bind(this);

        //initialize the model and get the first data set
        this.data = new this.settingsParams.Model(this.settingsParams);

        // handle errors from the model 
        this.data.on("error", function(errType, errStack) {
            var errorDialog;
            var buttons;

            switch (errType) {
                case ErrorTypes.INITIAL_FEED_ERROR:
                case ErrorTypes.INITIAL_PARSING_ERROR:
                case ErrorTypes.INITIAL_FEED_TIMEOUT:
                case ErrorTypes.INITIAL_NETWORK_ERROR:
                    // Create buttons for the error dialog pop up.
                    buttons = this.createButtonsForErrorDialog(this.exitAppCallback, this.initialFeedErrorRetryCallback);
                    errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                    this.transitionToErrorDialog(errorDialog);
                    break;
                case ErrorTypes.CATEGORY_FEED_ERROR:
                case ErrorTypes.CATEGORY_PARSING_ERROR:
                case ErrorTypes.CATEGORY_FEED_TIMEOUT:
                case ErrorTypes.CATEGORY_NETWORK_ERROR:
                    buttons = this.createButtonsForErrorDialog(this.categoryErrorOkCallback, this.categoryErrorRetryCallback);
                    errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                    this.transitionToErrorDialog(errorDialog);
                    break;
                case ErrorTypes.SUBCATEGORY_ERROR:
                case ErrorTypes.SUBCATEGORY_PARSING_ERROR:
                case ErrorTypes.SUBCATEGORY_TIMEOUT:
                case ErrorTypes.SUBCATEGORY_NETWORK_ERROR:
                    buttons = this.createButtonsForErrorDialog(this.subCategoryErrorOkCallback, this.subCategoryErrorRetryCallback);
                    errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                    this.transitionToErrorDialog(errorDialog);
                    break;
                case ErrorTypes.SEARCH_ERROR:
                case ErrorTypes.SEARCH_PARSING_ERROR:
                case ErrorTypes.SEARCH_TIMEOUT:
                case ErrorTypes.SEARCH_NETWORK_ERROR:
                    buttons = this.createButtonsForErrorDialog(this.searchErrorOkCallback, this.searchErrorRetryCallback);
                    errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                    this.transitionToErrorDialog(errorDialog);
                    break;
                case ErrorTypes.TOKEN_ERROR:
                    buttons = this.createOkButtonForErrorDialog(this.exitAppCallback);
                    errorDialog = errorHandler.createErrorDialog(errType.errTitle, errType.errToUser, buttons);
                    this.transitionToErrorDialog(errorDialog);
                    break;
                default:
                    //won't show an error dialog for unknown errors, so that users don't see many bad error messages
                    errType.errToDev = "An unknown error occurred in the data model adapter";
                    errType.errToUser = "There is an error with the data.";
                    break;

            }
            errorHandler.writeToConsole(errType, errType.errToDev, errStack);
            errorHandler.informDev(errType, errType.errToDev, errStack);
        }.bind(this));

        this.makeInitialDataCall();
    }

    exports.App = App;
}(window));
