(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: BrightcoveAPIModel,
        PlayerView: BrightcovePlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "https://api.brightcove.com/services/library",
        numberOfCategories: 30,
        developerToken: "6gVxMdyXfHwO2-c0Oe4_zt4ZZN0DK1tUHueUuTA6okLxHnxNGn354w..",
        accountID: "3986618082001",
        playerID: "115d0726-53ff-4cd9-8a5d-c68ea10d3ea2",
        showSearch: true,
        displayButtons: false
    };

    var app = new App(settings);
    exports.app = app;
}(window));
