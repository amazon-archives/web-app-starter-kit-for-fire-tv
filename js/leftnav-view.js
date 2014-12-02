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
    var LeftNavView = function () {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['exit', 'deselect', 'indexChange', 'select']);
        
        //global variables
        this.scrollingContainerEle = null;
        this.leftNavContainerEle   = null;
        this.currentSelectionEle   = null;
        this.$menuItems            = [];
        this.currSelectedIndex     = 0;
        this.confirmedSelection    = 0;
        this.isDisplayed           = false;

        //jquery global variables
        this.$el = null;

        //global constants
        this.VERTICAL_MARGINS = 225;

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
            this.$el.css('zIndex', 0);

            //change container to the minified class
            this.leftNavContainerEle.classList.remove('leftnav-menulist-expanded');
            this.leftNavContainerEle.classList.add('leftnav-menulist-minified');

            $("#left-nav-scrolling-list").css('margin-top', '-140px');
        
            //set the chosen item style
            this.setChosenElement(); 

            //set flag to false 
            this.isDisplayed = false;
        };

       /**
        * Show the left-nav overlay that covers the one-d-view
        */
        this.expand = function () {
            this.$el.css('zIndex', 100);

            this.leftNavContainerEle.classList.remove('leftnav-menulist-minified');
            this.leftNavContainerEle.classList.add('leftnav-menulist-expanded');

            $("#left-nav-scrolling-list").css('margin-top', '');

            //set the selected item style
            this.setSelectedElement(); 

            //set flag to true
            this.isDisplayed = true;
        };

       /**
        * Change the style of the selected element to selected 
        * @param {Element} ele currently selected element
        */
        this.setStaticElement = function (ele) {
            ele = ele || this.currentSelectionEle;

            if($(ele).hasClass(CLASS_MENU_ITEM_CHOSEN)) {
                $(ele).removeClass(CLASS_MENU_ITEM_CHOSEN);
            }

            $(ele).addClass(CLASS_MENU_ITEM_SELECTED);
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
        };

        /**
         * Creates the left nav view from the template and appends it to the given element
         * @param {Element} $el the application container
         * @parma {Object} catData category data
         */
        this.render = function ($el, catData) {
            // Build the left nav template and add its
            var html = utils.buildTemplate($("#left-nav-template"), {
                leftNavItems:catData 
            });

            $el.append(html);
            this.$el = $el.children().last();

            this.$menuItems = $(CONTAINER_SCROLLING_LIST).children();
            this.currentSelectionEle   = $(CONTAINER_SCROLLING_LIST).children()[0];
            this.scrollingContainerEle = $(CONTAINER_SCROLLING_LIST)[0];
            this.leftNavContainerEle   = $(CONTAINER_MAIN)[0];

            //set default selected item 
            this.setSelectedElement(this.currentSelectionEle); 
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
            if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.UP:
                        if(this.isDisplayed) {
                            this.setCurrentSelectedIndex(-1);
                        }
                        break;
                    case buttons.DOWN:
                        if(this.isDisplayed) {
                            this.setCurrentSelectedIndex(1);
                        } else {
                            this.setChosenElement();
                            this.trigger('deselect');
                        }
                        break;
                    case buttons.LEFT:
                        this.currSelectedIndex = this.confirmedSelection;
                        this.selectLeftNavItem();
                        this.collapse();
                        this.trigger('deselect');
                        break;
                    case buttons.BACK:
                        this.trigger('exit');
                        break;
                    case buttons.SELECT:
                        if(!this.isDisplayed) {
                            this.expand();
                            break;
                        }
                    case buttons.RIGHT:
                        if(this.confirmedSelection !== this.currSelectedIndex) {
                            // switch the current view state to the main content view
                            this.confirmedSelection = this.currSelectedIndex;
                            this.trigger('select', this.currSelectedIndex);
                        } else {
                            this.collapse();
                            this.trigger('deselect');
                        }
                        break;
                }
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.UP:
                        this.setCurrentSelectedIndex(-1);
                        break;
                    case buttons.DOWN:
                        this.setCurrentSelectedIndex(1);
                        break;
                }
           }

        }.bind(this);

       /**
        * Set the index of the currently selected item 
        * @param {number} direction to move the left nav
        */
        this.setCurrentSelectedIndex = function(direction) {
            if ((direction > 0 && this.currSelectedIndex !== (this.$menuItems.length - 1)) || (direction < 0 && this.currSelectedIndex !== 0)) {
                this.currSelectedIndex += direction;
                this.selectLeftNavItem();
            }
        };

       /**
        * Moves the left nav selection in a direction, 1 is down, -1 is up
        */
        this.selectLeftNavItem = function () {
                // update the left nav to the current selection and run the selection animation
                $(this.currentSelectionEle).removeClass(CLASS_MENU_ITEM_SELECTED);

                this.currentSelectionEle = this.$menuItems[this.currSelectedIndex];
                this.setSelectedElement(this.currentSelectionEle); 

                //shift the nav as selection changes - 54 is the current bounding rect of the nav item
                var translateHeight = 0 - (100 * this.currSelectedIndex);
                this.scrollingContainerEle.style.webkitTransform = "translateY(" + translateHeight + "px)";

                //shade the elements farther away from the selection
                this.trigger('indexChange', this.currSelectedIndex);
        };

    };

    exports.LeftNavView = LeftNavView;
}(window));
