## In App Purchasing
---------------------------
A sample project to integrate Amazon's In App Purchasing(IAP) feature has been included in the Web App Starter Kit . 

'iap-entitlements' is the sample project that has been included in the projects directory. In the 'iap-entitlements' sample project, we demonstrate how to allow customers to purchase items within your app. In this specific sample, we allow customers to change the theme of the app by purchasing a new theme. This will, most likely, not be a scenario that you would use for a video application. But it is meant simply to demonstrate the concept. For example, one can build on this example to allow access to additional categories of videos based on a entitlement purchase.

**Prior to reading the sample implementation, it is important to understand Amazon's In App Purchasing. Currently, we support only version 1.0 of IAP. [Understanding In-App Purchasing for JavaScript API](https://developer.amazon.com/public/solutions/platforms/webapps/docs/understanding.html) is the developer documentation about how IAP works and the JavaScript APIs available to webapp developers.**

To integrate IAP with your webapp, you will need to submit your app as a HTML5 webapp using Amazon's Mobile Distribution Platform. You can find more information on [Submitting or Updating Your Web App to the Amazon Appstore](https://developer.amazon.com/public/solutions/platforms/webapps/docs/submitting.html). Amazon's Mobile App Distribution program enables you to distribute your app as a Packaged HTML5 web app or a Hosted WebApp. To learn about differences between packaged apps and hosted apps refer to [Difference between Packaged and Hosted Apps](https://developer.amazon.com/public/solutions/platforms/webapps/docs/differences-between-packaged-and-hosted-apps).  Before you submit your app to the Amazon Appstore, submit your consumable, entitlement, and/or subscription items that will be available for in-app purchases. Follow the instructions highlighted in [Submitting Your App and In-App Items](https://developer.amazon.com/public/apis/earn/in-app-purchasing/docs-v2/submitting-copy).

** Set Up **

In order to test the 'iap-entitlements' project you will need the following set up:

1. Build the 'iap-entitlements' project using 'gulp build'. Refer to "Build notes" document for more details.

2. The 'out/' directory should now have the 'iap-entitlements' project. If you plan to submit your app as a hosted app, copy the iap-entitlements' folder from the out/ directory and serve the app over SSL/HTTPS. In order to protect customers, we require that you serve the page of your app that uses In-App Purchasing over SSL/HTTPS. If the page using In-App Purchaing API is not secure then the Amazon In-App Purchase API would fail by throwing an exception. For more information, please refer to the [Making Your Web App Safe](https://developer.amazon.com/public/solutions/platforms/webapps/docs/web-app-security.html) docmentation. If you plan to submit your app as a packaged app, compress the contents of 'iap-entitlements/' project. The top level of your .zip archive would look like this:

        Package.zip/
          index.html
          js/index.js
          css/index.css
          html/other.html
          images/image1.png 

3. Install Amazon SDK Tester on the Fire TV device. Download the [Amazon Mobile App SDK](https://developer.amazon.com/public/resources/development-tools/sdk). The Amazon SDK Tester APK can be found in the following location Your-Apps-SDK-Folder/Android/InAppPurchasing/PreviousVersions/1.0/tools/AmazonSDKTester.apk Instructions to install the SDK Tester can be found [here](https://developer.amazon.com/public/solutions/platforms/webapps/docs/testing-iap.html#SDK_Tester_Environments)

4. Copy the amazon.sdktester.json file to your device's SD card. Alternatively, if you are familiar with Android Debug Bridge(adb), you can accomplish this by running the command 
adb push /path/to/amazon.sdktester.json /mnt/sdcard/amazon.sdktester.json
NOTE: The amazon.sdktester.json used for the 'iap-entitlement' project can be found in the  'iap-entitlements' project folder. The SDK Tester uses a JSON file to resolve IAP item available to the web app and uses the information to respond to IAP API calls. The file contains a list of JSON objects with the same properties as the IAP items that you enter into the developer portal. This ensures that you test with the same item attributes that will be available in the live environment.

5. Install the Amazon Web App Tester from Amazon App Store

6. Load the 'iap-entitlements' app URL (served over SSL/HTTPS) in the Web App Tester to test your hosted app. For more information about how to test your packaged app/ hosted app using Amazon Web App Tester refer to [Installing and Using the Amazon Web App Tester](https://developer.amazon.com/public/solutions/platforms/webapps/docs/tester.html) documentation.

** Testing **

Testing in Desktop Chrome

Amazon IAP can be tested in a Chrome browser on your desktop. For this to work there is an additional script that is already included in the head of the index.html 'https://resources.amazonwebapps.com/v1/latest/Amazon-Web-App-API-tester.min.js'. This script is only intended for use while testing the app and should be removed for prodcution. In addition to this script there are two other locations that have code that supports testing in the browser - Also in the index.html there is a script block within the body of the document that changes the z-index of the application container element. We do this so that the IAP purchase dialog will show above the app container. The last item is in the `entitlement-view.js` file at the top of the `initialize` method. There is an if statement that checks to see if the user agent matches FireTV and if it does not the tester that is used in the browser is enabled. All of these instances are clearly commented and all should be removed in your final prodcution app.

Testing on a FireTV device

The following workflow uses Amazon's testing tools and services in a logical order to ensure that your app has had comprehensive testing coverages before going live with it in the Amazon Appstore:

1. On FireTV Install the SDK Tester to test an app using IAP v1.0. See Install Amazon SDK Tester section above.
2. On FireTV Install the Web App Tester. [See Installing and Using the Amazon Web App Tester](https://developer.amazon.com/appsandservices/solutions/platforms/webapps/docs/tester.html)
3. Make sure you have copied the amazon.sdktester.json file to the device in the /mnt/sdcard directory 
4. Make sure you are hosting from an https server or running as a packaged app
5. You should now be able to run the app in the Web App Tester on FireTV

NOTE:Amazon SDK Tester allows you to test your IAP implementation in a production-like environment before submitting your app for publication. The tool allows you to test mock purchases and construct test cases that cover responses generated by In-App Purchasing API for JavaScript. In a live environment, your app makes API calls to the AmazonServices JavaScript library. The library, in turn, makes AJAX calls to the Amazon services to fulfill requests such as purchaseItem, getItemData, getPurchaseUpdates etc. Only apps that have been approved and published through the developer portal can communicate with Amazon's services. The SDK Tester provides a sandbox test environment that enables you to test IAP implementation before you submit your web app to the developer portal. Some live environment scenarios cannot be tested with the SDK Tester. For example, a purchase made by a user on one device will not be reflected on another device he/she owns. 

** IAP References **

* [Overview](https://developer.amazon.com/public/solutions/platforms/webapps/docs/understanding.html)
* [Consumables Example](https://developer.amazon.com/public/solutions/platforms/webapps/docs/consumable.html)
* [Entitlement Example](https://developer.amazon.com/public/solutions/platforms/webapps/docs/entitlement.html)
* [Subscription Example](https://developer.amazon.com/public/solutions/platforms/webapps/docs/subscription.html)
* [Receipt Verification Service and APIs](https://developer.amazon.com/public/solutions/platforms/webapps/docs/rvs.html)
* [Testing IAP](https://developer.amazon.com/public/solutions/platforms/webapps/docs/testing-iap.html)

** 'iap-entitlements' Sample Project **

When you launch the 'iap-entitlements' project there is an 'Upgrade' button that can be found at the bottom left of the screen. When this option is selected, a list of items that can be purchased are displayed - in the default case the items that are available for purchase are a set of three backgrounds. The list of items can be configured in the developer console at the time of app submission by the developer. The developer will have to enable IAP and add information about each item he would like to sell. Items can be a Consumable, Entitlement or Subscription. The customer can choose to purchase an item. At this point the customer is presented with detailed information about the item they would like to purchase including title, description and the price. If the customer chooses to buy the item, a payment is made to Amazon on behalf of the customer and receipt confirming the purchase is returned to the app. The app then unlocks the purchased item for the customer. 

Refer to `entitlement-view.js` for UI and purchase specific implementation. 'EntitlementView' is the JavaScript module that has a set of UI methods and IAP methods

** Workflow **

When the 'Upgrade' button is selected, the getItemData() API is invoked with list of SKUs. The result contains detailed information about each of these items. If a customer chooses to purchase an item, the purchaseItem() API is used to purchase a SKU. In the sample project, all the items available for purchase are entitlements. If an entitlement is purchased on one device they are made availabale in all compatible devices. This is made possible by implementing the onPurchaseUpdatesResponse callback. When the customer chooses a theme to purchase, the customer is presented with detailed information about the item he would like to purchase including title, description and the price. If the customer chooses to buy the item, a payment is made on behalf of the customer and receipt confirming the purchase is returned to the app. The onPurchaseResponse() callback is invoked. The app UI is updated to unlock the purchased theme for the customer. The customer can then chose to change the theme by selecting the 'Apply Theme' button.

** Code Structure ** 

`entitlement-view.js` has a 'EntitlementView' with UI and IAP Methods.

**UI Methods** :

'render' the render function is responsible for creating the button that will launch the dialog that will display the items for purchase. All available items will have a button and thumbnail associated with them, and as the user navigates through the buttons, the corresponding thumbnail will appear.

'updateDialog' this method will update the UI for the dialog when a purchase is made. For the purposes of this sample there is a lock icon image that is displayed over each thumbnail that has not been purchased. Once the item is purchased this icon will be removed from the thumbnail and the button will change from displaying the item's purchase price to a message notifying the user that the item has been purchased. 

**IAP Methods/Callbacks** :

**'initialize'** method is called when the app is loaded and we register a amazonPlatformReady event listener. The IAP module is ready to be used when the 'amazonPlatformReady' event is triggered. The following response handlers have been implemented and registered in the registerObserver method with the AmazonServices:

**onSdkAvailable(onAvailableResponse)** - This gets called when the In-App Purchasing services are ready to be called by your code. Production applications should not grant entitlements when they are run in sandbox mode. In our implementation, we get all purchase updates from the last purchase check time. When using IAP it is important to understand responses can come at any time. Your web app could have been shut down prior to a receipt being delivered for instance. The next time your application runs, the receipt will be delivered upon initializing the API in this case. That is why it is important to call getPurchaseUpdates to get any purchases that could have been made in a previous run.

**onGetUserIdResponse(userIdResponse)** - Called in response to GetUserId. In our sample project, we do not implement this callback as we do not display any user specific information. 

**onItemDataResponse(itemDataResponse)** - Called in response to GetItemData. data.itemData is a hash table of itemData objects keyed by SKU. In our sample project, we use the getItemData() API to populate the list of themes available. We have a state variable (‘state-entitlement-info’) with a list of SKUs of themes. We fetch detailed information - title, description, price, type of purchase and small icon url using the getItemData() API. This API is called only when the customer selects the 'Upgrade’ button.

The following status responses could be returned:

ItemDataStatus.SUCCESSFUL - As long as the request is for a valid sku in the JSON file, a successful response is returned. In our sample project, we display the list of themes that are already available or ready to be purchased.

ItemDataStatus.FAILED – In our sample project, we display an alert with a message indicating we failed to fetch the items/themes. Note: This message is displayed only when the customer has selected the ‘Upgrade’ button and the request to get items fails.

ItemDataStatus.SUCCESSFUL_WITH_UNAVAILABLE_SKUS - in our sample project, we display an alert with a message indicating we failed to fetch the items/themes as the input provided had invalid SKUs. Note: This message is displayed only when the customer has selected the ‘Upgrade’ button and the request to get items fails.

**onPurchaseResponse(purchaseResponse)** - Called to report the status of a purchase operation. purchaseResponse.purchaseRequestStatus contains the status of the response. If a prior session of the application shut down before a purchase response could be delivered, this function will be called when a new session of the application registers a purchase handler. 

The following status responses could be returned:

PurchaseRequestStatus.SUCCESSFUL - As long as the purchase is for a valid SKU in the JSON file, a successful response is returned. In the sample app we unlock the purchased theme and update the 'Apply Themes' Dialog to reflect the purchase. We update the state information of the purchased SKU and store it in local storage. 

PurchaseRequestStatus.FAILED - If the Purchase Confirmation Dialog is closed, a failed response is returned. In the sample app if a failure result is returned as a result of trying to purchase one of the themes then an error dialog is displayed.

PurchaseRequestStatus.INVALID_SKU - If the purchaseItem API is called with an invalid SKU then an INVALID_SKU response is returned. In the sample app if an INVALID_SKU result is returned as a result of trying to purchase one of the themes then an error dialog is displayed.

PurchaseRequestStatus.ALREADY_ENTITLED - If the purchaseItem API returns ALREADY_ENTITLED response then somehow we are out of sync with the server. In our sample app we get all purchases from the beginning of time.

onPurchaseUpdateResponse(data) - Called with the list of entitlements that the user has been granted. data.receipts contains a hash table, keyed on SKU, that contains the receipts for the IAPs that have been granted to the user. 'data.revokedSkus' has a list of SKUs that the user can no longer use. 

PurchaseUpdateStatus.SUCCESSFUL - If the result returned is successful, then the sample app updates the UI to reflect the update. Additionally, we store the entitlement formation in a state variable called 'state-entitlement-info'. This is written to local storage.

PurchaseUpdateStatus.FAILURE - An alert is displayed that the updates failed.

