(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: JSONMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.json",
        showSearch: true,
        displayButtons:false,
        skipLength: 10
    };

    exports.app = new App(settings);
}(window));
