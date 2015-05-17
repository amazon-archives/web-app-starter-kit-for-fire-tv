/* One D View
 *
 * Handles 1D view containing one sub-category of elements
 *
 */

(function (exports) {
    "use strict";

    /**
     * @class OneDView
     * @description The 1D view object, this handles everything about the 1D menu.
     */
    function OneDView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['noContent', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce', 'loadComplete']);

        //global variables
        this.currSelection = 0;
        this.currentView   = null;
        this.titleText = null;
        this.$shovelerContainer = null;
        this.noItems = false;

        //jquery global variables
        this.$el = null;
        this.el = null;

        this.fadeOut = function() {
            this.$el.css("opacity", "0");
            this.shovelerView.fadeOut();
        };

        this.fadeIn = function() {
            this.$el[0].style.opacity = "";
            this.shovelerView.fadeIn();
        };
       /**
        * Hide this view - use visibility instead of display
        * so that we don't loose any of our dynamic items
        */
        this.hide = function () {
            this.$el[0].style.opacity = "0";
            this.shovelerView.hide();
        };

       /**
        * Display this view
        */
        this.show = function () {
            this.$el.css("opacity", "");
            this.shovelerView.show();
        };

       /**
        * Remove the oneDView element
        */
        this.remove = function () {
            if(this.el) {
                $(this.el).remove();
            }
        };

       /**
        * Maintain the current view for event handling
        */
        this.setCurrentView = function (view) {
            this.currentView = view;
        };

        /**
         * Creates the one-d-view and attaches it to the application container
         * @param {Element} $el application container
         * @param {Object} rowData data object for the row
         * @param {Object} displayButtonsParam controls button display
         */
        this.render = function ($el, rowData, displayButtonsParam) {
            //Make sure we don't already have a full container
            this.remove();

            // Build the main content template and add it
            this.titleText = rowData.title;
            this.rowElements = rowData;
            var html = utils.buildTemplate($("#one-D-view-items-template"), {});

            $el.append(html);

            this.$el = $el.children().last();
            this.el = this.$el[0];
            //no results found
            if (rowData.length <= 0) {
                $(".one-d-no-items-container").show();
                this.trigger('loadComplete');
                this.trigger("noContent");
                this.noItems = true;
                return;
            }

            this.noItems = false;
            this.createShovelerView(rowData);
            this.createButtonView(displayButtonsParam, this.$el);

            this.setCurrentView(this.shovelerView);
        };

       /**
        * Initialize the shoveler subview
        * @param {Object} rowData data for the content items
        */
        this.createShovelerView = function (rowData) {
            // create the shoveler subview
            this.$shovelerContainer = this.$el.children("#one-D-shoveler-container");
            var shovelerView = this.shovelerView = new ShovelerView();
            this.shovelerView.render(this.$shovelerContainer, rowData);

            shovelerView.on('exit', function() {
                this.trigger('exit');
            }, this);

            shovelerView.on('select', function(index) {
                this.currSelection = index;
                this.trigger('select', index);
            }, this);

            shovelerView.on('bounce', function(direction) {
                 this.trigger('bounce', direction);
            }, this);

            shovelerView.on('startScroll', function(direction) {
                this.hideExtraData();
                this.trigger('startScroll', direction);
            }, this);

            shovelerView.on('stopScroll', function(index) {
                this.currSelection = index;
                this.showExtraData(index);
                this.trigger('stopScroll', index);
            }, this);

            shovelerView.on('indexChange', function(index) {
                this.currSelection = index;
                this.trigger('indexChange', index);
            }, this);

            shovelerView.on('loadComplete', function() {
                this.trigger('loadComplete');
                this.showExtraData();
             }, this);

           /**
            * Set button view as currently selected
            */
            shovelerView.showAsSelected = function() {
                this.unfadeSelected();
                this.setTransforms();
            };
        };

       /**
        * Create the buttons that will appear under the media content
        */
        this.createButtonView = function (displayButtonsParam) {
            var parentView = this;

            if(!displayButtonsParam) {return;}

            // create and set up the 1D view
            var buttonView = this.buttonView = new ButtonView();

            buttonView.on('exit', function() {
                this.trigger('exit');
            }, this);

            buttonView.showAsSelected = function() {
                parentView.transitionToButtonView();
            };

            buttonView.handleButtonCallback = function() {
                //add button functionality here
                console.log(arguments);
            };

            //Create a buttons array for the buttons you want to add
            var buttonArr = [
                {"id" : "buttonOne", "buttonValue" : "Action B1"},
                {"id" : "buttonTwo", "buttonValue" : "Action B2"}
            ];

            buttonView.render(this.$el.find("#summary-buttons-container"), buttonArr, buttonView.handleButtonCallback);

        };

        /**
        * Externally change the index
        */
        this.changeIndex = function (index) {
            this.shovelerView.setSelectedElement(index);
            this.shovelerView.transitionRow();
            this.shovelerView.trigger("stopScroll", this.shovelerView.currSelection);
        };

       /**
        * Make the shoveler the active view
        */
        this.transitionToShovelerView = function () {
            //change to button view
            this.setCurrentView(this.shovelerView);

            //change opacity of the shoveler
            this.shovelerView.unfadeSelected();

            //set buttons back to static
            if(this.buttonView) {
                this.buttonView.setStaticButton();
            }
        };

       /**
        * Make the buttons the active view
        */
        this.transitionToButtonView = function () {
            //change to button view
            this.setCurrentView(this.buttonView);

            //change opacity of the shoveler
            this.shovelerView.fadeSelected();

            //set default selected button and apply selected style
            this.buttonView.setCurrentSelectedIndex(0);
            this.buttonView.setSelectedButton();
        };

       /**
        * Deselect all sub-items in this view 
        */
        this.transitionToExternalView = function () {
            //change opacity of the shoveler
            this.shovelerView.fadeSelected();

            this.shrinkShoveler();

            //set buttons back to static
            if(this.buttonView) {
                this.buttonView.setStaticButton();
            }
        };

       /**
        * Select the appropriate view 
        */
        this.transitionFromExternalView = function () {
            //handle our shoveler view
            if(this.buttonView) {
                this.expandShoveler();
            }
            
            this.currentView.showAsSelected();
        };

       /**
        * Shrink the selected shoveler item for 'out of focus' effect
        */
        this.shrinkShoveler = function () {
            this.shovelerView.shrinkSelected();
        };

       /**
        * Expand the selected shoveler item for 'in focus' effect
        */
        this.expandShoveler = function () {
            this.shovelerView.setTransforms();
        };

        /**
         * Handle key events
         * @param {event} the keydown event
         */
        this.handleControls = function (e) {
            var dirty = false;
            // pressing play triggers select on the media element
            if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.UP:
                         if(this.currentView !== this.shovelerView) {
                             this.transitionToShovelerView();
                         } 
                         else {
                             this.trigger('bounce', null);
                         }
                         dirty = true;
                         break;
                    case buttons.DOWN:
                         //handle button view if we have one
                         if(this.buttonView) { //content buttons are visible
                             if(this.currentView !== this.buttonView) {
                                 this.transitionToButtonView();
                             } 
                             else {
                                 this.trigger('bounce', buttons.DOWN);
                             }
                         } 
                         else { //no buttons
                             if(this.currentView === this.shovelerView) {
                                 this.trigger('bounce', buttons.DOWN);
                             }
                         }

                         dirty = true;
                         break;
                }
            }

            //use the dirty flag to make sure we are not handling the
            //event twice - once for this view and once in the child view
            if(!dirty) {
                this.currentView.handleControls(e);
            }
        }.bind(this);

        /**
         * Show summary text in the 1D View
         * @param {Number} index number of current element to show data for
         */
        this.showExtraData = function (index) {
            index = index || 0;

            //add description
            this.$el.find(".one-D-summary-title").html(this.rowElements[index].title);
            this.$el.find(".one-D-summary-description").html(this.rowElements[index].description);
            this.$el.find("#summary-buttons-container").css("visibility", "visible" );
            if (this.rowElements[index].type === "video-live") {
                if (this.rowElements[index].isLiveNow)
                {
                    // add the live icon and replace the pubdate with it in the live case
                    this.$el.find(".one-D-summary-description").html('<div class="one-D-live-icon" ></div>' +
                        '<div>'+ this.rowElements[index].description +'</div>');
                    this.$el.find(".one-D-summary-description").css("margin-top", "-30px");
                }
                else {
                    this.$el.find(".one-D-summary-pubdate").html('<span class = "time-upcoming">' + this.rowElements[index].upcomingTime + '</span>');
                    this.$el.find(".one-D-summary-description").css("margin-top", "");
                }
            }
            else {
                if (this.rowElements[index].pubDate) {
                    this.$el.find(".one-D-summary-pubdate").html(this.rowElements[index].pubDate.toLocaleString());
                }
                this.$el.find(".one-D-summary-description").css("margin-top", "");
            }
        };

        /**
         * Hide the text in the 1D view when scrolling starts
         */
        this.hideExtraData = function () {
            this.$el.find(".one-D-summary-title").text("");
            this.$el.find(".one-D-summary-pubdate").text("");
            this.$el.find(".one-D-summary-description").text("");
            this.$el.find("#summary-buttons-container").css("visibility", "hidden" );
        };
    }

    exports.OneDView = OneDView;
}(window));
