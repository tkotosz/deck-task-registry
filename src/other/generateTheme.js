'use strict';

const gulp = require('gulp');
const path = require('path');
const findRoot = require('../helpers/findRoot');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const merge = require('merge-stream');
const fs = require('fs');
const minimist = require('minimist');
const slugify = require('transliteration').slugify;

function generateDeckTheme() {

  const allowedArgs = {
    "string": [
      "theme"
    ]
  };

  const settings = minimist(process.argv.slice(2), allowedArgs);

  if (typeof settings.theme !== 'string' || settings.theme === '') {
    throw new Error('You didn\'t give me a name.');
  }

  settings.machineName = slugify(settings.theme);

  const drupalRoot = findRoot();
  const deckRoot = path.join(drupalRoot, 'themes', 'contrib', 'deck', 'subtheme');

  // Check to see if Deck actually exists.
  try {
    fs.statSync(deckRoot);
  } catch (err) {
    throw new Error('Deck was not found.');
  }

  // Build out the subtheme.
  const newThemeDest = path.join(drupalRoot, 'themes', 'custom', settings.machineName);

  const srcOpts = {
    dot: true
  };

  // Copy out the core files required for the theme.
  const coreFileBuilder = gulp.src(path.join(deckRoot, '*.{yml,yml.tpl,theme}'), srcOpts)
    .pipe(replace('{{ SUBTHEME }}', settings.theme))
    .pipe(
      rename(function (filePath) {
        filePath.basename = filePath.basename.replace('SUBTHEME', settings.machineName);
        // If we have a yml.tpl file, then make it a yml file.
        if (path.extname(filePath.basename) === '.yml') {
          filePath.basename = filePath.basename.replace('.yml', '');
          filePath.extname = '.yml';
        }
      })
    )
    .pipe(gulp.dest(newThemeDest));

  // Copy out the assets.
  const assetsBuilder = gulp.src(path.join(deckRoot, 'assets', '**', '*'), srcOpts)
    .pipe(gulp.dest(path.join(newThemeDest, 'assets')));

  // Copy the dotfiles.
  const dotfileBuilder = gulp.src(path.join(deckRoot, '.*'), srcOpts)
    .pipe(gulp.dest(newThemeDest));

  // Copy the hooks directory.
  const hookBuilder = gulp.src(path.join(deckRoot, 'hooks', '**', '*'))
    .pipe(gulp.dest(path.join(newThemeDest, 'hooks')));

  // Copy the package.json.
  const packageJsonBuilder = gulp.src(path.join(deckRoot, 'package.json'))
    .pipe(gulp.dest(newThemeDest));

  return merge(assetsBuilder, coreFileBuilder, dotfileBuilder, hookBuilder, packageJsonBuilder);

}

generateDeckTheme.displayName = 'generate-deck-subtheme';

module.exports = generateDeckTheme;