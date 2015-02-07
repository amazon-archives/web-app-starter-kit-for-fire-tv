(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: MRSSMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.xml",
        showSearch: true,
        displayButtons: true
    };

    var app = new App(settings);
    exports.app = app;
}(window));
