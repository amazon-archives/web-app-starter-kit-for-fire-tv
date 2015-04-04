# Platform Support Overview
---------------------------

The Web App Starter Kit supports a plug and play infrastructure for various media platforms. This document describes specific usage for the media platforms and services we currently support. There is some reliance on understanding the how to utilize the Web App Starter build system described in the [building documentation](./building.md).

## Creating a New Project
---------------------------
This part relies on having your gulp build system set up and working correctly, for more information see the [building documentation](./building.md)

Decide on the base project to use (i.e. use the `simple` project for json feeds, the `mrss` project for mrss feeds etc).

First copy the example project directory from `src/projects/<project-type>` to `src/projects/<your-project-name>`. Copying the starter project will make it easier to update later and ensures you can always compare or refer back to the original template files

Now that you have a project directory, open the `src/projects/<your-project-name>/init.js`. This holds the main settings configuration for your project, make platform adjustments as necessary here.

Now you should be able to run `gulp build` from the command-line and have servable example in `out/<your-project-name>`. You can also run `gulp watch` to keep a process running which monitors your source directory for changes and updates your output directory accordingly.

##YouTube
---------------------------
The Web App Starter Kit currently supports making a Web App based on YouTube content through the provided [YouTube Developer API's](https://developers.google.com/youtube/getting_started).

There is a working YouTube example in the `src/projects/youtube` directory. ***NOTE:** You will need to add your YouTube Developer Key for the example to work (see below).*

Here are the steps to getting a YouTube based application up and running:

###Acquire a YouTube Developer Key

To utilize the YouTube functionality of the starter kit you must acquire a valid YouTube Developer key. This is a string hash which uniquely identifies your application to YouTube. All you need to acquire this key is a valid Google account. To obtain the key please follow the [Getting Started Guide from Google](https://developers.google.com/youtube/v3/getting-started#before-you-start).

###Customizing the YouTube Project

In the `init.js` file you will find a settings object similar to:

     var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "xxxx",
        devKey: "XXXXXXXXXXX",
        showLatestChannel: true
    };

This is the settings object you should modify to make your YouTube application.

First thing to do is change the `user` property to your YouTube Google User account name. This will have the app load the logo and find your initial playlists for the left navigation menu.

You also need to put the Developer Key you received through the previous instructions and fill it in the `devKey` property.

The `hasLatestChannel` property tells the App whether to create a **Latest** category which shows the latest 50 videos in reverse chronological order from the user specified in the settings object.

If you do no more customization the App will pull the first 30 playlists from the specified YouTube user, and put them in the Left Hand Navigation of the app, it will truncate the names to size with an ellipsis if they are too long to fit in the menu.

You can also use our API to automatically create categories from the channel's YouTube sections which are created through the YouTube user interface. To generate these categories add the setting `createCategoriesFromSections: true` to your `init.js`.


To further customize your application you can create an object in the settings called `channels`. Channels will be displayed in the left navigation menu of the template.

The format would look like this:

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
        ],


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

We also support a category which contains multiple playlists, the `type` for this channel is `multiPlaylists` and it is handled the same way as the `playlist` type, except that the `ids` contains an array of playlist ids. For example:

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

##MRSS
---------------------------
The Web App Starter Kit supports MRSS feeds. There is a mrss project already in the projects directory which can be copied or edited directly.

The template's mrss project supports standard MRSS feeds, so there should be minimal work to get your feed working in the application. If any references do need to be changed to support your feed, you will need to edit the model-mrss.js file. This file is located in the src/common/js directory, but we recommend that you copy this file to your specific project folder and make your changes in there. For this you will also need to change your build.json file to point to the new model-mrss.js that now resides in your project folder.

###Setting the MRSS Feed URL
To point the app to your content feed, you must edit the `init.js` in your project directory. The file contains a very simple object for application settings. Set the `dataURL` parameter to point to your MRSS feed URL.

    //initialize the app
    var settings = {
        Model: MRSSMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "<YourDataFeedURL>",
        showSearch: true,
        displayButtons: true
    };

###Editing the model-mrss
The data object used by the application is created using the `handleXMLData` method.
The first thing that happens is the data that is returned is immediately cast as a jQuery object to make use of jQuery's object methods such as find.
Using the jQuery object we use the find method to iterate through each item and save the necessary fields to an item object.

EXAMPLE :
    var $xml = $(xmlData);

    $xml.find("item").each(function() {
         var $this = $(this);
         var item = {
             title: $this.find("title").text(),
             link: $this.find("link").text(),
             description: $this.find("description").text(),
             pubDate: $this.find("pubDate").text(),
             author: $this.find("author").text(),
             imgURL: $this.find("thumbnail").attr("url"),
             videoURL: $this.find("content").attr("url")
         }

For each item we iterate through the categories, creating a new one if it has not yet been created, then we add the newly created `item` object to the category array.

EXAMPLE :
     $this.find("category").each(function() {
         var category = $(this).text();

         itemsInCategory[category] = itemsInCategory[category] || [];
         itemsInCategory[category].push(item);
     });

     //make sure we don't have an empty category
     if(category.length > 0) {
         cats.push(category);
     }

After making your changes the application will pull in your data and display it in the application.
