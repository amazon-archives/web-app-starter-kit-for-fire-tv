# Platform Support Overview
---------------------------

The Web App Starter Kit supports a plug and play infrastructure for various media platforms. This document describes specific usage for the media platforms and services we currently support. There is some reliance on understanding the how to utilize the Web App Starter build system described in the [building documentation](./building.md).

## Creating a New Project
---------------------------
This part relies on having your gulp build system set up and working correctly, for more information see the [building documentation](./building.md)

Decide on the base project to use (i.e. use the `simple` project for json feeds, the `mrss` project for mrss feeds etc).

First copy the example project directory from `src/projects/<project-type>` to `src/projects/<your-project-name>`. Copying the starter project will make it easier to update later and ensures you can always compare or refer back to the original template files

Now that you have a project directory, open the `src/projects/<your-project-name>/init.js`. This holds the main settings configuration for your project, make platform adjustments as necessary here.

Now you should be able to run `gulp build` from the command-line and have servable example in `out/<your-project-name>`. You can also run `gulp watch` to keep a process running which monitors your source directory for changes and updates your output directory accordingly.

## Choose Video Provider
---------------------------
Below are links to documentation for specific open and commercial video providers:

* [MRSS](./mrss-support.md)
* [YouTube](./youtube-support.md)
* [Brightcove](./brightcove-support.md)
* [Ooyala](./ooyala-support.md)
* [Kaltura](.kaltura-support.md)

