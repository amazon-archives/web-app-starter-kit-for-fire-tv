# Styling The Template
-------
Styles for this app were created using Sass. If you aren't familiar with Sass you can get more information here: [Sass-Lang](http:/sass-lang.com/)

## Sass
-------

Sass gives us the ability to create variables that can be used in style declarations, making it easy for any user to quickly theme the app to suite their needs.

There are four Sass files that are used to create the final CSS file used by the application.

* `_common.scss` : all the styling properties for the app with the exception of variables are in this file.
* `_mixins.scss` : all of the utility mixins used throughout the common .scss are in this file
* `_variables.scss` : all base Sass variables are managed in this file. By changing the style properties in this file you can customize the look and feel to suit your own needs.
* `firetv.scss` :  each project will contain a main sass file used to load the shared scss files above, as well as providing an area to override the variables and SCSS/CSS. 

    NOTE : File names of included Sass file must begin with an underscore (i.e. `_variables.scss`)

Styles in the _common.scss file are organized by view type, in the order in which they are navigated in the app

   All global HTML styles are defined first
   * leftnav-view
   * one-D-view 
   * shoveler-view
   * player-view
   * spinner
   * The CSS animations that are used in the application are defined last.
   * Media Queries - there are a few media queries for smaller device layout handling

The SCSS files are located here:

* `src/common/scss/_variables.scss` : The preset Sass variables used by the common css. 
* `src/common/scss/_mixins.scss` : Helper mixins used throughout the common Sass, for things such as auto-prefixing, browser compatibility, and other utility pieces. 
* `src/common/scss/_common.scss` : All of the common css rules for the entire template. 
* `src/projects/<project-name>/firetv.scss` : The main sass file for the given individual project.  

For additional information on installing sass go here : [Sass-install](http://sass-lang.com/install)


**Variable Names**

EXAMPLE : $color-text-leftnav-search 

   * All variables begin with the dollar sign ($)
   * The first part of the name is the CSS property in most cases. Some exceptions are shadow and ani, which are shortened for simplicity sake.
   * The second part of the name will either be a css property or an application element(i.e. leftnav).
   * There may be a differentiator (i.e. primary or secondary). 
   * The property the variable applies to (i.e. bg, text).

**Theming** :

For specific information on theming your template application refer the [Theming Guide](./theming_guide.pdf)
