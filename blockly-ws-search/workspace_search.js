/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object responsible for workspace search.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */
'use strict';


class WorkspaceSearch {
  constructor(workspace) {
    /**
     * The workspace the trashcan sits in.
     * @type {!Blockly.WorkspaceSvg}
     * @private
     */
    this.workspace_ = workspace;

    /**
     * The svg group
     * @type {Element}
     * @private
     */
    this.svgGroup_ = null;

    /**
     * A list of blocks that came up in the search
     * @type {!Array.<Blockly.Block>}
     * @protected
     */
    this.blocks_ = [];

    /**
     * Index of the currently "selected" block in the blocks array.
     * @type {number}
     * @protected
     */
    this.blockIndex_ = -1;

    /**
     * The search text.
     * @type {string}
     * @protected
     */
    this.searchText_ = '';

    /**
     * Whether to search as input changes as opposed to on enter.
     * @type {boolean}
     */
    this.searchOnInput = true;
  }

  /**
   * Initializes the workspace search bar.
   */
  init() {
    var svg = this.workspace_.getParentSvg();
    var metrics = this.workspace_.getMetrics();

    // Create the text input for search.
    var textInput = document.createElement('input');
    Blockly.utils.dom.addClass(textInput, 'searchInput');
    textInput.type = 'text';

    // TODO: Figure out how we are going to deal with translating.
    textInput.setAttribute('placeholder', 'Search');
    Blockly.bindEventWithChecks_(textInput, 'keydown', this, this.onKeyDown_);
    Blockly.bindEventWithChecks_(textInput, 'input', this, this.onInput_);

    // Add all the buttons for the search bar
    var upBtn = this.createBtn_('upBtn', 'Find previous', this.previous_);
    var downBtn = this.createBtn_('downBtn', 'Find next', this.next_);
    var closeBtn = this.createBtn_('closeBtn', 'Close search bar', this.close);

    this.HtmlDiv = document.createElement('div');
    Blockly.utils.dom.addClass(this.HtmlDiv, 'workspaceSearchBar');

    if (this.workspace_.RTL) {
      this.HtmlDiv.style.left = metrics.absoluteLeft + 'px';
    } else {
      if (metrics.toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {
        this.HtmlDiv.style.right = metrics.toolboxWidth + 'px';
      } else {
        this.HtmlDiv.style.right = '0';
      }
    }
    this.HtmlDiv.style.top = metrics.absoluteTop + 'px';

    this.HtmlDiv.append(textInput);
    this.HtmlDiv.append(upBtn);
    this.HtmlDiv.append(downBtn);
    this.HtmlDiv.append(closeBtn);

    svg.parentNode.insertBefore(this.HtmlDiv, svg);
    this.setVisible(false);
  }

  /**
   * Creates a button for the workspace search bar.
   * @param {string} name The class name for the button.
   * @param {string} text The text to display to the screen reader.
   * @param {!Function} onClickFn The function to call when the user clicks on the button.
   * @return {HTMLButtonElement} The created button.
   * @private
   */
  createBtn_(className, text, onClickFn) {
    // Create a span holding text to be used for accessibility purposes.
    var textSpan = document.createElement('span');
    textSpan.innerText = text;
    Blockly.utils.dom.addClass(textSpan, 'btnText');

    // Create the button
    var btn = document.createElement('button');
    Blockly.utils.dom.addClass(btn, className);
    Blockly.bindEventWithChecks_(btn, 'click', this, onClickFn);
    btn.append(textSpan);
    return btn;
  }

  /**
   * Handles input value change in search bar.
   * @param {Event} e The oninput event.
   */
  onInput_(e) {
    if (this.searchOnInput) {
      const inputValue = e.target.value;
      if (inputValue !== this.searchText_) {
        this.setSearchText_(inputValue);
        this.search();
      }
    }
  }

  /**
   * Handles a key down for the search bar.
   * @param {KeyboardEvent} e The key down event.
   * @private
   */
  onKeyDown_(e) {
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'Enter') {
      if (this.searchOnInput) {
        this.next_();
      } else {
        this.setSearchText_(e.target.value);
        this.search();
      }
    }
  }

  /**
   * Sets search text.
   * @param {string} text
   * @protected
   */
  setSearchText_(text) {
    this.searchText_ = text.trim()
  }

  /**
   * Selects the previous block.`
   * @private
   */
  previous_() {
    if (!this.blocks_.length) {
      return;
    }
    this.selectBlock_(this.blockIndex_ - 1);
    console.log("Get previous value");
  }

  /**
   * Selects the next block.
   * @private
   */
  next_() {
    if (!this.blocks_.length) {
      return;
    }
    this.selectBlock_(this.blockIndex_ + 1);
    console.log("Get next value");
  }

  /**
   * Selects the block at the given index.
   * @param {number} index Index of block to select. Number is wrapped.
   * @protected
   */
  selectBlock_(index) {
    if (!this.blocks_.length) {
      return;
    }
    this.blockIndex_ = index % this.blocks_.length;
    if (this.workspace_.rendered) {
      const selectedBlock = this.blocks_[this.blockIndex_];
      (/** @type {!Blockly.BlockSvg} */ selectedBlock).select();
      // TODO: scroll to block if it is not visible on workspace
    }
  }

  /**
   * Disposes of workspace search.
   * Unlink from all DOM elements to prevent memory leaks.
   * @suppress {checkTypes}
   */
  dispose() {
    if (this.HtmlDiv) {
      Blockly.utils.dom.removeNode(this.HtmlDiv);
    }  
  }

  /**
   * Opens the search bar.
   */
  open() {
    this.setVisible(true);
    if (this.searchText_) {
      this.search();
    }
    console.log("Open search bar");
  }

  /**
   * Closes the search bar.
   */
  close() {
    this.setVisible(false);
    this.clearBlocks();
    console.log("Close search bar");
  }

  /**
   * Shows or hides the workspace search bar.
   * @param {boolean} show True to set the search bar as visible. False otherwise. 
   */
  setVisible(show) {
    this.HtmlDiv.style.display = show ? 'flex' : 'none';
  }

  /**
   * Searches the workspace for the current search term.
   */
  search() {
    this.clearBlocks();
    this.populateBlocks();
    this.highlightBlocks();
    this.next_();
  }

  /**
   * Returns pool of blocks to search from.
   * @return {!Array.<!Blockly.Block>}
   * @private
   */
  getSearchPool_() {
    const blocks = /** @type {!Array.<!Blockly.Block>} */
    (this.workspace_.getAllBlocks(true));
    return blocks.filter(function(block) {
      // Filter out blocks contained inside of another collapsed block.
      const surroundParent = block.getSurroundParent();
      return !surroundParent || !surroundParent.isCollapsed();
    });
  }

  /**
   * Returns whether the given block matches the provided text.
   * @param {!Blockly.Block} block The block to check.
   * @param {string} text The text to search the block for.
   * @private
   */
  isBlockMatch_(block, text) {
    let blockText = '';
    if (block.isCollapsed()) {
      // Search the whole string for collapsed blocks.
      blockText = block.toString();
    } else {
      const topBlockText = [];
      block.inputList.forEach(function(input) {
        input.fieldRow.forEach(function(field) {
          topBlockText.push(field.getText());
        });
      });
      blockText = topBlockText.join(' ').trim();
    }
    return blockText.includes(text);
  }

  /**
   * Populates block list with blocks that match the search text.
   */
  populateBlocks() {
    if (!this.searchText_) {
      return;
    }
    const searchGroup = this.getSearchPool_();
    const isBlockMatch = this.isBlockMatch_;
    const text = this.searchText_;
    this.blocks_ = searchGroup.filter(
        function(block) {
          return isBlockMatch(block, text);
    });
  }

  /**
   * Clears the block list.
   */
  clearBlocks() {
    this.unHighlightBlocks();
    this.blocks_ = [];
    this.blockIndex_ = -1;
  }

  /**
   * Adds highlight to blocks in block list.
   */
  highlightBlocks() {
    if (!this.workspace_.rendered) {
      return;
    }
    this.blocks_.forEach(function(/** @type {!Blockly.BlockSvg} */ block) {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.addClass(blockPath, 'searchHighlight');
    });
  }

  /**
   * Removes highlight from blocks in block list.
   */
  unHighlightBlocks() {
    if (!this.workspace_.rendered) {
      return;
    }
    this.blocks_.forEach(function(/** @type {!Blockly.BlockSvg} */ block) {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.removeClass(blockPath, 'searchHighlight');
    });
  }
}
