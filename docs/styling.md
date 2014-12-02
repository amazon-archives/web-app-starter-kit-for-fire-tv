# Styling The Template
-------
Styles for this app were created using sass. If you aren't familiar with sass you can get more information here : [SASS-Lang](http://sass-lang.com/)

## SASS
-------

Sass gives us the ability to create variables that can be used in style declarations, making it easy for any user to quickly theme the app to suite their needs.
There are two sass files that are used to create the final CSS file used by the application.

* `firetv.scss` : all the styling properties for the app with the exception of variables are in this file.
* `_variables.scss` : all sass variables are managed in this file, which is then included into the firetv.scss. By changing the style properties in this file you can customize the look and feel to suit your own needs. NOTE : file names of included sass file must begin with an underscore (i.e. _variables.scss)

- Styles in the firetv.scss file are organized by view type, in the order in which they are navigated in the app

    1. All global HTML styles are defined first
    2. leftnav
    3. fullrow - this is also called the 1D or shoveler view in the application
    4. player
    5. spinner
    6. The CSS animations that are used in the application are defined last.

- Types of Variables : variables are separated by type (font-face, font-size, color etc)
- Generic & Specific Variables : generic variables are used to define general colors and sizes etc. while specific variables define properties that are specific to elements in the application, this is done so that a single color is only defined once, but may be used in several elements. This makes it easier to change the look and feel of the theme quickly and easily.
- Variable Names Convention :
    EXAMPLE : $color-font-leftnav-selected
    1. All variables begin with the dollar sign ($)
    2. The first part of the name is the CSS property in most cases. Some exceptions are shadow and ani, which are shortened for simplicity sake.
    3. The second part of the name is what the property is applied to (i.e. bg, font etc),
    4. Type of application element - this is for specific variables (i.e. leftnav, tombstone),
    5. Finally if the variable defines a specific state (i.e. static, selected etc) then it is the last part of the variable name

Usage :

- Variable Usage : Variables are used for all colors, font-family and font-size values. Other variables may be used for items that are repeated in the styles more than once - such as box-shadow.

css:

* `css/firetv.css` : the application links to this file - which is created by compliling the scss files. For additional information on processing sass go here : [Sass-install](http://sass-lang.com/install)

NOTE : The compiled CSS file resides in a CSS directory, which is where it is referenced by the index file.. The sass files are located at the root level of the directory, so make sure that when you complile the CSS that it ends up in the correct location.
