/* 
 *
 * Handles IAP Entitlement (purchase) logic and UI 
 * 
 */

(function (exports) {
    "use strict";

    // {Object} are the user-defined settings from the index page
    function EntitlementView() {
       // mixin inheritance, initialize this as an event handler for these events:
       Events.call(this, ['exit', 'revoke', 'select']);

       //variables
       this.$parentContainer = null;
       this.currSelection = null;
       this.dialogOpen    = false;

       //jquery variables
       this.$buttons = [];

       //constants
       this.BUTTON_PURCHASED_MESSAGE = "Purchased";
       this.BUTTON_ID_PREFIX = "entitlementButton_";
       this.THUMB_ID_PREFIX  = "entitlementThumb_";

    /**************************
     *
     * UI Methods 
     *
     *************************/
      /**
       * Initialized the view from the template and appends it to the given element
       * @param {Element} $el the application container
       */
        this.render = function ($el) {
           // Build the button template 
           var html = utils.buildTemplate($("#purchase-button-template"), {});

           this.$parentContainer = $el;
           this.$parentContainer.append(html);
        };

       /**
        * Renders the available purchase items into the dialog and sets
        * any defaults (i.e. select the first button item)
        * @param {Object} data IAP available items purchase data
        */
        this.renderDialog = function (data) {
            //first create the array that will populate the handlebars template
            var itemsArr = [], item;

            //add default background first
            itemsArr.push(defaultTheme);

            for(var s=0; s<state.entitlementInfo.length; s++) {

                item = data.itemData[state.entitlementInfo[s][0]];
                item.thumbId = this.THUMB_ID_PREFIX + s; 
                item.buttonId = this.BUTTON_ID_PREFIX + s; 
                item.message = state.entitlementInfo[s][2];

                if(!state.entitlementInfo[s][1]) { //not purchased
                    item.showLock = true;
                } 
                else { //purchased
                    item.price = this.BUTTON_PURCHASED_MESSAGE;
                    item.showLock = false;
                }
                itemsArr.push(item);
            }

            // Build the left nav template and add its
            var html = utils.buildTemplate($("#purchase-view-template"), {
                items : itemsArr
            });

            this.$parentContainer.append(html);
            this.$el = this.$parentContainer.children().last();
            this.$buttons = this.$el.find(".dialog-button");

            this.displayDialog();

            touches.registerTouchHandler("detail-item-button-static", this.handleButtonTap);
        };

       /**
        * Update the IAP dialog UI when a purchase is made
        */
        this.updateDialog = function(){
            var entitlements = state.entitlementInfo;

            for(var b=0; b<this.$buttons.length; b++) {
                var btn = this.$buttons[b];
                var sku = btn.getAttribute('data-sku');

                for(var e=0; e<entitlements.length; e++) {
                    if(entitlements[e][0] === sku) {
                        if(entitlements[e][1] === true) {
                            //get id of the button to get corresponding thumb
                            var $imgThumb = $("#" + this.getButtonMatchingThumb(btn));

                            //reset the lock attribute
                            $imgThumb.find(".img-bg-thumb").attr("data-lock", null);

                            $(btn).find(".dialog-entitlement-price").html(this.BUTTON_PURCHASED_MESSAGE);
                        }
                    }
                }
            }
        };

       /**
        * Deselect the "Upgrades" button that launches the IAP purchase dialog
        */
        this.deselectButton = function() {
            $("#btnPurchase").removeClass("detail-item-button-selected").addClass("detail-item-button-static");
        };

       /**
        * Select the "Upgrades" button that launches the IAP purchase dialog
        */
        this.highlightButton = function() {
            $("#btnPurchase").removeClass("detail-item-button-static").addClass("detail-item-button-selected");
        };

       /**
        * Highlight the selected dialog button 
        */
        this.highlightDialogButton = function(btn) {
            //first make sure we don't have a button already highlighted
            this.deselectDialogButton();

            $(btn).addClass("dialog-button-highlight");
        };

       /**
        * Remove the highlight class selector from the previously selected button
        */
        this.deselectDialogButton = function() {
            $(".dialog-button-highlight").removeClass("dialog-button-highlight");
        };

       /**
        * Get the thumbnail that goes with the highlighted button
        * @param {Element} button 
        */
        this.getButtonMatchingThumb = function(button) {
            return button.getAttribute('data-thumbnail');
        };

       /**
        * Set the UI for the currently-selected item
        */
        this.selectCurrentDialogItem = function() {
            var selectedButton = this.$buttons[this.currSelection];
            var imgThumb = this.getButtonMatchingThumb(selectedButton);

            //change the currently shown thumb
            $(".img-thumb-container-display").removeClass('img-thumb-container-display');
            $("#"+imgThumb).addClass('img-thumb-container-display');

            this.highlightDialogButton(selectedButton);
        };

       /**
        * Display the Entitlement options dialog 
        */
        this.displayDialog = function() {
            $("#purchase-dialog").css('display', 'block');

            //set flag that we are in the dialog
            this.dialogOpen = true;

            //select the first button
            this.currSelection = 0;

            //highlight the button
            this.selectCurrentDialogItem();

        }.bind(this);

       /**
        * Close the Entitlement options dialog
        */
        this.closeDialog = function() {
            $("#purchase-dialog").remove();
            this.currSelection = null;
            this.dialogOpen = false;
        };

       /**
        * Change the currently selected entitlement button
        * @param {Number} dir the increment/decrement of the selection
        */
        this.setSelectedItem = function(dir) {
            this.currSelection += dir; 
        };

       /**
        * Handle entitlement button press
        */
        this.handleButtonPress = function() {
            var curButton = this.$buttons[this.currSelection];

            var sku = curButton.getAttribute('data-sku');
            if(!this.hasEntitlement(sku)){
                this.purchaseItem(sku);
            } 
            else {
                //persist theme
                state.selectedBackground = sku;
                this.persistPageState();
                this.applyTheme();
            }
        };

       /**
        * Handle events in this view
        * @param {Event} e
        */
        this.handleControls = function (e) {
            if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.SELECT:
                        if(!this.dialogOpen) {
                            this.upgradeButtonPressed();
                        } 
                        else {
                            this.handleButtonPress();
                        }
                        break;
                    case buttons.DOWN:
                        //set currently selected item
                        if(this.currSelection < this.$buttons.length - 1) {
                            this.setSelectedItem(+1);
                            this.selectCurrentDialogItem();
                        }
                        break;
                    case buttons.UP:
                        if(!this.dialogOpen) {
                            this.deselectButton();
                            this.trigger('exit');
                        } 
                        else {
                            if(this.currSelection > 0) {
                                this.setSelectedItem(-1);
                                this.selectCurrentDialogItem();
                            }
                        }
                        break;
                    case buttons.BACK:
                        if(this.dialogOpen) {
                            this.closeDialog();
                        } 
                        else {
                            this.deselectButton();
                            this.trigger('exit');
                        }
                        break;
                }
            }
        }.bind(this);

        /**************************
        *
        * IAP Methods 
        *
        *************************/
        var upgradeButtonPressed = false;
        var purchaseItemButtonPressed = false;
        var defaultTheme  = {
           "sku" : "sample.theme.default", 
           "title" : "Default Theme", 
           "price" : "", 
           "buttonId" : "button_default",
           "thumbId" : "thumb_default",
           "description" : "Apply default theme", 
           "smallIconUrl" : "./assets/sample.theme.default.jpg", 
           "message" : "Default Background", 
           "showLock" : false
        };

        //Global state data about our purchasable items. These are related to the information
        //that will be returned from IAP, with the exact same skus
        var state = {
            entitlementInfo: [["sample.theme.red", false, "Autumn Red", "bg_app_red.jpg"],
                              ["sample.theme.blue", false, "Blue Sky", "bg_app_blue.jpg"],
                              ["sample.theme.green", false, "Fresh Grass Green", "bg_app_green.jpg"]],
            selectedBackground : defaultTheme.sku,
            lastPurchaseCheckTime: null,
            revokedSKUs : []
        };

       /**
        * Handle updating of the UI
        */
        this.refreshPageState = function(){
            if(this.dialogOpen){
                this.updateDialog();
                this.applyTheme();
            }
            this.persistPageState();
        };

       /**
        * Saves the state to localStorage so the next time the app
        * runs it's the same as it was last run. Most important
        * is remembering the IAP status including the lastPurchaseCheckTime
        * which is passed to getPurchaseUpdates.
        **/
        this.persistPageState = function() {
            localStorage.setItem("state-iap-entitlement", JSON.stringify(state));
        };

       /**
        * Restore the state from localStorage
        */
        this.loadPageState = function() {
            if(localStorage.getItem("state-iap-entitlement")) {
                var storedState = localStorage.getItem("state-iap-entitlement");
                state = JSON.parse(storedState);
                if(state.selectedBackground) {
                    this.applyTheme();
                }
            }
        };

       /**
        * Handle an upgrade button press
        */
        this.upgradeButtonPressed = function() {
            upgradeButtonPressed = true;
            amzn_wa.IAP.getItemData(this.getThemeSkus());
            this.refreshPageState();
        };

       /**
        * Get the skus for each of the entitlement items
        */
        this.getThemeSkus = function() {
            var theme_skus = [];
            for (var i=0; i < state.entitlementInfo.length; i++){
                theme_skus.push(state.entitlementInfo[i][0]);
            }
            return theme_skus;
        };

       /**
        * Check to see if the item for a particular sku has and entitlement
        */
        this.hasEntitlement = function(sku){
            
            //first check for the default theme
            if(sku === defaultTheme.sku) { return true; }

            for (var i=0; i < state.entitlementInfo.length; i++){
                if(sku === state.entitlementInfo[i][0]){
                    return state.entitlementInfo[i][1];
                }
            }
            return false;
        };

       /**
        * Set all the entitlments to false before we get the values back from iap 
        */
        this.resetEntitlement = function(){
            for (var i=0; i < state.entitlementInfo.length; i++){
                 state.entitlementInfo[i][1] = false;
            }
        };

       /**
        * Apply the selected theme
        */
        this.applyTheme = function(){

            //first check for default
            if(state.selectedBackground === defaultTheme.sku) {
                document.body.style.backgroundImage = "";
            } 
            else {

                for(var s=0; s<state.entitlementInfo.length; s++) {
                    if(state.entitlementInfo[s][0] === state.selectedBackground) {
                        //make sure we own the image
                        if(state.entitlementInfo[s][1]) {
                            var bgImg = "./assets/" + state.entitlementInfo[s][3]; 
                            document.body.style.backgroundImage = "url(" + bgImg + ")";
                        }
                        break;
                    }
                }
            }
            //close the dialog
            this.closeDialog(); 
        };

        /****************************
         *
         * IAP Handler functions 
         * called from the callbacks
         *
         ****************************/

       /**
        * Purchase response with one receipt
        * @param {Event} e
        */
        this.handleOnPurchaseResponse = function(e) {
           if (e.purchaseRequestStatus === amzn_wa.IAP.PurchaseStatus.SUCCESSFUL) {
               //set the background to the newly purchased background
               state.selectedBackground = e.receipt.sku;
               this.handleReceipt(e.receipt);
           } 
           else if (e.purchaseRequestStatus === amzn_wa.IAP.PurchaseStatus.ALREADY_ENTITLED) {
             // Somehow we are out of sync with the server, let's refresh from the
             // beginning of time.
             amzn_wa.IAP.getPurchaseUpdates(amzn_wa.IAP.Offset.BEGINNING);
           } 
           else if(e.purchaseRequestStatus === amzn_wa.IAP.PurchaseStatus.FAILED){
                if(purchaseItemButtonPressed){
                    alert("We were unable to complete your purchase request");
                } 
                else {
                    console.log("Purchase request from previous session returned a failure response");
                }
           } 
           else if(e.purchaseRequestStatus === amzn_wa.IAP.PurchaseStatus.INVALID_SKU){
             alert("Invalid SKU");
           }
           this.refreshPageState();
        };

       /**
        * Return an array of iap recipts 
        * @param {Event} e
        */
        this.handleOnPurchaseUpdatesResponse = function(e) {
            this.resetEntitlement();
            for (var i = 0; i < e.receipts.length; i++) {
                if (e.purchaseUpdatesRequestStatus === amzn_wa.IAP.PurchaseUpdatesStatus.SUCCESSFUL) {
                    this.handleReceipt(e.receipts[i]);
                } 
                else if(e.purchaseUpdatesRequestStatus === amzn_wa.IAP.PurchaseUpdatesStatus.FAILED){
                    alert("We were unable to complete your purchase request");
                }
           }
           this.refreshPageState();
        };

       /**
        * In either case, the contents of the receipt are handled in the same way
        * @param {Object} receipt iap reciept
        */
        this.handleReceipt = function(receipt) {
            for (var i=0; i < state.entitlementInfo.length; i++){
                if(receipt.sku === state.entitlementInfo[i][0]){
                    state.entitlementInfo[i][1] = true;
                }
            }
        };

       /**
        * Purchase entitlement item
        * @param {String} id item id
        */
        this.purchaseItem = function(id) {
            if (amzn_wa.IAP === null) {
               alert("You cannot buy this button, Amazon In-App-Purchasing works only with Apps from the Appstore.");
            } 
            else {
               amzn_wa.IAP.purchaseItem(id);
            }
        };

       /**
        * Setup for IAP
        */
        this.initialize = function() {
            this.loadPageState();

            //
            //This is only for testing on desktop and only during development
            //This entire 'if' block should be removed in the production application
            //
            if(!navigator.userAgent.match(/AFT/i)) {
                amzn_wa.enableApiTester(amzn_wa_tester);
            }
            this.refreshPageState();

            /*********************************
             *
             * Callback functions for iap
             *
             ********************************/
            /**
             * Production applications should not grant entitlements when they are run in sandbox mode.
             */
            this.onSdkAvailable = function(resp) {
                if (resp.isSandboxMode) {
                    // In a production application this should trigger either
                    // shutting down IAP functionality or redirecting to some
                    // page explaining that you should purchase this application
                    // from the Amazon Appstore.
                    //
                    // Not checking can leave your application in a state that
                    // is vulnerable to attacks. See the supplied documention
                    // for additional information.
                    console.log("Running in test mode");
                }

                // When using IAP it is important to understand responses can come at any time.
                // Your web app could have been shut down prior to a receipt being delivered for instance.
                // The next time your application runs the receipt will be delivered
                // upon initializing the API in this case.
                // You should call getPurchaseUpdates to get any purchases
                // that could have been made in a previous run.
                amzn_wa.IAP.getPurchaseUpdates(state.lastPurchaseCheckTime !== null ?
                state.lastPurchaseCheckTime : amzn_wa.IAP.Offset.BEGINNING);
            };

           /**
            * Called as response to getUserId
            */
            this.onGetUserIdResponse = function() {
                // Provides the app-specific UserID for the user currently logged into the Amazon Client
            };

           /**
            * Called as response to getItemData
            */
            this.onItemDataResponse = function(data) {
                //Called in response to getItemData. data.itemData is a hash table of itemData objects keyed by SKU.
                //An Item represents a purchasable item, and provides information for your storefront.
                //It is a best practice to retrieve the price of the purchasable item and display it prior to having the customer initiate a purchase.
                //The Item class can be used to access the localized price, title, and description strings. The price string will include the currency
                //symbol and be formatted appropriately based on the locale.
                if(upgradeButtonPressed){
                    if(data.itemDataRequestStatus === amzn_wa.IAP.ItemDataStatus.SUCCESSFUL) {
                        this.renderDialog(data);
                    }
                    else if(data.itemDataRequestStatus === amzn_wa.IAP.ItemDataStatus.FAILED) {
                        alert("Failed to fetch items");
                    }
                    else if(data.itemDataRequestStatus === amzn_wa.IAP.ItemDataStatus.SUCCESSFUL_WITH_UNAVAILABLE_SKUS) {
                        alert("Unavailable SKUs");
                    }
                    upgradeButtonPressed = false;
                }

             }.bind(this);

            /**
             * Called as response to puchaseItem
             */
             this.onPurchaseResponse = function(data) {
                 //Called to report the status of a purchase operation. purchaseResponse.purchaseRequestStatus contains the status of the response.
                 //If a prior session of the application shut down before a purchase response could be delivered, this function will be called when
                 // a new session of the application registers a purchase hander.
                 this.handleOnPurchaseResponse(data);
             }.bind(this);

            /**
             * Called as response to getPurchaseUpdates
             */
             this.onPurchaseUpdatesResponse = function(resp) {
                 //Called with the list of entitlements that the user has been granted. data.receipts contains a hash table, keyed on SKU, that contains
                 //the receipts for the IAPs that have been granted to the user. data.revokedSkus has a list of SKUs that the user can no longer use.
                 this.handleOnPurchaseUpdatesResponse(resp);
             }.bind(this);

            document.addEventListener("amazonPlatformReady", function() {

                // Ensure we can call the IAP API
                if (amzn_wa.IAP === null) {
                    console.log("Amazon In-App-Purchasing only works with Apps from the Appstore");
                }
                else {
                    // Registers the appropriate callback functions
                    amzn_wa.IAP.registerObserver({
                        // This gets called when the In-App Purchasing services are ready to be called by your code.
                        //Production applications should not grant entitlements when they are run in sandbox mode.
                        'onSdkAvailable': this.onSdkAvailable,
                        'onGetUserIdResponse': this.onGetUserIdResponse,
                        'onItemDataResponse' : this.onItemDataResponse,
                        'onPurchaseResponse' : this.onPurchaseResponse,
                        'onPurchaseUpdatesResponse':this.onPurchaseUpdatesResponse
                    });
                }
            }.bind(this));
        };

        this.initialize();
    }

    exports.EntitlementView = EntitlementView;

})(window);












