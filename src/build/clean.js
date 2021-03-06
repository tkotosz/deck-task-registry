'use strict';

const del = require('del');
const path = require('path');

function buildClean(conf) {

  const deletePaths = [
    path.join(conf.themeConfig.root, conf.themeConfig.sass.dest),
    path.join(conf.themeConfig.root, conf.themeConfig.js.dest),
    path.join(conf.themeConfig.root, conf.themeConfig.images.dest),
    path.join(conf.themeConfig.root, conf.themeConfig.fonts.dest)
  ];

  // Delete all build dirs.
  return del(deletePaths, {
    force: true
  });

}

buildClean.displayName = 'build:clean';

module.exports = buildClean;