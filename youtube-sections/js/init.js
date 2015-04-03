(function(exports) {
    'use strict';

    var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "amazonwebservices",
        devKey: "AIzaSyA7AUJZMxx4PPngptCblPxqMTfHdZt8EQA",
        createCategoriesFromSections: true
    };

    exports.app = new App(settings);
}(window));
