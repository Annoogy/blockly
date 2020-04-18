#!/usr/bin/env node
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A script for creating Blockly packages based on pre-existing
 * templates.
 * @author samelh@google.com (Sam El-Husseini)
 */

'use strict';

const chalk = require('chalk');
const args = process.argv.slice(2);
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

const root = process.cwd();
const scriptName = '@blockly/create-package';
const usage = `  ${chalk.blue(scriptName)}\
 ${chalk.green('<plugin|field|block|theme>')}\
 ${chalk.green('<package-directory>')}

For example:\n  ${chalk.blue(scriptName)}\
 ${chalk.green('plugin')} ${chalk.green('my-blockly-plugin')}\n`;

const packageType = args[0];
// Check package type exists.
if (!packageType) {
  console.error('Please specify the package type.');
  console.log(`It can either be ${chalk.green('plugin')},\
 ${chalk.green('field')}, ${chalk.green('theme')} or ${chalk.green('block')}.`);
  console.log(usage);
  process.exit(1);
}
// Check package type.
if (!['plugin', 'field', 'block', 'theme'].includes(packageType)) {
  console.error(`Unknown package type: ${chalk.red(packageType)}`);
  console.log(usage);
  process.exit(1);
}
const packageName = args[1];
// Check package name.
if (!packageName) {
  console.error('Please specify the package directory:');
  console.log(usage);
  process.exit(1);
}
const packageDir = packageType == 'plugin' ? packageName :
  `${packageType}-${packageName}`;
const packagePath = path.join(root, packageDir);

// Check package name directory doesn't already exist.
if (fs.existsSync(packagePath)) {
  console.error(`Package directory already exists,
    Remove ${packageName} and try again.`);
  process.exit(1);
}

console.log(`Creating a new Blockly\
 ${chalk.green(packageType)} in ${chalk.green(root)}.\n`);

// Create the package directory.
fs.mkdirSync(packagePath);

const templateDir = `../templates/${packageType}/`;
const templateJson = require(path.join(templateDir, 'template.json'));

const packageJson = {
  name: `@blockly/${packageType}-${packageName}`,
  version: `0.${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.0`,
  description: templateJson.description || `A Blockly ${packageType}.`,
  scripts: templateJson.scripts || {
    'build': 'blockly-scripts build',
    'clean': 'blockly-scripts clean',
    'dist': 'blockly-scripts build prod',
    'lint': 'blockly-scripts lint',
    'prepublishOnly': 'npm run clean && npm run dist',
    'start': 'blockly-scripts start',
  },
  main: './dist/index.js',
  module: './src/index.js',
  unpkg: './dist/index.js',
  author: 'Blockly Team',
  keywords: ['blockly', `blockly-${packageType}`, packageName],
  homepage: `https://github.com/google/blockly-samples/tree/master/plugins/${packageDir}#readme`,
  bugs: {
    url: 'https://github.com/google/blockly-samples/issues',
  },
  repository: {
    'type': 'git',
    'url': 'https://github.com/google/blockly-samples.git',
    'directory': `plugins/${packageDir}`,
  },
  license: 'Apache-2.0',
  directories: {
    'dist': 'dist',
    'src': 'src',
  },
  files: [
    'dist',
    'src',
  ],
  devDependencies: { },
  peerDependencies: templateJson.peerDependencies || {
    'blockly': '>=3.20200123.0',
  },
  publishConfig: {
    'access': 'public',
    'registry': 'https://wombat-dressing-room.appspot.com',
  },
  engines: {
    'node': '>=8.17.0',
  },
  browserslist: [
    'defaults',
    'IE 11',
    'IE_Mob 11',
  ],
};

// Add dev dependencies.
const devDependencies = ['blockly', '@blockly/dev-scripts']
    .concat(Object.keys(templateJson.devDependencies));
devDependencies.forEach((dep) => {
  const latestVersion = execSync(`npm show ${dep} version`).toString();
  packageJson.devDependencies[dep] = `^${latestVersion.trim()}`;
});

// Write the package.json to the new package.
fs.writeFileSync(path.join(packagePath, 'package.json'),
    JSON.stringify(packageJson, null, 2));

// Write the README.md to the new package.
let readme = fs.readFileSync(path.resolve(__dirname, templateDir, 'README.md'),
    'utf-8');
readme = readme.replace(/template/gmi, packageName);
fs.writeFileSync(path.join(packagePath, 'README.md'), readme, 'utf-8');

// Copy the rest of the template folder into the new package.
fs.copySync(path.resolve(__dirname, templateDir, 'template'), packagePath);

// Run npm install.
console.log('Installing packages. This might take a couple of minutes.');
execSync(`cd ${packageDir} && npm install`, {stdio: [0, 1, 2]});

console.log(chalk.green('\nPackage created.\n'));
console.log('Next steps, run:');
console.log(chalk.blue(`  cd ${packageDir}`));
console.log(chalk.blue(`  npm start`));
console.log(`Search ${chalk.red(`'TODO'`)} to see remaining tasks.`);

process.exit(1);
