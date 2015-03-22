(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: MRSSMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.xml",
        showSearch: true,
        displayButtons: true,
        partnerId: '811441',
        uiconfId: '28732831'
    };

    var app = new App(settings);
    exports.app = app;
}(window));
