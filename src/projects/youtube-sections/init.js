(function(exports) {
    'use strict';

    var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "amazonwebservices",
        devKey: "PUT-YOUTUBE-API-DEV-KEY-HERE",
        createCategoriesFromSections: true
    };

    exports.app = new App(settings);
}(window));
