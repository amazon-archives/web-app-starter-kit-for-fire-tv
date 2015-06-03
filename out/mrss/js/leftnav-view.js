/* Left Nav View
 *
 * Handles the display of main selectable categories on the
 * left side of the screen
 * 
 */
(function (exports) {
    "use strict";

    //gloabl constants
    var CONTAINER_SCROLLING_LIST    = "#left-nav-scrolling-list",
        
        CONTAINER_MAIN              = "#left-nav-list-container",
        
        CLASS_MENU_ITEM_SELECTED    = "leftnav-list-item-selected",

        CLASS_MENU_ITEM_HIGHLIGHTED = "leftnav-list-item-highlighted",

        CLASS_MENU_ITEM_CHOSEN      = "leftnav-list-item-chosen";

   /**
    * @class LeftNavView
    * @description The left nav view object, this handles everything about the left nav menu.
    */
    function LeftNavView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'deselect', 'indexChange', 'select', 'makeActive', 'loadComplete']);
        
        this.scrollingContainerEle = null;
        this.leftNavContainerEle   = null;
        this.currentSelectionEle   = null;
        this.translateAmount       = null;
        this.currSelectedIndex     = 0;
        this.confirmedSelection    = 0;
        this.isDisplayed           = false;
        this.leftNavItems          = [];
        this.searchUpdated         = false;
        this.transformStyle = utils.vendorPrefix('Transform');

        //jquery variables
        this.$el = null;
        this.$menuItems            = [];

        this.fadeOut = function() {
            this.$el.fadeOut();
        };

        this.fadeIn = function() {
            this.$el.fadeIn();
        };
        
       /**
        * Hides the left nav view
        */
        this.hide = function () {
            this.$el.hide();
        };

        /**
         * Display the left nav view
         */
        this.show = function () {
            this.$el.show();
        };

       /**
        * Hide the left-nav overlay that covers the one-d-view
        */
        this.collapse = function () {
            //change container to the collapsed class
            this.leftNavContainerEle.classList.remove('leftnav-menulist-expanded');
            this.leftNavContainerEle.classList.add('leftnav-menulist-collapsed');

            //set the chosen item style
            this.setChosenElement(); 

            //set flag to false 
            this.isDisplayed = false;
            if (typeof this.leftNavItems[this.currSelectedIndex] === "object") {
                this.leftNavItems[this.currSelectedIndex].deselect();
            }
        };

       /**
        * Show the left-nav overlay that covers the one-d-view
        */
        this.expand = function () {
            this.leftNavContainerEle.classList.remove('leftnav-menulist-collapsed');
            this.leftNavContainerEle.classList.add('leftnav-menulist-expanded');

            //set the selected item style
            this.setSelectedElement(); 

            //set flag to true
            this.isDisplayed = true;
            
            if (typeof this.leftNavItems[this.currSelectedIndex] === "object") {
                // this is a hack for dealing with selecting the input box, we need to wait for it to appear
                // TODO: Find out why this is and get a better solution.
                setTimeout(this.leftNavItems[this.currSelectedIndex].select, 200);
            }
        };

       /**
        * Change the style of the selected element to selected 
        * @param {Element} ele currently selected element
        */
        this.setSelectedElement = function (ele) {
            ele = ele || this.currentSelectionEle;

            //remove chosen class if it's there
            if($(ele).hasClass(CLASS_MENU_ITEM_CHOSEN)) {
                $(ele).removeClass(CLASS_MENU_ITEM_CHOSEN);
            }

            //remove highlighted class if it's there
            var highlightedEle = $("." + CLASS_MENU_ITEM_HIGHLIGHTED);
            if(highlightedEle) {
                highlightedEle.removeClass(CLASS_MENU_ITEM_HIGHLIGHTED);
                this.leftNavContainerEle.classList.remove('leftnav-collapsed-highlight');
            }

            $(ele).addClass(CLASS_MENU_ITEM_SELECTED);
        };

       /**
        * Change the style of the selected element to chosen
        * @param {Element} ele currently selected element
        */
        this.setChosenElement = function (ele) {
            ele = ele || this.currentSelectionEle;

            if($(ele).hasClass(CLASS_MENU_ITEM_SELECTED)) {
                $(ele).removeClass(CLASS_MENU_ITEM_SELECTED);
            } else if($(ele).hasClass(CLASS_MENU_ITEM_HIGHLIGHTED)) {
                $(ele).removeClass(CLASS_MENU_ITEM_HIGHLIGHTED);
                this.leftNavContainerEle.classList.remove('leftnav-collapsed-highlight');

            }
            $(ele).addClass(CLASS_MENU_ITEM_CHOSEN);
        };

       /**
        * Change the style of the current left nav element to show it hightlight
        * before the user must select to view the other menu items in the list
        * @param {Element} ele currently selected element
        */
        this.setHighlightedElement = function (ele) {
            ele = ele || this.currentSelectionEle;

            $(ele).removeClass(CLASS_MENU_ITEM_CHOSEN);
            $(ele).addClass(CLASS_MENU_ITEM_HIGHLIGHTED);
            this.leftNavContainerEle.classList.add('leftnav-collapsed-highlight');
        };

       /**
        * Handle touch-selection of an item
        */
        this.handleListItemSelection = function(e) {
            if(!this.isDisplayed) {
                this.trigger('makeActive');
            } else {
                this.setCurrentSelectedIndex($(e.target).parent().index());
                this.confirmNavSelection();
           }
        }.bind(this); 

        /**
         * Creates the left nav view from the template and appends it to the given element
         * @param {Element} $el the application container
         * @param {Array} catData category data
         * @param {integer} startIndex initial item to select
         */
        this.render = function ($el, catData, startIndex) {
            this.leftNavItems = catData;
            var leftNavStrings = [];
            for (var i = 0; i < catData.length; i++) {
                if (typeof catData[i] === "string") {
                    leftNavStrings.push(catData[i]);
                } else {
                    leftNavStrings.push("");
                }
            }
            var html = utils.buildTemplate($("#left-nav-template"), {
                leftNavItems:leftNavStrings 
            });
            $el.append(html);
            this.$el = $el.children().last();
            this.$menuItems = $(CONTAINER_SCROLLING_LIST).children();
            for (i = 0; i < catData.length; i++) {
                if (typeof catData[i] === "object") {
                    catData[i].render(this.$menuItems.eq(i));   
                }
            }

            this.currSelectedIndex     = startIndex;
            this.confirmedSelection    = startIndex;
            this.currentSelectionEle   = this.$menuItems.eq(this.currSelectedIndex).children()[0];
            this.scrollingContainerEle = $(CONTAINER_SCROLLING_LIST)[0];
            this.leftNavContainerEle   = $(CONTAINER_MAIN)[0];

            //set default selected item 
            this.setSelectedElement(this.currentSelectionEle); 
            
            this.shiftNavScrollContainer();
            
            //register touch handlers for the left-nav items
            touches.registerTouchHandler("leftnav-list-item-static", this.handleListItemSelection);

            this.collapse();

            //send loadComplete event
            this.trigger('loadComplete');
        };


       /**
        * Key event handler
        * handles controls: LEFT : Return to last category 
        *                   RIGHT: Load new category and hide nav 
        *                   UP: Move selection up 
        *                   DOWN: Move selection down 
        *                   BACK: Exit app
        * @param {event} the keydown event
        */
        this.handleControls = function (e) {
            if (e.type === 'swipe') {
                if(!this.isDisplayed) { return; }
                if(e.keyCode === touches.DOWN) {
                    this.incrementCurrentSelectedIndex(-1);
                } else if(e.keyCode === touches.UP) {
                    this.incrementCurrentSelectedIndex(1);
                }
            } else if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.UP:
                        if(this.isDisplayed) {
                            this.incrementCurrentSelectedIndex(-1);
                        }
                        break;
                    case buttons.DOWN:
                        if(this.isDisplayed) {
                            this.incrementCurrentSelectedIndex(1);
                        } else {
                            this.setChosenElement();
                            this.trigger('deselect');
                        }
                        break;
                    case buttons.LEFT:
                    case buttons.BACK:
                        this.currSelectedIndex = this.confirmedSelection;
                        this.selectLeftNavItem();
                        this.collapse();
                        this.trigger('deselect');
                        break;
                    case buttons.SELECT:
                        if(!this.isDisplayed) {
                            this.expand();
                            break;
                        }
                        this.confirmNavSelection();
                        break;
                    case buttons.RIGHT:
                        this.confirmNavSelection();
                        break;
                }
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.UP:
                        if(this.isDisplayed) {
                            this.incrementCurrentSelectedIndex(-1);
                        }
                        break;
                    case buttons.DOWN:
                        if(this.isDisplayed) {
                            this.incrementCurrentSelectedIndex(1);
                        }
                        break;
                }
           }

        }.bind(this);

       /**
        * Increment the index of the currently selected item 
        * relative to the last selected index.
        * @param {number} direction to move the left nav
        */
        this.incrementCurrentSelectedIndex = function(direction) {
            if ((direction > 0 && this.currSelectedIndex !== (this.$menuItems.length - 1)) || (direction < 0 && this.currSelectedIndex !== 0)) {
                this.currSelectedIndex += direction;
                this.selectLeftNavItem();
            }
        };

       /**
        * Explicity set the current selected index
        * @param {Number} index the index of the item
        */
        this.setCurrentSelectedIndex = function(index) {
            this.currSelectedIndex = index;
            this.selectLeftNavItem();
        };

       /**
        * If the selection has changed update the category,
        * otherwise just deselect the left-nav menu
        */
        this.confirmNavSelection = function() {
            if(this.confirmedSelection !== this.currSelectedIndex) {
                // switch the current view state to the main content view
                var isObject = typeof this.leftNavItems[this.currSelectedIndex] === "object"; 
                var emptySearch = isObject && (this.leftNavItems[this.currSelectedIndex].currentSearchQuery === null || this.leftNavItems[this.currSelectedIndex].currentSearchQuery.length === 0);
                if (emptySearch) {
                    return;
                }
                this.confirmedSelection = this.currSelectedIndex;
                this.trigger('select', this.currSelectedIndex);
            } 
            else if (this.searchUpdated) {
                this.trigger('select', this.currSelectedIndex);   
            }
            else {
                this.trigger('deselect');
            }   
        };

       /**
        * Moves the left nav selection in a direction, 1 is down, -1 is up
        */
        this.selectLeftNavItem = function () {
            // update the left nav to the current selection and run the selection animation
            $(this.currentSelectionEle).removeClass(CLASS_MENU_ITEM_SELECTED);

            this.currentSelectionEle = this.$menuItems.eq(this.currSelectedIndex).children()[0];
            this.setSelectedElement(this.currentSelectionEle); 

            this.shiftNavScrollContainer();

            //shade the elements farther away from the selection
            this.trigger('indexChange', this.currSelectedIndex);
        };

       /**
        * Move the nav container as new items are selected
        */
        this.shiftNavScrollContainer = function() {
            if(!this.translateAmount) {
                this.translateAmount = this.currentSelectionEle.getBoundingClientRect().height + 2;
            }

            //shift the nav as selection changes
            var translateHeight = 0 - (this.translateAmount * this.currSelectedIndex);
            this.scrollingContainerEle.style.webkitTransform = "translateY(" + translateHeight + "px)";
        };

    }

    exports.LeftNavView = LeftNavView;
}(window));
