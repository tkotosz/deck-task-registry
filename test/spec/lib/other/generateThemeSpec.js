'use strict';

const mock = require('mock-fs');
const chai = require('chai');
const chaiFiles = require('chai-files');
const expect = chai.expect;
const getFixture = require('../../../fixtures/getFixture');
const gulp = require('gulp');

chai.use(chaiFiles);
const file = chaiFiles.file;
const dir = chaiFiles.dir;
const proxyquire = require('proxyquire').noCallThru();
const generateTheme = proxyquire('../../../../src/other/generateTheme', {
  '../helpers/findRoot': function () {
    return '../docroot';
  },
  'transliteration': {
    'slugify': function () {
      // We have to mock this as it doesn't seem to work properly in tests.
      return 'test';
    }
  }
});

describe('generateTheme', function () {

  // The generator is slow, even with a mocked Drupal root finder :(.
  this.timeout(10000);
  let originalArgs = process.argv;

  beforeEach(function () {

    process.argv = [
      'foo',
      'bar',
      '--theme=Test'
    ];

    mock({
      '../docroot': {
        'themes': {
          'contrib': {
            'deck': {
              'subtheme': {
                '.gitignore': 'node_modules',
                '.eslintrc': '',
                'package.json': '{}',
                'hooks': {
                  'preprocess': {
                    'page.inc': '<?php'
                  },
                },
                'SUBTHEME.info.yml.tpl': getFixture('subtheme/subtheme.info.yml'),
                'SUBTHEME.libraries.yml.tpl': '',
                'SUBTHEME.theme': getFixture('subtheme/subtheme.theme'),
                'assets': {
                  'src': {
                    'js': {
                      '.gitkeep': ''
                    },
                    'sass': {
                      'main.scss': getFixture('assets/src/scss/pristineSass.scss'),
                    },
                    'fonts': {
                      '.gitkeep': ''
                    }
                  }
                }
              },
            }
          }
        }
      }
    });
  });

  afterEach(function () {
    process.argv = originalArgs;
    mock.restore();
  });

  it('throws an error if Deck doesn\'t exist', function () {

    mock.restore();

    mock({
      '../docroot': {
        'themes': {
          'contrib': {
            'emptyDir': {}
          }
        }
      }
    });

    expect(generateTheme).to.throw(Error, 'Deck was not found.');

  });

  it('creates core files', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const infoFile = file('../docroot/themes/custom/test/test.info.yml');
      const librariesFile = file('../docroot/themes/custom/test/test.libraries.yml');
      const themeFile = file('../docroot/themes/custom/test/test.theme');

      expect(infoFile).to.exist;
      expect(librariesFile).to.exist;
      expect(themeFile).to.exist;

      done();

    });

  });

  it('replaces placeholders in core files', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const infoFile = file('../docroot/themes/custom/test/test.info.yml');

      expect(infoFile).to.contain('name: Test');
      expect(infoFile).to.contain('description: Theme for Test.');
      expect(infoFile).not.to.contain('{{ SUBTHEME }}');

      const themeFile = file('../docroot/themes/custom/test/test.theme');

      expect(themeFile).to.contain('Functions to support the Test theme.');
      expect(themeFile).not.to.contain('{{ SUBTHEME }}');

      done();

    });

  });

  it('creates the assets directories', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const assetsDir = dir('../docroot/themes/custom/test/assets/src');
      const sassDir = file('../docroot/themes/custom/test/assets/src/sass/main.scss');
      const jsDir = file('../docroot/themes/custom/test/assets/src/js/.gitkeep');
      const fontsDir = file('../docroot/themes/custom/test/assets/src/fonts/.gitkeep');

      expect(assetsDir).to.exist;
      expect(sassDir).to.exist;
      expect(jsDir).to.exist;
      expect(fontsDir).to.exist;

      done();

    });

  });

  it('copies dotfiles', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const gitIgnore = file('../docroot/themes/custom/test/.gitignore');
      const eslintrc = file('../docroot/themes/custom/test/.eslintrc');

      expect(gitIgnore).to.exist;
      expect(eslintrc).to.exist;

      done();

    });

  });

  it('copies hooks', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const hookFile = file('../docroot/themes/custom/test/hooks/preprocess/page.inc');

      expect(hookFile).to.exist;

      done();

    });

  });

  it('copies the package.json', function (done) {

    const generator = generateTheme({}, gulp);

    generator.on('finish', function () {

      const packageJson = file('../docroot/themes/custom/test/package.json');

      expect(packageJson).to.exist;

      done();

    });

  });

});