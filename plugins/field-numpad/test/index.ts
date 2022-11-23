/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Field test.
 */

import * as Blockly from 'blockly';
import {generateFieldTestBlocks, createPlayground} from '@blockly/dev-tools';
import '../src/index';

const toolbox = generateFieldTestBlocks('field_numpad', [
  {
    label: 'Basic',
    args: {
      'value': 50,
    },
  },
  {
    label: 'Min',
    args: {
      'value': 20,
      'min': 10,
    },
  },
  {
    label: 'Max',
    args: {
      'value': 70,
      'max': 80,
    },
  },
  {
    label: 'Min and Max',
    args: {
      'value': 60,
      'min': 10,
      'max': 80,
    },
  },
]);

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv: HTMLElement,
    options: Blockly.BlocklyOptions): Blockly.WorkspaceSvg {
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
    toolbox,
  };
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
