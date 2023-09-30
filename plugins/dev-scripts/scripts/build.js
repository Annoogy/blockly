/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'build' script for Blockly extension packages.
 * This script:
 *   - Uses webpack to build the src directory in development mode if no
 *   additional arguments are passed.
 *   - Uses webpack to build the src directory in production mode if
 *   ``blockly-scripts build prod`` is called.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const path = require('path');
const fs = require('fs');

const chalk = require('chalk');
const esbuild = require('esbuild');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack.config');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const packageJson = require(resolveApp('package.json'));
console.log(`Running production build for ${packageJson.name}`);

// Create the webpack configuration for based on the build environment.
const args = process.argv.slice(2);
const skipLint = args.includes('--skip-lint');
const config = webpackConfig({
  mode: 'production',
  skipLint: skipLint,
});
if (!config.entry) {
  console.log(`${chalk.red(`Configuration error.`)}
Make sure a ${chalk.red('src/index.(js|ts)')} file is included in your package.
`);
  process.exit(1);
}

// Create and run the webpack compiler.
const compiler = webpack(config, (err, stats) => {
  const statsData = stats.toJson({
    all: false,
    warnings: true,
    errors: true,
  });

  const formatWebpackMessage = (obj) => {
    return obj.message.trim();
  };

  const messages = {
    errors: statsData.errors
        .map(formatWebpackMessage),
    warnings: statsData.warnings
        .map(formatWebpackMessage),
  };

  if (!messages.errors.length && !messages.warnings.length) {
    console.log(chalk.green('Compiled successfully!'));
  }
  if (messages.errors.length) {
    console.log(chalk.red('Failed to compile.\n'));
    console.log(messages.errors.join('\n\n'));
    process.exit(1);
  }
  if (messages.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));
  }
});


compiler.hooks.done.tap('esbuild', () => {
  if (packageJson.name === '@blockly/dev-tools') {
    return;
  }
  let entry;
  ['js', 'ts']
      .filter((ext) => fs.existsSync(resolveApp(`./src/index.${ext}`)))
      .forEach((ext) => {
        entry = `./src/index.${ext}`;
      });

  esbuild.build({
    entryPoints: [entry],
    outfile: 'dist/index.esm.js',
    bundle: true,
    sourcemap: true,
    minify: true,
    format: 'esm',
    external: [
      'blockly/core',
      'blockly/javascript',
      'blockly/python',
      'blockly/dart',
      'blockly/php',
      'blockly/lua',
    ],
  });
});

