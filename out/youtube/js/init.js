(function(exports) {
    'use strict';

    var settings = {
        Model: YouTubeAPIModel,
        PlayerView: YouTubePlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        user: "amazonwebservices",
        devKey: "PUT-YOUTUBE-API-DEV-KEY-HERE",
        showLatestChannel: true,
        channels: [
            {
                type: "playlist",
                id: "PLhr1KZpdzukf6YADEpM6nFEZs7VDhEs5U",
                title: "re:Invent Spotlight",
            },
            {
                type: "playlist",
                id: "PLhr1KZpdzukeiCFgRccZ677GhHoP1OD8S",
                title: "re:Invent Gaming",
            },
            {
                type: "playlist",
                id: "PLhr1KZpdzukeEDdaSY-HHJuX30WsoGhuW",
                title: "re:Invent Dev Tools",
            },
            {
                type: "searchterm",
                query: "fire",
                title: "Fire Videos",
            },
            {
                type: "searchterm",
                query: "s3",
                title: "S3 Videos",
            }
        ],
        displayButtons: false
    };

    var app = new App(settings);
    exports.app = app;
}(window));
