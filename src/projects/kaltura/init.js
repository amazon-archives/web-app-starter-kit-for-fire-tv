(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: KalturaMediaModel,
        //PlayerView: PlayerView,
        PlayerView: KalturaPlayerView,
        PlaylistView: PlaylistPlayerView,
        dataURL: "./assets/genericMediaData.json",
        showSearch: true,
        displayButtons: true,
        appLogo: 'https://cdnsecakmi.kaltura.com/p/811441/sp/81144100/raw/entry_id/1_19ou6fg0/version/100000/',
        
        partnerId: '811441', // videos.kaltura.com .. 
        uiconfId: '28732831',
        topCategoryId: '9059671',
        ksService: 'http://50.19.86.65/amtv/list-ks.php?partner_id=811441',
        maxEntries: 150,
        
        // the playlist to load all the syndicated content
        playlistId: '0_aqpaqb4c'
        
        //, // the top level category to define TV App ( "galleries" in mediaSapce ) 
        // // a playlist that should include all entries in the app
    };

    var app = new App(settings);
    exports.app = app;
}(window));
