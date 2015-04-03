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

       /**
        * All button events route through here, send them to current view
        * Views are switched based on the type of key press - up and down
        * key events will make the left-nav menu the focus while left and 
        * right control the oneDView. When the video player has focus it
        * will handle all key events
        * @param {Event} e
        */
        this.handleButton = function(e) {
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
                    this.showContentLoadingSpinner();

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
                    this.showContentLoadingSpinner();
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
                this.hideContentLoadingSpinner();
                handleDeviceOrientation();
            }, this);

           /** 
            * Success Callback handler for category data request
            * @param {Object} categoryData
            */
            var successCallback = function(categoryData) {
                this.categoryData = categoryData;
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
        * Hide content loading spinner 
        */
        this.hideContentLoadingSpinner = function() {
            $('#app-loading-spinner').hide();
            var $appOverlay = $('#app-overlay');

            if ($appOverlay.css('display') !== 'none') {
                $appOverlay.fadeOut(250);
            }
        };

       /**
        * Show content loading spinner 
        * @param {Boolean} showOverlay if true show the app overlay
        */
        this.showContentLoadingSpinner = function(showOverlay) {
            $('#app-loading-spinner').show();

            if(showOverlay) {
                $('#app-overlay').show();
            }
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
            this.playerView.off('videoStatus', this.handleVideoStatus, this);
            this.playerView.remove();
            this.playerView = null;
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
            this.playerView.off('videoStatus', this.handleVideoStatus, this);
            this.playerView.remove();
            this.playerView = null;
            this.subCategoryView.show();
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
            this.showContentLoadingSpinner(true);

            playerView.on('exit', function() {
                this.hideContentLoadingSpinner();

                // incase this was a livestream we need to clear the livestream updater
                clearTimeout(this.liveUpdater);
                if (this.subCategoryView) {
                    this.transitionFromPlayerToSubCategory();
                }
                else {
                    this.transitionFromPlayerToOneD();
                }
            }, this);

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

            playerView.render(this.$appContainer, data, index);
        };

       /**
        * Apps player status handler, currently just checks for playing and hides spinner and turns off the handler.
        */
        this.handleVideoStatus = function(currTime, duration, type) {
            if (!this.playerSpinnerHidden && type === "playing") {
                this.hideContentLoadingSpinner();
                this.playerSpinnerHidden = true;
            }
            else if (type === "canplay") {
                this.playerView.playVideo();
            }
            else if (type === "ended") {
                this.hideContentLoadingSpinner();
                this.transitionFromPlayerToOneD();
            }
        };

        // set up button handlers
        buttons.on('buttonpress', this.handleButton, this);
        buttons.on('buttonrepeat', this.handleButton, this);
        buttons.on('buttonrelease', this.handleButton, this);

        touches.on('touch', this.handleTouch, this);
        touches.on('swipe', this.handleTouch, this);

        //initialize the model and get the first data set
        this.data = new this.settingsParams.Model(this.settingsParams);

        this.makeInitialDataCall();
    }

    exports.App = App;
}(window));
