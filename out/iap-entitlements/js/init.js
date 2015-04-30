(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: JSONMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.json",
        entitlement : true,
        showSearch: true,
        displayButtons:false
    };

    exports.app = new App(settings);
}(window));
