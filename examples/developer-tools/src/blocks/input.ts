/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Check to see if more than one input has this name.
 * If so, applies a warning to the block.
 * 
 * Highly inefficient (On^2), but n is small.
 * @param referenceBlock Block to check.
 */
const checkNameConflicts = function (referenceBlock: Blockly.Block) {
  if (referenceBlock.isDeadOrDying()) return;
  const name = referenceBlock.getFieldValue('INPUTNAME').toLowerCase();
  let count = 0;
  const blocks = referenceBlock.workspace.getAllBlocks(false);
  for (const block of blocks) {
    const otherName = block.getFieldValue('INPUTNAME');
    if (
      block.isEnabled() &&
      !block.getInheritedDisabled() &&
      otherName &&
      otherName.toLowerCase() === name
    ) {
      count++;
    }
  }
  const msg =
    count > 1 ? 'There are ' + count + ' input blocks\n with this name.' : null;
  referenceBlock.setWarningText(msg, 'duplicatename');
};

// Inputs that should take a "type" input for connection checks
const inputsWithTypeInputs = new Set(['input_value', 'input_statement']);

const updateTypeInputs = function (
  this: Blockly.Block,
  value: string,
): undefined {
  if (inputsWithTypeInputs.has(value)) {
    if (!this.getInput('TYPE')) {
      this.appendValueInput('TYPE')
        .setCheck(['TypeArray', 'Type'])
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('type');
    }
  } else {
    this.removeInput('TYPE', true);
  }
};

const tooltip: Record<string, string> = {
  input_value: 'A value socket for horizontal connections.',
  input_statement: 'A statement socket for enclosed vertical stacks.',
  input_dummy:
    'For adding fields without any block connections. Alignment options (left, right, centre) only affect multi-row blocks.',
  input_end_row:
    'For adding fields without any block connections that will be rendered on a separate row from any following inputs. Alignment options (left, right, centre) only affect multi-row blocks.',
};

export const input = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown(
          [
            ['value', 'input_value'],
            ['statement', 'input_statement'],
            ['dummy', 'input_dummy'],
            ['end-row', 'input_end_row'],
          ],
          updateTypeInputs.bind(this),
        ),
        'INPUT_TYPE',
      )
      .appendField('input')
      .appendField(new Blockly.FieldTextInput('NAME'), 'INPUTNAME');
    this.appendStatementInput('FIELDS')
      .setCheck('Field')
      .appendField('fields')
      .appendField(
        new Blockly.FieldDropdown([
          ['left', 'LEFT'],
          ['right', 'RIGHT'],
          ['centre', 'CENTRE'],
        ]),
        'ALIGNMENT',
      );
    this.setPreviousStatement(true, 'Input');
    this.setNextStatement(true, 'Input');
    this.setStyle('input');
    this.setTooltip((): string => {
      const value = this.getFieldValue('INPUT_TYPE');
      return tooltip[value];
    });
    this.setHelpUrl('https://www.youtube.com/watch?v=s2_xaEvcVI0#t=71');
  },
  onchange: function () {
    checkNameConflicts(this);
  },
};
