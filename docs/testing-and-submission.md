## Before Submitting Your Application
-------------------------------------
Before submitting an app, make sure it has been throroughly tested and works as expected on a Fire TV device. There is additional information about testing below.

** Developer Portal **

The Amazon developer portal is where developers can manage and submit their applications to the Amazon App Store. The developer portal also provides developer support, documentation and other resources to help you along the way. Make sure you have an Amazon developer account by going to : [developer.amazon.com/portal](http://developer.amazon.com/portal). Once you have an account you will use the developer portal to upload applications and manage them.

** Decide Which Type of App You Want to Submit **

Hosted App : A hosted app is an application whose assets are hosted on a web server. With a hosted solution you will need the URL of the hosted application as part of the submission process. It's also important to note that with the hosted solution, whenever a change is made to the hosted application, you will not need to make any update through Amazon's developer portal. Changes to the hosted application will be shown automatically in the Fire TV application.

Packaged App : A packaged app is a full-fledged client-side web standards-based application whose assets are bundled together in a ZIP archive for distribution. With a packaged app any updates to the application will require that you re-submit your pacakge to the Amazon app store.

For additional information on these type of apps please see our [developer documentation](https://developer.amazon.com/public/solutions/platforms/webapps/docs/differences-between-packaged-and-hosted-apps).

## Testing Your App 
-------------------
While we have provided a basic application that can be altered and used for your own content, it is still the responsibility of the developer to make sure that the final app is working and provides a good user experience to your customers/viewers. Provided herein is information on how to test your app, as well as a basic test plan checklist.

## Test on Fire TV and Fire TV Stick

The following workflow uses Amazon's testing tools and services in a logical order to ensure that your app has had comprehensive testing coverages before going live with it in the Amazon Appstore:

### Setup Web App Tester (WAT) 

1. Install the Amazon Web App Tester on your Fire TV device. The web app tester can be found by searching through the Fire TV app store interface or through amazon.com : http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8
2. Make sure your FireTV device and your desktop are on the same network
3. Launch the WAT (Web app tester) on you FireTV 
4. In the landing page for the WAT on the top right there are selections for "Test Hosted App" or "Test Packaged App" - Select the appropriate option for your application. 

### Testing a Hosted App

1. There are two input elements on this landing page - select the one on the right by using the remote keys - make sure the cursor is blinking in the input
2. Enter a URL - There are two ways to do this : Type in a URL that points to your app or you can also sideload a JSON file containing one or more URLs. More information can be found in our online developer docs for [Installing and Using the Amazon Web App Tester](https://developer.amazon.com/public/solutions/platforms/webapps/docs/tester.html).
3. Select the item in the list to test your app.

### Testing a Packaged App

1. Create a zip package with your app. This is just a standard zip, but the index.html must be at the top level of the zip directory - so that there if you unzip the package there is no folder. 

    EXAMPLE :
    - index.html
    - assets/
    - firetv.css
    - js/

    THIS WILL NOT WORK : 
    - folder/
        - index.html
        - assets/
        - firetv.css
        - js/

For more information on creating your package, check out our [blog post](https://developer.amazon.com/appsandservices/community/post/Tx2IODYNW5ZKSDO/HTML5-Packaged-Apps-Service-Makes-It-Even-Easier-to-Submit-Apps).

2. There are two ways to point to a package in the WAT. Type in a URL that points to a .zip file containing your app or sideload your .zip file to the /sdcard/amazonwebapps directory on the host device. More information can be found in our online developer docs for [Installing and Using the Amazon Web App Tester](https://developer.amazon.com/public/solutions/platforms/webapps/docs/tester.html).

3. For a package that was pushed to the 'amazonwebapps' folder, in the WAT select the "Sync" option in the web app tester to show the package in the list.
4. Select "Verify" next to the package name and the WAT will make sure the package is valid. You will then be able to test your application.

### Test on Desktop in Chrome Browser 

While you are able to test the app in a Browser, all apps should be thoroughly tested on a Fire TV device before being uploaded to the the Amazon App Store.

1. Load the test URL in a chrome browser
2. In the Chrome Menu bar go to View > Developer > Developer Tools - The will show the developer tools window.
3. On the top right corner of the dev tools window there will be an icon that toggles the emulator (the icon looks like a greater than sign overlapping 3 horizontal lines) 
4. Press the button, and it should show a new pane on the bottom of the developer tools window
5. Select the "Emulation" tab and from the list items on the left select 'Device'
6. Make sure the box next to 'Emulate Screen Resolution' is checked
7. Enter 1920 in the first input and 1080 in the second next to 'Resolution' This is the resolution for Fire TV. We also recommend clicking the 'shrink to fit' so that the screen will scale to fit within your window.
8. Use your arrow keys to emulate controller buttons (left, right, down and up arrow keys to move. Enter to Select/Play. Delete to go back)

### Recommended Minimum Application Test Cases 

We strongly recommend thorough testing of your application before submission. Below is a list of recommended test cases for features in the template. Any feature changes you make should also be tested before continuing on to the app submission process. 

1. Left-Nav Menu
    * As a default, long titles are truncated and an ellipsis added to the end. Make sure there is no abnormal clipping.
    * Select each of the menus in the left nav and make sure corresponding content is loaded.
    * Highlight nav item other than the currently selected and then press the "BACK" button, press the "FORWARD" button, press "SELECT". Make sure menu is behaving as expected.
    * If using search, try searching a few key words that should return results. Try searching a term that should not return results.
2. One-D-View & Shoveler
    * Navigate between items in the Shoveler - make sure the corresponding title, description and date are correct. 
    * Scroll through items by pressing LEFT and RIGHT. Push left and right multiple times to navigate. Press and hold left and right for continuous scroll.
    * If using subcategories, click through subcategories until you get to the content items. Now back out of the subcategory all the way to the top.
    * While in the Shoveler (content item selected) Push UP. Push DOWN. Make sure events are working as expected. 
3. Player View
    * Play a video - make sure video plays automatically.
    * Try starting a video and then backing out by selecting the BACK button. Make sure the app returns to the menu view.
    * Try Fast forwarding and rewinding by using the FORWARD and REWIND buttons. Try pressing FORWARD and REWIND multiple times to skip ahead and back. Try holding FORWARD and REWIND for continuous forwarding and rewinding.
    * Play several videos and let them play all the way through.
    * PAUSE/PLAY the video to make sure the video can be paused and played.
    * Press UP to display the controls view. Press DOWN when the controls view is visible to hide the controls.
4. Continuous Play - Continuous Play is the feature that shows the "Next Up" video when the currently-playing video is at the last 10 seconds of its playback.
    * When the video gets close to the end, see that the continuous play view (overlay element on right-hand side of screen) is displayed. NOTE - this will not display if user is currently seeking and/or the custom controls are visible. The overlay should display the title and description as well as a thumbnail image. There will be a timer that counts down until the next video begins.
    * When the continuous play overlay is visible try pressing select to start the new video immediately. 

## Debugging Your App
------------------------

You can debug apps from your Fire TV device using Chrome dev tools and [Android Debug Bridge - ADB](http://developer.android.com/tools/help/adb.html). 

If you are running your app in the Amazon Web App Tester, you can inspect your application by doing the following :

1. Make sure your Fire TV and your desktop are on the same network
2. Turn on ADB debugging
    * From the home screen go to 'Settings'
    * Select System > Developer Options
    * Next to ADB Debuggin make sure it says "On"
3. Launch the Web App Tester and open your application
4. Click the menu button on your remote - this is the button that has 3 horizontal lines on it.
5. When you click the button there should be a popup in the bottom right-hand corner of the screen.
6. Select "Enable Devtools" from the menu
7. There will be a modal dialog that shows in the middle of the screen, this will tell you the IP address to enter into your Chrome browser. Type this IP with port number (i.e. 172.0.0.0:9222) into your Chrome browser and you should get a list of inspectable pages. 
8. Select the title of your app (should be the top link) and you should see the devtools.

You can also use ADB to do things like text input from your desktop, push or install files onto your Fire TV device and logging using adb logcat. To use ADB with your Fire TV device just follow steps 1 and 2 above and then use adb commands to interract with your device. For more information on ADB, see the [android developer docs](http://developer.android.com/tools/help/adb.html).

## Submitting Your App
------------------------

Once your app has been thoroughly tested you can submit it to the appstore to make it available for Users.

1. Create a developer account in Amazon's developer portal : developer.amazon.com/portal
2. Under "Apps & Services" select "Add a New App"
3. Select "Mobile Web" and click "Next"
4. The Wizard will walk you through the app submission process. You will also need the following images for your app submission. 
 * a small icon (114 x 114px)
 * a thumbnail (a larger version of the icon) (512 x 512px)
 * a minimum of three screenshots that accurately depict your app (1024 x 600px or 800 x 480px)
 * a promotional image that includes the name of your app (1024 x 500px)
5. When filling out the information for "Device Support", make sure you have only selected the Fire TV and Fire TV Stick options for supported devices. Make sure all the tablet devices are unchecked.
6. Once you have submitted your app it will go through an Amazon ingestion service and notify you when your app has been published.
