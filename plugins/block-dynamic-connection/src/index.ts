/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Adds blocks that replace the built-in mutator UI with dynamic
 *     connections that appear when a block is dragged over inputs on the block.
 */

import * as Blockly from 'blockly/core';
import './dynamic_if';
import './dynamic_text_join';
import './dynamic_list_create';
import {decoratePreviewerWithDynamicConnections} from './connection_previewer';

export {decoratePreviewerWithDynamicConnections};

export const overrideOldBlockDefinitions = function (): void {
  Blockly.Blocks['lists_create_with'] = Blockly.Blocks['dynamic_list_create'];
  Blockly.Blocks['text_join'] = Blockly.Blocks['dynamic_text_join'];
  Blockly.Blocks['controls_if'] = Blockly.Blocks['dynamic_if'];
};
