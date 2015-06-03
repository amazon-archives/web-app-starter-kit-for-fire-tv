##MRSS
---------------------------
The Web App Starter Kit has an mrss project which supports MRSS feeds.

###Setting the MRSS Feed URL
To point the app to your content feed, you must edit the `init.js` in your project directory. The file contains a very simple object for application settings. Set the `dataURL` parameter to point to your MRSS feed URL.

    //initialize the app
    var settings = {
        Model: MRSSMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "<YourDataFeedURL>",
        showSearch: true,
        displayButtons:false
    };

###Editing the model-mrss
There may be data transformation needed to get your content working in the application, these changes will need to be made in the model-mrss.js file that is located in the /src/common/js/directory.
In the model-mrss file you will find a method called `handleXMLData`, which is where you will make your adjustments. Note that this function casts the object as a jQuery object, this is so that we can take advantage of jQuery methods to easily traverse the XML DOM.
In the below example you will see the data object that the application expects, to map your data, change any of the DOM references needed.

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

In this same method you will see, as we iterate through the items, we also store categories, creating a new one if it has not yet been created, then we add the newly created `item` object to the category array.

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
