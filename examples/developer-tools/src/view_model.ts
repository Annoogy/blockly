/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import '@material/web/menu/menu';
import '@material/web/menu/menu-item';

export class ViewModel {
  mainWorkspaceDiv = document.getElementById('main-workspace');
  previewDiv = document.getElementById('block-preview');
  definitionDiv = document.getElementById('block-definition').firstChild;
  outputConfigDiv = document.getElementById('output-config');
  codeHeadersDiv = document.getElementById('code-headers').firstChild;
  generatorStubDiv = document.getElementById('generator-stub');

  createButton = document.getElementById('create-btn');
  deleteButton = document.getElementById('delete-btn');
  loadButton = document.getElementById('load-btn');
  loadMenu = document.getElementById('load-menu');

  /**
   * Gets a string representing the format of the block
   * definition the user selected.
   *
   * @returns Either 'json' or 'js' depending on which radio button is selected.
   */
  getBlockDefinitionFormat(): string {
    const radioButton = document.getElementById(
      'definition-json',
    ) as HTMLInputElement;
    return radioButton.checked ? 'json' : 'js';
  }

  /**
   * Gets the name of the code generator language the user selected.
   *
   * @returns The generator language name, in the same format as
   *    used by Blockly, e.g. `Javascript` or `Php`.
   */
  getCodeGeneratorLanguage(): string {
    const languageSelector = document.getElementById(
      'code-generator-language',
    ) as HTMLInputElement;
    return languageSelector.value;
  }

  getCodeHeaderStyle(): string {
    const radioButton = document.getElementById(
      'import-esm',
    ) as HTMLInputElement;
    return radioButton.checked ? 'import' : 'script';
  }
}
