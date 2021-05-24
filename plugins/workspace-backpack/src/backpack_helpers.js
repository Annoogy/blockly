/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper and utility methods for the Backpack plugin.
 * @author kozbial@google.com (Monica Kozbial)
 */

import * as Blockly from 'blockly/core';
import './msg';
import {BackpackChange} from './ui_events';

/**
 * Registers a context menu option to empty the backpack when right-clicked.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to register the
 *   context menu option on.
 */
function registerEmptyBackpack(workspace) {
  const prevConfigureContextMenu = workspace.configureContextMenu;
  workspace.configureContextMenu = (menuOptions, e) => {
    const backpack = workspace.backpack;
    if (!backpack || !backpack.getTargetArea().contains(e.clientX, e.clientY)) {
      prevConfigureContextMenu &&
      prevConfigureContextMenu.call(null, menuOptions, e);
      return;
    }
    menuOptions.length = 0;
    const backpackOptions = {
      text: Blockly.Msg['EMPTY_BACKPACK'],
      enabled: !!backpack.getCount(),
      callback: function() {
        backpack.empty();
      },
    };
    menuOptions.push(backpackOptions);
  };
}

/**
 * Registers a context menu option to remove a block from a backpack flyout.
 */
function registerRemoveFromBackpack() {
  const removeFromBackpack = {
    displayText: Blockly.Msg['REMOVE_FROM_BACKPACK'],
    preconditionFn: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.block.workspace;
      if (ws.isFlyout && ws.targetWorkspace && !! ws.targetWorkspace.backpack) {
        const backpack = ws.targetWorkspace.backpack;
        if (backpack.getFlyout().getWorkspace().id === ws.id) {
          return 'enabled';
        }
      }
      return 'hidden';
    },
    callback: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const backpack = scope.block.workspace.targetWorkspace.backpack;
      backpack.removeBlock(scope.block);
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'remove_from_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(removeFromBackpack);
}

/**
 * Registers context menu options for adding blocks to the backpack.
 */
function registerAddToBackpack() {
  const copyToBackpack = {
    displayText: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      if (!scope.block) {
        return;
      }
      const backpackCount = scope.block.workspace.backpack.getCount();
      return `${Blockly.Msg['COPY_TO_BACKPACK']} (${backpackCount})`;
    },
    preconditionFn: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.block.workspace;
      if (!ws.isFlyout && !!ws.backpack) {
        return ws.backpack.containsBlock(scope.block) ? 'disabled' : 'enabled';
      }
      return 'hidden';
    },
    callback: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const backpack = scope.block.workspace.backpack;
      backpack.addBlock(scope.block);
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'copy_to_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(copyToBackpack);
}

/**
 * Registers context menu options for adding blocks to the backpack.
 */
function registerCopyPasteAllBackpack() {
  const copyAllToBackpack = {
    displayText: Blockly.Msg['COPY_ALL_TO_BACKPACK'],
    preconditionFn: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.workspace;
      if (!ws.isFlyout && !!ws.backpack) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.workspace;
      ws.backpack.addBlocks(ws.getTopBlocks());
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'copy_all_to_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(copyAllToBackpack);
  const pasteAllFromBackpack = {
    displayText: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      if (!scope.workspace) {
        return;
      }
      const backpackCount = scope.workspace.backpack.getCount();
      return `${Blockly.Msg['PASTE_ALL_FROM_BACKPACK']} (${backpackCount})`;
    },
    preconditionFn: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.workspace;
      if (!ws.isFlyout && !!ws.backpack) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback: function(
        /** @type {!Blockly.ContextMenuRegistry.Scope} */ scope) {
      const ws = scope.workspace;
      const contents = ws.backpack.getContents();
      contents.forEach((blockText) => {
        const block =
            Blockly.Xml.domToBlock(Blockly.Xml.textToDom(blockText), ws);
        block.scheduleSnapAndBump();
      });
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    id: 'paste_all_from_backpack',
    // Use a larger weight to push the option lower on the context menu.
    weight: 200,
  };
  Blockly.ContextMenuRegistry.registry.register(pasteAllFromBackpack);
}

/**
 * Register all context menu options.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to register the
 *    context menu options.
 */
export function registerAllContextMenus(workspace) {
  registerEmptyBackpack(workspace);
  registerRemoveFromBackpack();
  registerAddToBackpack();
  registerCopyPasteAllBackpack();
}


/**
 * Converts XML representing a block into text that can be stored in the
 * content array.
 * @param {!Element} xml An XML tree defining the block and any
 *    connected child blocks.
 * @return {string} Text representing the XML tree, cleaned of all unnecessary
 * attributes.
 */
export function cleanBlockXML(xml) {
  const xmlBlock = xml.cloneNode(true);
  let node = xmlBlock;
  while (node) {
    // Things like text inside tags are still treated as nodes, but they
    // don't have attributes (or the removeAttribute function) so we can
    // skip removing attributes from them.
    if (node.removeAttribute) {
      node.removeAttribute('x');
      node.removeAttribute('y');
      node.removeAttribute('id');
      node.removeAttribute('disabled');
      if (node.nodeName == 'comment') {
        node.removeAttribute('h');
        node.removeAttribute('w');
        node.removeAttribute('pinned');
      }
    }

    // Try to go down the tree
    let nextNode = node.firstChild || node.nextSibling;
    // If we can't go down, try to go back up the tree.
    if (!nextNode) {
      nextNode = node.parentNode;
      while (nextNode) {
        // We are valid again!
        if (nextNode.nextSibling) {
          nextNode = nextNode.nextSibling;
          break;
        }
        // Try going up again. If parentNode is null that means we have
        // reached the top, and we will break out of both loops.
        nextNode = nextNode.parentNode;
      }
    }
    node = nextNode;
  }
  return Blockly.Xml.domToText(xmlBlock);
}
