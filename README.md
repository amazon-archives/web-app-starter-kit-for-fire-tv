
# Web App Starter Kit for Fire TV
-------------------

Welcome! This is the source repository for the Web App Starter Kit for Fire TV, a getting started kit for creating a video or media focused web app for Fire TV.

Amazon Fire TV includes Amazon WebView, an advanced Chromium-based web engine common to all Fire OS devices. This enables the Fire TV to use the latest HTML5 functionality such as GPU accelerated CSS3 transforms and a recent JavaScript engine. 

We have created the Starter Kit to give web developers an easier entry into developing applications for Fire TV devices. The starter kit provides a minimal media app that uses the FireTV remote effectively and provides a user experience consistent with the rest of the device.  It can be used as-is, or as a structural piece of a richer app.

A live running example can be found at: [http://amzn.github.io/web-app-starter-kit-for-fire-tv](http://amzn.github.io/web-app-starter-kit-for-fire-tv/ "Live Template Example")

## Setup
-------------------

### Acquiring the source code
-------------------

Clone the repository to your local development environment. 

		git clone https://github.com/amzn/web-app-starter-kit-for-fire-tv.git

### Setting up the test server
-------------------

Sample data has been included to get you started, but because the template uses XHR to retrieve JSON data, you will need to serve the files using an HTTP server locally for testing.  This can be done using a variety of methods, including using the command line and navigating to the /template directory:

* Using Python, create a simple local server with this command: `python -m SimpleHTTPServer 3000`
* Using Node and NPM, install the [Serve package](https://www.npmjs.org/package/serve), then create the server: 

		npm install -g serve
		serve -p 3000

Both of these methods should result in you being able to access the template in your browser or [Web App Tester](http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8) at `http://your-ip-address:3000`. 

### Setting up a test environment
-------------------

We recommend testing the template with Chrome when developing on a desktop computer.  While any webkit-compatible browser will work (the app uses -webkit prefixes only), the web view in FireTV is based on the Chromium project and Chrome offers excellent emulation and debugging support

The template is designed for a 1080p display, and will be most accurately viewed by using Chrome's emulation to specify the screen size. Insructions to enable this can be found here: [Device Mode & Mobile Emulation](https://developer.chrome.com/devtools/docs/device-mode) The resolution should be set to 1920x1080 and the Device Pixel Ratio should be 1. (Use "Shrink to fit" on smaller screens.)

To test this app on a FireTV device, please refer to the [Web App Tester](http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8).

### Setup of the SASS script file
-------------------

The template uses SASS as its main source of CSS content. SASS is a language which compiles down to standard CSS. In the template, we have included a precompiled CSS file in the `/css` directory. 

You're welcome to modify the CSS directly, but we recommend working with the SASS source instead. Please refer to the [SASS Install](http://sass-lang.com/install) link for more information on setting up SASS in your development environment. 

More information on the SASS structure please read the [Styling Document](./docs/styling.md)

## Customizing the template
-------------------

The source is released under the Creative Commons License. The HTML templates are contained in the `index.html` file, the SASS file is in `firetv.scss` with a `_variables.scss` which allows you to easily modify commonly used look and feel aspects through SASS. For more information on styling the template read the [Styling Document](./docs/styling.md)

The template has some rudimentary support for theming from the JSON data, allowing simple style customization on the fly.  For more on customizing or modifying they style sheets, please refer to the [Styling Document](./docs/styling.md).

For information on developing using the template and modifying app functionality please refer to the [Architecture Overview](./docs/architecture.md). 

## More information
-------------------

For more information about developing web apps for Amazon devices, please see:

* [Amazon HTML5 Web Apps Developer Portal](https://developer.amazon.com/public/solutions/platforms/webapps)
* [Web App Tester](http://www.amazon.com/Amazon-Digital-Services-Inc-Tester/dp/B00DZ3I1W8)
* [Amazon Fire TV Developer Portal](https://developer.amazon.com/public/solutions/devices/fire-tv)


## Discussion
-------------------

If you have any questions, concerns or problems with the Fire TV Web App templates, please submit issues, or post a message on GitHub or to the [Amazon Developer Portal Forums](http://forums.developer.amazon.com/forums/category.jspa?categoryID=39).  Pull requests are also welcome.

## License
-------------------
The template is released as open source under the Creative Commons License. For more information on this license please refer to the following link: [Creative Commons License CC0](http://creativecommons.org/publicdomain/zero/1.0/)

