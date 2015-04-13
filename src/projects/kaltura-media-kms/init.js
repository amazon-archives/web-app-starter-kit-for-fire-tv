(function(exports) {
    'use strict';
    
    //initialize the app
    var settings = {
        Model: KalturaMediaModel,
        //PlayerView: PlayerView,
        PlayerView: KalturaPlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: false,
        displayButtons: false,
        
        // provide fallbacks to "video.kaltura.com"
        partnerId: '1059491', 
        uiconfId: '24571261',
        topCategoryId: '6064992',
        // ordered list of categories for left side navigation, first cateogry will be displayed in bg
        ksService: 'http://50.19.86.65/amtv/list-ks.php?partner_id=1059491',
        appLogo: 'assets/kms-media.jpg',
        
        maxEntries: 150
    };

    var app = new App(settings);
    exports.app = app;
}(window));
