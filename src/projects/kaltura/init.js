(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: KalturaMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.json",
        showSearch: true,
        displayButtons: true,
        
        partnerId: '811441',
        uiconfId: '28732831',
        topCategoryId: '9059671',
        ksService: 'http://localhost/list-ks.php?partner_id=811441',
        maxEntries: 100,
        
        // the playlist to load all the syndicated content
        playlistId: '0_aqpaqb4c'
        
        //, // the top level category to define TV App ( "galleries" in mediaSapce ) 
        // // a playlist that should include all entries in the app
    };

    var app = new App(settings);
    exports.app = app;
}(window));
