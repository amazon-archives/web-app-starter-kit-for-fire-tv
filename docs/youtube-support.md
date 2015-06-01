##YouTube
---------------------------
The Web App Starter Kit currently supports making a Web App based on YouTube content through the provided [YouTube Developer API's](https://developers.google.com/youtube/getting_started).

There is a working YouTube example in the `src/projects/youtube` directory. ***NOTE:** You will need to add your YouTube Developer Key for the example to work (see below).*

Here are the steps to getting a YouTube based application up and running:

###Acquire a YouTube Developer Key

To utilize the YouTube functionality of the starter kit you must acquire a valid YouTube Developer key. This is a string hash which uniquely identifies your application to YouTube. All you need to acquire this key is a valid Google account. To obtain the key please view the video on the [Getting Started Guide from Google](https://developers.google.com/youtube/v3/getting-started#before-you-start).

###Customizing the YouTube Project

In the `init.js` file you will find a settings object similar to:

     var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "xxxx",
        devKey: "XXXXXXXXXXX",
        hasLatestChannel: true // creates a category with the user's latest videos
        createCategoriesFromSections: true // pull categories from the YouTube Sections API
    };

This is the settings object you should modify to make your YouTube application.

First thing to do is change the `user` property to your YouTube Google User account name. This will have the app load the logo and find your initial playlists for the left navigation menu.

You also need to put the Developer Key you received through the previous instructions and fill it in the `devKey` property.

The `hasLatestChannel` property tells the App whether to create a **Latest** category which shows the latest 50 videos in reverse chronological order from the user specified in the settings object.

If you do no more customization the App will pull the first 30 playlists from the specified YouTube user, and put them in the Left Hand Navigation of the app, it will truncate the names to size with an ellipsis if they are too long to fit in the menu.

You can also use our API to automatically create categories from the channel's YouTube sections which are created through the YouTube user interface. To generate these categories add the setting `createCategoriesFromSections: true` to your `init.js`.


To handcraft the left nav category list you can use the `channels` object in the `init.js` file under the settings object. Please note this can not be used if you are using the `createCategoriesFromSections` feature.

The format would look like this:

     var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "xxxx",
        devKey: "XXXXXXXXXXX",
        hasLatestChannel: true // creates a category with the user's latest videos
        channels: [
            {
                type: "playlist",
                id: "XXXXXX",
                title: "Playlist A"
            },
            {
                type: "playlist",
                id: "XXXXX",
                title: "Playlist B"
            },
            {
                type: "playlist",
                id: "XXXXX",
                title: "Playlist C"
            },
            {
                type: "searchterm",
                query: "search for this",
                title: "Search 1"
            },
            {
                type: "searchterm",
                query: "search for that",
                title: "Search 2"
            },
            {
                type: "channel",
                id: "XXXXX",
                title: "Channel A"
            },
            {
                type: "multiPlaylists",
                ids: ["xxx",
                      "yyy",
                      "zzz"],
                title: "Many Playlists"
            }
        ],
     }


 As you can see channels is an array of objects. There are two valid types of channel objects.

 The `playlist` channel object takes a playlist ID and a title. This will create a category in the left navigation menu with the given title, that has the content of specified playlist.

 To find a playlist ID, go to the link of your playlist from YouTube, the ID is highlighted below in the example link:

 https://www.youtube.com/watch?v=D_vK9n5QuPg&list=`LLT9ApARFgQJOeqD-ygmxnJQ`

 Take the highlighted section and place it in the `id` property for a given channel object.


  The `channel` channel object takes a channel ID and a title. This will create a category in the left navigation menu with the given title, that has the latest videos from the specific channel.

 To find a channel ID, go to the link of your channel from YouTube, the ID is highlighted below in the example link:

 http://www.youtube.com/channel/`UCvclA06ZUVv54J-1ZeJ54Aw`

 Take the highlighted section and place it in the `id` property for a given channel object.

 The `searchterm` object is similar, but instead of a playlist and ID, it takes a `title` which is put in the left navigation menu, and a `query`. The query will be used when that category is selected to search through the specified user's videos using the YouTube API for anything matching that search query, and display the first 50 results in reverse chronological order.

 For example if you have a channel about Animals you could make a category that searches for anything related to "dolphin" and name it "Dolphin Vids" like so:

        channels: [
            {
                type: "searchterm",
                query: "dolphin",
                title: "Dolphin Vids"
            }
        ],

We also support a category which can contain a one level deep hierarchy of playlists. This is called a `multiPlaylists` object which contains an array of playlist ids. These ids will be displayed as sub-categories.
For example:

        channels: [
            {
                type: "multiPlaylists",
                ids: ["xxx",
                      "yyy",
                      "zzz"],
                title: "Many Playlists"
            }
        ],

That is all you need to get your YouTube based application up and running with the Web App Starter Kit! For style customization please refer to the [Styling Documentation](./styling.md)
