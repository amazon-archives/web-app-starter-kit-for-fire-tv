## Brightcove Project Overview
---------------------------
The Web App Starter Kit currently supports making a web app based on content from Brightcove's Video Cloud and uses the Brightcove Player to play the content. The provided sample project supports analytics through Brightcove Video Cloud Analytics and advertising through the IMA3 Plugin.


## Test Sample Brightcove Project
------------------

The Brightcove example is in the src/projects/brightcove directory. You can quickly get this project up and running on Fire TV by following these steps:

Create a zip package with the sample brightcove app that can be found in `out/brightcove/` directory.  This is just a standard zip, but the index.html must be at the top level of the zip directory - so that there if you unzip the package there is no folder.

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

**NOTE: the sample project uses our Brightcove Test account that has sample content**

###Testing on Fire TV

After this you can test your app by following the instructions below :

 * Install the Amazon Web App Tester on your Fire TV device. The web app tester can be found by searching through the app store on the Fire TV or you can do a Voice Search to find the app.
 * Make sure your FireTV device and your desktop are on the same network
 * Launch the WAT (Web app tester) on your FireTV
 * In the landing page for the WAT on the top right there are selections for "Test Hosted App" or "Test Packaged App" - Select the "Test Packaged App"
 * There are two ways to point to a package in the WAT. Type in a URL that points to a .zip file containing your app or sideload your .zip file to the /sdcard/amazonwebapps directory on the host device. More information can be found in our online developer docs for [Installing and Using the Amazon Web App Tester](https://developer.amazon.com/public/solutions/platforms/webapps/docs/tester.html).
 * For a package that was pushed to the 'amazonwebapps' folder, in the WAT select the "Sync" option in the web app tester to show the package in the list.
 * Select "Verify" next to the package name and the WAT will make sure the package is valid. You will then be able to test your application by selecting the "Test" option.

###Testing in a Browser

You will need to enable CORS requests in the browser for this example to work. If you are running on a Chrome browser, this can be accomplished using a Chrome plugin, for example you can use this [plugin](https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en).

**Note**: You may see a "Video Playback Error" dialog during the playback of advertisements. A Chrome plugin can be used to partially work around this issue by blocking ads entirely, for example this [plugin](https://chrome.google.com/webstore/detail/adblock/gighmmpiobklfepjocnamgkkbiglidom?hl=en) should disable the video ads.

##Customizing the Brightcove Project
---------------------------

To customize the sample project to use content from your Brightcove Video Cloud account, you will need to set up the following in your account:

* [Create Playlists](http://support.brightcove.com/en/video-cloud/docs/creating-and-managing-playlists)- Create manual or smart playlists using the instructions provided. Modify the reference id of the playlist to have a **FireTV** prefix. For example, your Reference ID could be FireTV_SamplePlaylist or FireTVSamplePlaylist.
* [Get a Media API Read Token](http://support.brightcove.com/en/video-cloud/docs/managing-media-api-tokens)- Follow the instructions provided in the link to get a read token. We suggest using a normal read token. Read token with URL access is not recommended.
* [Create a Brightcove Player](http://docs.brightcove.com/en/video-cloud/brightcove-player/index.html) - [Login](https://studio.brightcove.com/products/videocloud/players/) to Brightcove Video Cloud Studio. You can log into the studio using your existing sandbox Video Cloud account credentials. Please contact your Brightcove Account Manager or Brightcove Technical support for assistance. You can create, configure and publish a Brightcove Player via Brightcove's Video Cloud Studio. Once you create your player ensure that the player is configured to auto start the video on player load. This can be done by Selecting the player you created and editing Settings. Modify "Auto-Start Video on Player Load" option to "Yes". The Player ID is displayed in the Player Information Section.
* [Get Account ID](https://studio.brightcove.com/products/videocloud/admin/accountsettings) - Navigate to Account Information and the account id is displayed under "Account".

At this point you should have the Brightcove Media API Read Token, Account ID and Player ID information with you.

Refer to [building documentation](./building.md) on how to build this project.

To build your own Brightcove app you need to modify the `init.js` file. In the `init.js` file you will find a settings object similar to:

    //initialize the app
    var settings = {
        Model: BrightcoveAPIModel,
        PlayerView: BrightcovePlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "https://api.brightcove.com/services/library",
        numberOfCategories: 30,
        developerToken: "<DEVELOPER_TOKEN>",
        accountID: "<ACCOUNT_ID>",
        playerID: "<PLAYER_ID>",
        showSearch: true,
        displayButtons: false
    };

 Add your Brightcove Media API Read Token, Account ID and Player ID to the `init.js` file and run `gulp build`

 Follow the steps described in the **Testing on Fire TV** or **Testing in a Browser** section above to test your app on Fire TV.


## Feature Support
------------------

* The Brightcove Model provided retrieves media content from Video Cloud. Playlists with Reference IDs that have a **FireTV** prefix are retrieved and displayed as categories in the left navigation view.
* The Brightcove Player is used to play media content. The default player controls are replaced with custom controls that respond to the Fire TV remote.
* Brightcove Video Cloud Analytics Support
* Advertising with IMA3 Plugin
* Search feature has been added to enable searching through all videos in your Video Cloud account. The search is limited to the displayName, shortDescription, and longDescription fields of the video.

**NOTE: Subcategory structure is not supported**


## Brightcove Architecture Overview
------------------

### Brightcove Model and Content Hierarchy

Videos in Brightcove are organized into 'Playlists'. A playlist is a collection of videos that are grouped together in a particular order for playback in the Brightcove Player. You can create two kinds of playlists: manual or smart. The Brightcove model provided in the webapp starter kit will display only those playlists that have a 'FireTV' prefix in the Reference ID field. The template will directly map playlists to categories and the names of the playlists will be displayed in the left navigation view. The model does not support subcategory structure. When a category or playlist is selected, the model retrieves all videos corresponding to the playlist from the specified Brightcove Video Cloud account.

####Feed Structure

**Playlist Feed Structure** - structure of feed returned when we request all the playlists in Brightcove. This data is used to populate the left nav view.

	{
    "items": [{
            "id": "Playlist Id",
            "referenceId": "Reference Id",
            "name": "Playlist Name",
            "shortDescription": "Playlist Description"
        },
        ...
    ],
    "page_number": page number,
    "page_size": page size,
    "total_count": total count
    }

**Video Feed Structure** - structure of feed returned when we request all videos for a given playlist in Brightcove

	{
    "id": "Playlist Id",
    "referenceId": "Reference Id",
    "name": "Playlist Name",
    "shortDescription": "Playlist Description",
    "videos": [{
            "id": "Video Id",
            "name": "Video Name",
            "longDescription": "Video Description",
            "videoStillURL": "http://video_still_URL",
            "thumbnailURL": "http://thumbnail_URL"
        }
        ...
    ],
    "playlistType": "Playlist Type"
    }

**Search Videos Feed Structure** - structure of feed returned when we search for videos in Brightcove

	{
    "items": [{
            "id": "Video Id",
            "name": "Video Name",
            "longDescription": "Video Description",
            "videoStillURL": "http://video_still_URL",
            "thumbnailURL": "http://thumbnail_URL"
        },
        ...
    ],
    "page_number": page number,
    "page_size": page size,
    "total_count": total count
    }

###Brightcove Player

The Brightcove project uses the new Brightcove Player. The player provided handles Brightcove video/ad playback, seeking functionality and play/pause.

###Brightcove Video Cloud Analytics Support

This project uses the Brightcove Player to play media content. As a result, you can use Brightcove Video Cloud Analytics to retrieve analytics metrics for your Video Cloud videos.

###Advertising with IMA3 Plugin

Follow the instruction provided in this [guide](http://docs.brightcove.com/en/video-cloud/brightcove-player/guides/ima-plugin.html) to add the IMA3 plugin to your Brightcove Player. The player provided in this project handles IMA3 specific ad events. For more details about the ad events handled refer to the `player-view-brightcove.js` section below.

## Advanced Customization options for the Brightcove Project
------------------

Read through the Web App Starter Kit [architecture](./architecture.md), [building](./building.md) documentation and the section above for the Brightcove architecture overview.

###Theming

There is a `firetv.scss` file that resides in the brightcove project directory. You can add custom variables and styles to this file. For more information on theming see our [styling documentation](./styling.md)

###model-brightcove.js

**BrightcoveAPIModel** : this refers to the Brightcove model which resides in the `src/common/js` directory before the application is built. This module is responsible for making ajax requests for feed data as well as managing the data for the app.

###player-view-brightcove.js

**BrightcovePlayerView** : this is used in the Brightcove project and uses the Brightcove Player. This module handles Brightcove video playback, seeking functionality and play/pause. This module can be found in the `src/common/js` directory.

The player handles ad playback and the following ad specific events are handled:

* 'adstart' : sets 'isAdPlaying' state to true and disables play/pause, select and skip actions on the remote
* 'adend': sets 'isAdPlaying' state to false and enables play/pause, select and skip actions on the remote
* error events- 'ima3error' & 'ima3-ad-error' - sets 'isAdPlaying' state to false and enables play/pause, select and skip actions on the remote

NOTE: During Ad playback, the title and description of videos are hidden and play/pause, select and skip actions on the remote are disabled. Only the progress bar is displayed.

###playlist-player-view.js

**PlaylistPlayerView** : this module handles continuous play for the app. This module can be found in the `src/projects/brightcove` directory. For more information on continuous play see our [architecture documentation](./architecture.md). The primary difference between this PlaylistPlayerView and the existing PlaylistPlayerView located in the `src/common/js` directory is that this view does not preload the next PlayerView. In order to enable the Continuous Play feature for the Brightcove Player, the player needs to be configured to autoplay using the Brightcove Studio UI. Without the 'autoplay' configuration the app would require an additional button click to play the video. With the 'autoplay' option enabled, we cannot preload the second player as this would result in two videos playing at the same time. Additionally, this view disables the preview if an ad is playing.

## Known Issues
-----------------------------
* During HLS video playback, if the user selects the pause button, then the first time pause button is pressed the controls are not overlaid. This is a Fire TV platform limitation and will be resolved in a future release.
* Changes in your Brightcove Video Cloud account could take upto 30 minutes to get reflected in your app.


## Testing and App Submission
-----------------------------

We strongly suggest that your application be thoroughly tested before submitting to the app store. There is detailed documentation on testing your app in the [Testing and Submission](./testing-and-submission.md) documentation.

NOTE: You will need to submit your app as a packaged app to the Amazon App Store. CORS issues prevent the app from being a hosted app.


## Developer Support
----------------------------

For all account and app setup/development issues contact BrightCove Technical support or your account manager. This includes:

* Playlists/Content Issue
* Video Playback Issues

For issues with the Brightcove sample project, report your issue here https://github.com/amzn/web-app-starter-kit-for-fire-tv/issues. This includes:

* Unknown JavaScript errors
* Features not working as expected
