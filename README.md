# Gulp Angular Components

This is a very cool architecture for creating Angular.js apps.

Benefits:

- Good, stable and most of all SIMPLE structure
- Faster development, believe me ;)
- Uses [John Papa](https://github.com/johnpapa/angular-styleguide) naming conventions
- Never fucking write boilerplate code anymore like: ```javascript angular.module('demo').directive('dashboard', myDirectiveFunction);``` etc.

*Works with [sourcemaps](https://www.npmjs.com/package/gulp-sourcemaps)*

# Install

```
npm install gulp-angular-components --save
```

# Usage

- Create a directory in your app / src directory named ```components```

gulpfile.js

```javascript
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var angularComponents = require('gulp-angular-components');

gulp.task('components', function () {

  var angularComponentsOptions = {
    moduleName: 'myAwesomeApp'
  };

  return gulp
    .src('src/components/*')
    .pipe(sourcemaps.init())
      .pipe(angularComponents(angularComponentsOptions))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.tmp/scripts'));
});
```

# Options
