/* Shoveler View 
 *
 * Handles the "shoveler" which is a right-to-left carousel view with endpoints on both sides
 * 
 */

(function (exports) {
    "use strict";

     var SHOVELER_ROW_ITEM_SELECTED = "shoveler-rowitem-selected";

    /**
     * @class ShovelerView
     * @description The shoveler view object, this handles everything about the shoveler.
     */
    function ShovelerView() {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['loadComplete', 'exit', 'bounce', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce']);

        //global variables
        this.currSelection = 0;
        this.elementWidths = [];
        this.isScrolling = false;
        this.currScrollDirection = null;
        this.loadingImages = 0;

        //global jquery variables 
        this.$parentEle = null;
        this.$el = null;
        this.$rowElements = null;
        this.rowsData = null;

        //constants
        this.MARGIN_WIDTH = 40;
        this.STARTING_SIZE = 216;
        this.transformStyle = utils.vendorPrefix('Transform');

        this.fadeOut = function() {
            this.$el.css("visibility", "hidden");
        };

        this.fadeIn = function() {
            this.$el.css("visibility", "");
        };

        /**
         * Removes the main content view dom
         */
        this.remove = function () {
            // remove this element from the dom
            this.$el.remove();
        };

        /**
         * Hides the shoveler view
         */
        this.hide = function () {
            this.$el.css("visibility", "hidden");
        };

        /**
         * Shows the shoveler view
         */
        this.show = function () {
            this.$el.css("visibility", "");
        };

       /**
        * Touch handler for content items
        * @param {Event} e
        */
        this.handleContentItemSelection = function(e) {
            var targetIndex = $(e.target).parent().index();

            if(targetIndex === this.currSelection) {
                this.trigger('select', this.currSelection);
            } else {
                //set current selected item 
                this.setSelectedElement(targetIndex);

                this.transitionRow();
                
                this.trigger("stopScroll", this.currSelection);
            }
        }.bind(this);

        /**
         * Creates the shoveler view and appends it to the one-d-view shoveler container
         * @param {Element} el one-d-view container
         * @param {Object} row the the data for the row
         */
        this.render = function (el, row) {
            this.parentContainer = el;
            // Build the main content template and add it
            this.titleText = row.title;
            var html = utils.buildTemplate($("#shoveler-template"), {
                items: row
            });

            this.rowsData = row;
            el.append(html);
            this.$el = el.children().last();

            //hide the element until we are done with layout
            this.$el.css('opacity', "0");

            // select the first element
            this.$rowElements = this.$el.children();

            //gather widths of all the row elements
            this.initialLayout();

            //register touch handlers for items 
            touches.registerTouchHandler("shoveler-full-img", this.handleContentItemSelection);

            this.on("stopScroll", this.finalizeSelection);
            this.on("startScroll", this.prepareSelectionForAnimation);
        };

       /**
        * Performs the initial layout of the elements of the row
        */
        this.initialLayout = function () {
            // compute all widths
            this.transformLimit = this.$el.width() + 300;
            this.limitTransforms = false;

            for (var i = 0; i < this.$rowElements.length; i++) {
                var $currElt = $(this.$rowElements[i]);
                var $currImage = $currElt.children("img.shoveler-full-img");
                if ($currImage.length === 0) {
                     $currElt.prepend('<img class = "shoveler-full-img" src="'+ this.rowsData[i].imgURL + '" style="opacity:0"/>');
                     $currImage = $currElt.children("img.shoveler-full-img");
                }

                //set a callback to make sure all images are loaded 
                (function($elt, $currImage) {
                    $currImage.on("load", function () {
                        $elt.children("img.shoveler-full-img")[0].style.opacity = "";
                        this.relayoutOnLoadedImages();
                    }.bind(this));
                    // handle error case for loading screen
                    $currImage.on("error", function () {
                        $elt.children("img.shoveler-full-img")[0].style.opacity = "";
                        this.relayoutOnLoadedImages();
                    }.bind(this));
                }.bind(this))($currElt, $currImage);

                this.loadingImages++;
            }
        };

       /**
        * Performs secondary layout of the elements of the row, after images load for the first time
        */
        this.layoutElements = function () {

            for (var i = 0; i < this.$rowElements.length; i++) {
                var $currElt = $(this.$rowElements[i]);
                this.elementWidths[i] = $currElt.width();

                if ($currElt.children("img.shoveler-full-img").length > 0) {
                     $currElt.children("img.shoveler-full-img")[0].style.opacity = "";
                }
            }

            this.setTransforms(0);

            window.setTimeout(function() {
                this.$rowElements.css("transition", "");
                this.limitTransforms = true;
                this.finalizeRender();
            }.bind(this), 500);
        };

       /**
        * Images are loaded and positioned so display the shoveler
        * and send our 'loadComplete' event to stop the spinner
        */
        this.finalizeRender = function () {
            this.$el.css('opacity', ''); 
            this.trigger('loadComplete');
        };

        /**
         * Callback Function to reposition the images from the placeholder positions once they load
         */
        this.relayoutOnLoadedImages = function () {
            if (--this.loadingImages === 0) {
                this.layoutElements();
                // finalize selection on the first element in the shoveler
                this.finalizeSelection(0);
            }
        };

       /**
        * Move the shoveler in either left or right direction
        * @param {Number} dir the direction of the move
        */
        this.shovelMove = function (dir) {
            this.trigger("startScroll", dir);
            this.selectRowElement(dir);
        }.bind(this);

        /**
         * Handles controls: LEFT: Move to main content if first element, otherwise select previous element 
         *                                RIGHT: Select next element 
         *                                UP: Return to main content view 
         *                                DOWN: Nothing at the moment 
         *                                BACK:Back to leftNav State 
         * @param {event} the keydown event
         */
        this.handleControls = function (e) {
            if (e.type === 'touch') {
                //do nothing for now
            } else if (e.type === 'swipe') {
                if(e.keyCode === buttons.RIGHT) {
                    if(this.currSelection !== 0) {
                        this.shovelMove(-1);
                        //stop scroll immediately - swipe only increments 1 right now
                        this.trigger("stopScroll", this.currSelection);
                    } else {
                        this.trigger('bounce', e.keyCode);
                    }
                 } else if(e.keyCode === buttons.LEFT) {
                    if(this.currSelection < this.rowsData.length) {
                         this.shovelMove(1);
                         //stop scroll immediately - swipe only increments 1 right now
                          this.trigger("stopScroll", this.currSelection);
                     } else {
                         this.trigger('bounce', e.keyCode);
                     }
                }
            } else if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.SELECT:
                    case buttons.PLAY_PAUSE:
                        this.trigger('select', this.currSelection);
                        break;

                    case buttons.BACK:
                        this.trigger("exit");
                        break;

                    case buttons.UP:
                    case buttons.DOWN:
                        this.trigger("bounce");
                        break;

                    case buttons.LEFT:
                        if(this.currSelection !== 0) {
                            this.shovelMove(-1);
                        } else {
                            this.trigger('bounce', e.keyCode);
                        }

                        break;

                    case buttons.RIGHT:
                        if(this.currSelection < this.rowsData.length) {
                             this.shovelMove(1);
                        } else {
                            this.trigger('bounce', e.keyCode);
                        }
                        break;
                }
            } else if (e.type === 'buttonrepeat') {
                switch (e.keyCode) {
                    case buttons.LEFT:
                        this.selectRowElement(-1);
                        break;

                    case buttons.RIGHT:
                        this.selectRowElement(1);
                        break;
                }
            } else if (e.type === 'buttonrelease') {
                switch (e.keyCode) {
                    case buttons.LEFT:
                    case buttons.RIGHT:
                        this.trigger("stopScroll", this.currSelection);


                        break;
                }
            }
        }.bind(this);

        /**
         * Does any necessary changes before the scrolling animation begins
         */
        this.prepareSelectionForAnimation = function() {
            // remove drop shadow and z-index before moving to speed up FPS on animation
            $(this.$rowElements[this.currSelection]).find(".shoveler-full-img").removeClass(SHOVELER_ROW_ITEM_SELECTED);
            $(this.$rowElements[this.currSelection]).css("z-index", "");
        }.bind(this);

        /**
         * Does all final element necessary changes once the selection is finalized by user input(ie stop scrolling completely)
         * @param {number} the currently selected index.
         */
        this.finalizeSelection = function(currSelection) {
            // add drop shadow to inner image
            $(this.$rowElements[currSelection]).find(".shoveler-full-img").addClass(SHOVELER_ROW_ITEM_SELECTED);
            // raise the outermost selected element div for the drop shadow to look right
            $(this.$rowElements[currSelection]).css("z-index", "100");
        }.bind(this);

        /**
         * Moves the row element to the right or left based on the direction given to it
         * @param {number} the direction to scroll, 1 is  right, -1 is left
         */
        this.selectRowElement = function (direction) {

            if ((direction > 0 && (this.$rowElements.length - 1) === this.currSelection) || 
                (direction < 0 && this.currSelection === 0 )) {
                return false;
            }

            this.currSelection += direction;

            this.transitionRow();

            return true;
        }.bind(this);

       /**
        * This will manage the transition of the newly 
        * selected item to the currently selected item
        */
        this.transitionRow = function() {
            window.requestAnimationFrame(function(){
                this.setTransforms(this.currSelection);
            }.bind(this));

            this.trigger('indexChange', this.currSelection);
        }.bind(this);

       /**
        * Explicitly set the selected element using the index
        * @param {Number} index the index of the content element
        */
        this.setSelectedElement = function (index) {
            this.currSelection = index;
        }.bind(this);

       /**
        * Set properties for the currently selected element
        * @param {Element} selectedEle they currently selected element
        */
        this.manageSelectedElement = function (selectedEle) {
            selectedEle.style[this.transformStyle] = "translate3d(0, 0, 0)";
            selectedEle.style.opacity = "0.99";
        };

       /**
        * Take down the opacity of the selected while in another view
        */
        this.fadeSelected = function () {
            this.$rowElements[this.currSelection].style.opacity = "0.5";
        };

       /**
        * Set back to full opacity when in the shoveler/oneD view 
        */
        this.unfadeSelected = function () {
            this.$rowElements[this.currSelection].style.opacity = "0.99";
        };

       /**
        * Shrink all the elements to the same size while the shoveler is not in focus
        */
        this.shrinkSelected = function () {
            this.setRightItemPositions(this.currSelection, 0);
            this.setLeftItemPositions(this.currSelection - 1, 0 - this.MARGIN_WIDTH);
        };

       /**
        * Set the positions of all elements to the right of the selected item
        * @param {Number} start the starting index
        * @param {Number} currX the current X position
        */
        this.setRightItemPositions = function (start, currX) {
            var i;

            //this for loop handles elements to the right of the selected element
            for (i = start; i < this.$rowElements.length; i++) {
                if (this.elementWidths[i] > 0) {
                    this.$rowElements[i].style[this.transformStyle] = "translate3d(" + currX + "px,0,0px) scale(0.75)";
                    this.$rowElements[i].style.opacity = "0.5";
                } else {
                    //keep element offscreen if we have no width yet
                    this.$rowElements[i].style[this.transformStyle] = "translate3d("+ this.transformLimit +" +px,0,0px)";
                }

                if (currX > this.transformLimit) {
                    if (this.limitTransforms) {
                        break;
                    }
                } else {
                    currX += Math.round(this.elementWidths[i] * 0.75 + this.MARGIN_WIDTH);
                }
            }
        };

       /**
        * Set the positions of all elements to the left of the selected item
        * @param {Number} start the starting index
        * @param {Number} currX the current X position
        */
        this.setLeftItemPositions = function (start, currX) {
            var i;

            for (i = start; i >= 0; i--) {
                var currPosition = (currX - this.elementWidths[i] * 0.75);
                var itemTrans = "translate3d(" + currPosition + "px,0, 0px) scale(0.75)";

                if (this.elementWidths[i] > 0) {
                    this.$rowElements[i].style[this.transformStyle] = itemTrans;
                    this.$rowElements[i].style.opacity = "0.5";
                } else {
                    //keep element offscreen if we have no width yet
                    this.$rowElements[i].style[this.transformStyle] = "translate3d("+ (-this.transformLimit) + "px,0,0px)";
                    this.$rowElements[i].style.display = "none";
                }

                if (currX < -this.transformLimit + 1000) {
                    if (this.limitTransforms) {
                        break;
                    }
                } else {
                    currX -= Math.round(this.elementWidths[i] * 0.75 + this.MARGIN_WIDTH);
                }
            }
        };

       /**
        * This is the method that transitions the element in the row
        * @param {Number} selected the index of the currently selected item
        */
        this.setTransforms = function (selected) {
            var currX = 0;
            selected = selected || this.currSelection;
            
            //set selected element properties
            this.manageSelectedElement(this.$rowElements[selected]);

            this.setLeftItemPositions(selected - 1, currX);

            currX = Math.round(this.elementWidths[selected]);

            this.setRightItemPositions(selected + 1, currX);
        }.bind(this);
    }

    exports.ShovelerView = ShovelerView;
}(window));
