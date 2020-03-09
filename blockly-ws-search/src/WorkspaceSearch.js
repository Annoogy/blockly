/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Object responsible for workspace search.
 * @author aschmiedt@google.com (Abby Schmiedt)
 * @author kozbial@google.com (Monica Kozbial)
 */


import { injectSearchCss } from './css.js';
import * as Blockly from 'blockly/core';

export class WorkspaceSearch {
  /**
   * Class for workspace search.
   * @param {!Blockly.WorkspaceSvg} workspace
   */
  constructor(workspace) {
    /**
     * The workspace the search bar sits in.
     * @type {!Blockly.WorkspaceSvg}
     * @private
     */
    this.workspace_ = workspace;

    /**
     * HTML container for the search bar.
     * @type {?HTMLElement}
     * @private
     */
    this.htmlDiv_ = null;

    /**
     * The div that holds the search bar actions.
     * @type {?HTMLElement}
     * @protected
     */
    this.actionDiv_ = null;

    /**
     * The text input for the search bar.
     * @type {?HTMLInputElement}
     * @private
     */
    this.inputElement_ = null;

    /**
     * The placeholder text for the search bar input.
     * @type {string}
     * @private
     */
    this.textInputPlaceholder_ = 'Search';

    /**
     * A list of blocks that came up in the search
     * @type {!Array.<Blockly.BlockSvg>}
     * @protected
     */
    this.blocks_ = [];

    /**
     * Index of the currently "selected" block in the blocks array.
     * @type {number}
     * @protected
     */
    this.currentBlockIndex_ = -1;

    /**
     * Currently "selected" block.
     * @type {Blockly.BlockSvg}
     * @protected
     */
    this.currentBlock_ = null;

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

    /**
     * Whether search should be case sensitive.
     * @type {boolean}
     */
    this.caseSensitive = false;

    /**
     * Whether search should preserve the currently selected block by default.
     * @type {boolean}
     */
    this.preserveSelected = true;
  }

  /**
   * Initializes the workspace search bar.
   */
  init() {
    injectSearchCss();
    this.createDom_();
    this.setVisible(false);
  }

  /**
   * Creates and injects the search bar's DOM.
   * @protected
   */
  createDom_() {
    /*
     * Creates the search bar. The generated search bar looks like:
     * <div class="ws-search'>
     *   <div class="ws-search-container'>
     *     <div class="ws-search-content'>
     *       <div class="ws-search-input'>
     *         [... text input goes here ...]
     *       </div>
     *       [... actions div goes here ...]
     *     </div>
     *     [... close button goes here ...]
     *   </div>
     * </div>
     */
    const parentSvg = this.workspace_.getParentSvg();
    parentSvg.parentNode.addEventListener('keydown',
        evt => this.onWorkspaceKeyDown_(/** @type {KeyboardEvent} */ evt));

    this.htmlDiv_ = document.createElement('div');
    Blockly.utils.dom.addClass(this.htmlDiv_, 'ws-search');
    this.positionSearchBar();

    const searchContainer = document.createElement('div');
    Blockly.utils.dom.addClass(searchContainer, 'ws-search-container');

    const searchContent = document.createElement('div');
    Blockly.utils.dom.addClass(searchContent, 'ws-search-content');
    searchContainer.append(searchContent);

    const inputWrapper = document.createElement('div');
    Blockly.utils.dom.addClass(inputWrapper, 'ws-search-input');
    this.inputElement_ = this.createTextInput_();
    this.inputElement_.addEventListener('keydown',
        evt => this.onKeyDown_(/** @type {KeyboardEvent} */ evt));
    this.inputElement_.addEventListener('input', () => this.onInput_());
    this.inputElement_.addEventListener('click',
        () => this.searchAndHighlight(this.preserveSelected));
    inputWrapper.append(this.inputElement_);
    searchContent.append(inputWrapper);

    this.actionDiv_ = document.createElement('div');
    Blockly.utils.dom.addClass(this.actionDiv_, 'ws-search-actions');
    searchContent.append(this.actionDiv_);

    const nextBtn = this.createNextBtn_();
    if (nextBtn) {
      this.addActionBtn(nextBtn, () => this.next());
    }

    const previousBtn = this.createPreviousBtn_();
    if (previousBtn) {
      this.addActionBtn(previousBtn, () => this.previous());
    }

    const closeBtn = this.createCloseBtn_();
    if (closeBtn) {
      this.addBtnListener_(closeBtn, () => this.close())
      searchContainer.append(closeBtn);
    }

    this.htmlDiv_.append(searchContainer);

    parentSvg.parentNode.insertBefore(this.htmlDiv_, parentSvg);
  }

  /**
   * Add a button to the action div. This must be called after the init function
   * has been called.
   * @param {!HTMLButtonElement} btn The button to add the event listener to.
   * @param {!Function} onClickFn The function to call when the user clicks on 
   *     or hits enter on the button.
   */
  addActionBtn(btn, onClickFn) {
    this.addBtnListener_(btn, onClickFn);
    this.actionDiv_.append(btn);
  }

  /**
   * Creates the text input for the search bar.
   * @return {!HTMLInputElement} A text input for the search bar.
   * @protected
   */
  createTextInput_() {
    let textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.setAttribute('placeholder', this.textInputPlaceholder_);
    return textInput;
  }

  /**
   * Creates the button used to get the next block in the list.
   * @return {!HTMLButtonElement} The next button.
   * @protected
   */
  createNextBtn_() {
    return this.createBtn('next-btn', 'Find next');
  }

  /**
   * Creates the button used to get the previous block in the list.
   * @return {!HTMLButtonElement} The previous button.
   * @protected
   */
  createPreviousBtn_() {
    return this.createBtn('previous-btn', 'Find previous');
  }

  /**
   * Creates the button used for closing the search bar.
   * @return {!HTMLElement} A button for closing the search bar.
   * @protected
   */
  createCloseBtn_() {
    return this.createBtn('close-btn', 'Close search bar');
  }

  /**
   * Creates a button for the workspace search bar.
   * @param {string} className The class name for the button.
   * @param {string} text The text to display to the screen reader.
   * @return {!HTMLButtonElement} The created button.
   */
  createBtn(className, text) {
    // Create a span holding text to be used for accessibility purposes.
    const textSpan = document.createElement('span');
    textSpan.innerText = text;
    Blockly.utils.dom.addClass(textSpan, 'btn-text');

    // Create the button
    const btn = document.createElement('button');
    Blockly.utils.dom.addClass(btn, className);
    btn.append(textSpan);
    return btn;
  }

  /**
   * Add event listener for clicking and keydown on the given button.
   * @param {!HTMLButtonElement} btn The button to add the event listener to.
   * @param {!Function} onClickFn The function to call when the user clicks on 
   *     or hits enter on the button.
   * @private
   */
  addBtnListener_(btn, onClickFn) {
    btn.addEventListener('click', onClickFn);
    // TODO: Review Blockly's key handling to see if there is a way to avoid
    //  needing to call stopPropogation().
    btn.addEventListener('keydown', e => {
      if (e.key === "Enter") {
        onClickFn(e);
        e.preventDefault();  
      } else if (e.key === "Escape") {
        this.close();
      }
      e.stopPropagation();
    });
  }

  /**
   * Positions the search bar based on where the workspace's toolbox is.
   */
  positionSearchBar() {
    // TODO: Handle positioning search bar when window is resized.
    const metrics = this.workspace_.getMetrics();
    if (this.workspace_.RTL) {
      this.htmlDiv_.style.left = metrics.absoluteLeft + 'px';
    } else {
      if (metrics.toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {
        this.htmlDiv_.style.right = metrics.toolboxWidth + 'px';
      } else {
        this.htmlDiv_.style.right = '0';
      }
    }
    this.htmlDiv_.style.top = metrics.absoluteTop + 'px';
  }

  /**
   * Handles input value change in search bar.
   * @private
   */
  onInput_() {
    if (this.searchOnInput) {
      const inputValue = this.inputElement_.value;
      if (inputValue !== this.searchText_) {
        this.setSearchText_(inputValue);
        this.searchAndHighlight(this.preserveSelected);
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
        this.next();
      } else {
        this.setSearchText_(this.inputElement_.value);
        this.searchAndHighlight(this.preserveSelected);
      }
    }
  }

  /**
   * Opens the search bar when Control F or Command F are used on the workspace.
   * @param {KeyboardEvent} e The key down event.
   * @private
   */
  onWorkspaceKeyDown_(e) {
    // TODO: Look into handling keyboard shortcuts on workspace in Blockly.
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      this.open();
      e.preventDefault();
    }
  }

  /**
   * Selects the previous block.
   */
  previous() {
    if (!this.blocks_.length) {
      return;
    }
    this.setCurrentBlock_(this.currentBlockIndex_ - 1);
  }

  /**
   * Selects the next block.
   */
  next() {
    if (!this.blocks_.length) {
      return;
    }
    this.setCurrentBlock_(this.currentBlockIndex_ + 1);
  }

  /**
   * Sets the placeholder text for the search bar text input.
   * @param {string} placeholderText The placeholder text.
   */
  setSearchPlaceholder(placeholderText) {
    this.textInputPlaceholder_ = placeholderText;
    if (this.inputElement_) {
      this.inputElement_.setAttribute('placeholder', this.textInputPlaceholder_);
    }
  }

  /**
   * Sets search text.
   * @param {string} text
   * @protected
   */
  setSearchText_(text) {
    this.searchText_ = text.trim();
  }

  /**
   * Changes the currently "selected" block and adds extra highlight.
   * @param {number} index Index of block to set as current. Number is wrapped.
   * @protected
   */
  setCurrentBlock_(index) {
    if (!this.blocks_.length) {
      return;
    }
    if (this.currentBlock_) {
      this.unhighlightCurrentSelection_(this.currentBlock_);
    }
    this.currentBlockIndex_ =
        (index % this.blocks_.length + this.blocks_.length) %
        this.blocks_.length;
    this.currentBlock_ = this.blocks_[this.currentBlockIndex_];
    this.highlightCurrentSelection_(this.currentBlock_);
    this.updateCursor_(this.currentBlock_);
    this.scrollToVisible_(this.currentBlock_);
  }

  /**
   * Opens the search bar.
   */
  open() {
    this.setVisible(true);
    this.markCurrentPosition_();
    this.inputElement_.focus();
    if (this.searchText_) {
      this.searchAndHighlight();
    }
  }

  /**
   * Marks the user's current position when opening the search bar.
   */
  markCurrentPosition_() {
    const marker = this.workspace_.getMarker(Blockly.navigation.MARKER_NAME);
    if (this.workspace_.keyboardAccessibilityMode && marker &&
        !marker.getCurNode()) {
      const curNode = this.workspace_.getCursor().getCurNode();
      marker.setCurNode(curNode);
    }
  }

  /**
   * Closes the search bar.
   */
  close() {
    this.setVisible(false);
    this.workspace_.markFocused();
    this.clearBlocks();
  }

  /**
   * Shows or hides the workspace search bar.
   * @param {boolean} show Whether to set the search bar as visible.
   */
  setVisible(show) {
    this.htmlDiv_.style.display = show ? 'flex' : 'none';
  }

  /**
   * Searches the workspace for the current search term and highlights matching
   * blocks.
   * @param {boolean=} preserveCurrent Whether to preserve the current block
   *    if it is included in the new matching blocks.
   */
  searchAndHighlight(preserveCurrent) {
    let oldCurrentBlock = this.currentBlock_;
    this.clearBlocks();
    this.blocks_ = this.getMatchingBlocks_(
        this.workspace_, this.searchText_, this.caseSensitive);
    this.highlightSearchGroup(this.blocks_);
    let currentIdx = 0;
    if (preserveCurrent) {
      currentIdx = this.blocks_.indexOf(oldCurrentBlock);
      currentIdx = currentIdx > -1 ? currentIdx : 0;
    }
    this.setCurrentBlock_(currentIdx);
  }

  /**
   * Returns pool of blocks to search from.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get blocks from.
   * @return {!Array.<!Blockly.BlockSvg>} The search pool of blocks to use.
   * @private
  */
  getSearchPool_(workspace) {
    const blocks = (
        /** @type {!Array.<!Blockly.BlockSvg>} */
        workspace.getAllBlocks(true));
    return blocks.filter(function(block) {
      // Filter out blocks contained inside of another collapsed block.
      const surroundParent = block.getSurroundParent();
      return !surroundParent || !surroundParent.isCollapsed();
    });
  }

  /**
   * Returns whether the given block matches the search text.
   * @param {!Blockly.BlockSvg} block The block to check.
   * @param {string} searchText The search text. Note if the search is case
   *    insensitive, this will be passed already converted to lowercase letters.
   * @param {boolean} caseSensitive Whether the search is caseSensitive.
   * @return {boolean} Whether the block matches the search text.
   * @private
   */
  isBlockMatch_(block, searchText, caseSensitive) {
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
    if (!caseSensitive) {
      blockText = blockText.toLowerCase();
    }
    return blockText.includes(searchText);
  }

  /**
   * Returns blocks that match the given search text.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to search.
   * @param {string} searchText The search text.
   * @param {boolean} caseSensitive Whether the search should be case sensitive.
   * @return {!Array.<Blockly.BlockSvg>} blocks The blocks that match the search
   *    text.
   * @protected
   */
  getMatchingBlocks_(workspace, searchText, caseSensitive) {
    if (!searchText) {
      return [];
    }
    if (!this.caseSensitive) {
      searchText = searchText.toLowerCase();
    }
    const searchGroup = this.getSearchPool_(workspace);
    return searchGroup.filter(
        block => this.isBlockMatch_(block, searchText, caseSensitive));
  }

  /**
   * Clears the selection group and current block.
   */
  clearBlocks() {
    this.unhighlightSearchGroup(this.blocks_);
    if (this.currentBlock_) {
      this.unhighlightCurrentSelection_(this.currentBlock_);
    }
    this.currentBlock_ = null;
    this.currentBlockIndex_ = -1;
    this.blocks_ = [];
  }

  /**
   * Updates the location of the cursor if the user is in keyboard accessibility
   * mode.
   * @param {!Blockly.BlockSvg} block The block to set the cursor to.
   * @protected
   */
  updateCursor_(block) {
    if (this.workspace_.keyboardAccessibilityMode) {
      const currAstNode = Blockly.navigation.getTopNode(block);
      this.workspace_.getCursor().setCurNode(currAstNode);
    }
  }

  /**
   * Adds "current selection" highlight to the provided block.
   * Highlights the provided block as the "current selection".
   * @param {!Blockly.BlockSvg} currentBlock The block to highlight.
   * @protected
   */
  highlightCurrentSelection_(currentBlock) {
    const path = currentBlock.pathObject.svgPath;
    Blockly.utils.dom.addClass(path, 'search-current');
  }

  /**
   * Removes "current selection" highlight from provided block.
   * @param {Blockly.BlockSvg} currentBlock The block to unhighlight.
   * @protected
   */
  unhighlightCurrentSelection_(currentBlock) {
    const path = currentBlock.pathObject.svgPath;
    Blockly.utils.dom.removeClass(path, 'search-current');
  }

  /**
   * Adds highlight to the provided blocks.
   * @param {!Array.<Blockly.BlockSvg>} blocks The blocks to highlight.
   * @protected
   */
  highlightSearchGroup(blocks) {
    blocks.forEach(function(block) {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.addClass(blockPath, 'search-highlight');
    });
  }

  /**
   * Removes highlight from the provided blocks.
   * @param {!Array.<Blockly.BlockSvg>} blocks The blocks to unhighlight.
   * @protected
   */
  unhighlightSearchGroup(blocks) {
    blocks.forEach(function(block) {
      const blockPath = block.pathObject.svgPath;
      Blockly.utils.dom.removeClass(blockPath, 'search-highlight');
    });
  }

  /**
   * Scrolls workspace to bring given block into view.
   * @param {!Blockly.BlockSvg} block The block to bring into view.
   * @protected
   */
  scrollToVisible_(block) {
    if (!this.workspace_.isMovable()) {
      // Cannot scroll to block in a non-movable workspace.
      return;
    }
    // XY is in workspace coordinates.
    const xy = block.getRelativeToSurfaceXY();
    const scale = this.workspace_.scale;

    // Block bounds in pixels relative to the workspace origin (0,0 is centre).
    const width = block.width * scale;
    const height = block.height * scale;
    const top = xy.y * scale;
    const bottom = (xy.y + block.height) * scale;
    // In RTL the block's position is the top right of the block, not top left.
    const left = this.workspace_.RTL ? xy.x * scale - width: xy.x * scale;
    const right = this.workspace_.RTL ? xy.x * scale : xy.x * scale +  width;

    const metrics = this.workspace_.getMetrics();

    let targetLeft = metrics.viewLeft;
    const overflowLeft = left < metrics.viewLeft;
    const overflowRight = right > metrics.viewLeft + metrics.viewWidth;
    const wideBlock = width > metrics.viewWidth;

    if ((!wideBlock && overflowLeft) || (wideBlock && !this.workspace_.RTL)) {
      // Scroll to show left side of block
      targetLeft = left;
    } else if ((!wideBlock && overflowRight) ||
        (wideBlock && this.workspace_.RTL)) {
      // Scroll to show right side of block
      targetLeft = right - metrics.viewWidth;
    }

    let targetTop = metrics.viewTop;
    const overflowTop = top < metrics.viewTop;
    const overflowBottom = bottom > metrics.viewTop + metrics.viewHeight;
    const tallBlock = height > metrics.viewHeight;

    if (overflowTop || (tallBlock && overflowBottom)) {
      // Scroll to show top of block
      targetTop = top;
    } else if (overflowBottom) {
      // Scroll to show bottom of block
      targetTop = bottom - metrics.viewHeight;
    }
    if (targetLeft !== metrics.viewLeft || targetTop !== metrics.viewTop) {
      const activeEl = document.activeElement;
      this.workspace_.scroll(-targetLeft, -targetTop);
      if (activeEl) {
        // Blockly.WidgetDiv.hide called in scroll is taking away focus.
        // TODO: Review setFocused call in Blockly.WidgetDiv.hide.
        activeEl.focus();
      }
    }
  }
}
