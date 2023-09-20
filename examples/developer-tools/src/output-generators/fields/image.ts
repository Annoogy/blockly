/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {JsonDefinitionGenerator, jsonDefinitionGenerator} from '../json_definition_generator';

jsonDefinitionGenerator.forBlock['field_image'] = function(
    block: Blockly.Block,
    generator: JsonDefinitionGenerator
): string {
  const code = {
    type: 'field_image',
    src: block.getFieldValue('SRC'),
    width: block.getFieldValue('WIDTH'),
    height: block.getFieldValue('HEIGHT'),
    alt: block.getFieldValue('ALT'),
    flipRtl: block.getFieldValue('ALT_RTL'),
  };
  return JSON.stringify(code);
};
