(function(exports) {
    'use strict';
    
    function getParam(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    
    //initialize the app
    var settings = {
        Model: KalturaMediaModel,
        //PlayerView: PlayerView,
        PlayerView: KalturaPlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: false,
        displayButtons: false,
        
        // provide fallbacks to "video.kaltura.com"
        partnerId: getParam( 'partnerId') || '1059491', 
        uiconfId: getParam( 'uiconfId') || '24571261',
        topCategoryId: getParam( 'topCategoryId') ||'6064992',
        ksService: 'http://50.19.86.65/amtv/list-ks.php?partner_id=' + ( getParam( 'partnerId') || '1059491' ),
        appLogo: getParam( 'appLogo') || 'assets/kms-media.jpg',
        
        maxEntries: 150
    };

    var app = new App(settings);
    exports.app = app;
}(window));
