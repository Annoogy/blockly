/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {Minimap} from '../src/index';

/**
 * Create a workspace.
 * @param blocklyDiv The blockly container div.
 * @param options The Blockly options.
 * @returns The created workspace.
 */
function createWorkspace(blocklyDiv: HTMLElement,
    options: Blockly.BlocklyOptions): Blockly.WorkspaceSvg {
  const workspace = Blockly.inject(blocklyDiv, options);

  const minimap = new Minimap(workspace);
  minimap.init();

  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  createPlayground(document.getElementById('root'), createWorkspace,
      defaultOptions);
});
