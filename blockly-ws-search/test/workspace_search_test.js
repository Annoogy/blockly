/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for WorkspaceSearch.
 * @author kozbial@google.com (Monica Kozbial)
 */

const assert = require('assert');
const Blockly = require('blockly');
const sinon = require('sinon');

const WorkspaceSearch = require('../dist/workspace-search.umd').WorkspaceSearch;

suite('WorkspaceSearch', () => {
  setup(() => {
    this.jsdomCleanup =
        require('jsdom-global')('<!DOCTYPE html><div id="blocklyDiv"></div>');
    this.workspace = Blockly.inject('blocklyDiv');
    this.workspaceSearch = new WorkspaceSearch(this.workspace);
  });

  teardown(() => {
    this.jsdomCleanup();
  });

  suite('init()', () => {
    test('CSS is injected at init()', async () => {
      var searchStyle =
          document.getElementById('blockly-ws-search-style');
      assert.equal(!!searchStyle, false);
      this.workspaceSearch.init();
      searchStyle = document.getElementById('blockly-ws-search-style');
      assert.equal(!!searchStyle, true);
    });


    test('DOM is intialized at init()', async () => {
      var dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, false);
      this.workspaceSearch.init();
      dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, true);
    });
  });

  suite('dispose()', () => {
    test('DOM is disposed', async () => {
      this.workspaceSearch.init();
      var dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, true);
      this.workspaceSearch.dispose();
      dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, false);
    });
  });

  suite('searchAndHighlight()', () => {
    function isBlockHighlighted(block) {
      var path = block.pathObject.svgPath;
      var classes = path.getAttribute('class');
      return (' ' + classes + ' ')
          .indexOf(' blockly-ws-search-highlight ') !== -1;
    }
    function isBlockCurrentStyled(block) {
      var path = block.pathObject.svgPath;
      var classes = path.getAttribute('class');
      return (' ' + classes + ' ')
          .indexOf(' blockly-ws-search-current ') !== -1;
    }
    function assertNoExtraCurrentStyling(blocks, opt_expectedCurrent) {
      for (var block, i = 0; (block = blocks[i]); i++) {
        var isCurrentStyled = isBlockCurrentStyled(block);
        if (isCurrentStyled) {
          assert.equal(opt_expectedCurrent, block,
              'Unexpected block [' + block.type +
              '] found styled as current.');
        } else {
          assert.notEqual(block, opt_expectedCurrent,
              'Expected block [' + block.type + '] to be styled as current.');
        }
      }
    }
    function assertEqualsSearchGroup(allBlocks, actualGroup, expectedGroup) {
      assert.equal(actualGroup.length, expectedGroup.length);
      for (var block, i = 0; (block = allBlocks[i]); i++) {
        if (expectedGroup.indexOf(block) !== -1) {
          assert.equal(actualGroup.indexOf(block) !== -1, true,
              'Expected block [' + block.type + '] to be in search results');
          assert.equal(isBlockHighlighted(block), true,
              'Expected block [' + block.type + '] to be highlighted.');
        } else {
          assert.equal(actualGroup.indexOf(block) !== -1, false,
              'Unexpected block [' + block.type + '] in search results');
          assert.equal(isBlockHighlighted(block), false,
              'Unexpected block [' + block.type + '] found highlighted.');
        }
      }
    }
    setup(() => {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'test_block',
          'message0': 'test block'
        },
        {
          "type": "test_statement_block",
          "message0": "%test %1",
          "args0": [{
            "type": "input_value",
            "name": "INPUT0",
            "check": "String"
          }],
          "message1": "%block %1",
          "args1": [{
            "type": "input_statement",
            "name": "INPUT1"
          }],
          "previousStatement": null,
          "nextStatement": null
        },
        {
          "type": "test_text",
          "message0": "%1",
          "args0": [{
            "type": "field_input",
            "name": "NAME",
            "text": "test string"
          }],
          "output": null
        }
      ]);
      this.testBlock = this.workspace.newBlock('test_block');
      this.testStatementBlock = this.workspace.newBlock('test_statement_block');
      this.testStatementBlockWithInput =
          this.workspace.newBlock('test_statement_block');
      this.fieldWithOutputConnected =
          this.workspace.newBlock('test_text');
      this.testStatementBlockWithInput.inputList[0].connection
          .connect(this.fieldWithOutputConnected.outputConnection);
      this.testStatementBlockWithInputCollapsed =
          this.workspace.newBlock('test_statement_block');
      this.fieldWithOutputCollapsed =
          this.workspace.newBlock('test_text');
      this.testStatementBlockWithInputCollapsed.inputList[0].connection
          .connect(this.fieldWithOutputCollapsed.outputConnection);
      this.testStatementBlockWithInputCollapsed.setCollapsed(true);
      this.fieldWithOutput = this.workspace.newBlock('test_text');

      this.blocks = [
          this.testBlock,
          this.testStatementBlock,
          this.testStatementBlockWithInput,
          this.testStatementBlockWithInputCollapsed,
          this.fieldWithOutputConnected,
          this.fieldWithOutputCollapsed,
          this.fieldWithOutput
      ];

      sinon.stub(this.workspace, "getAllBlocks").returns(Object.values(this.blocks));
    });

    teardown(() => {
      delete Blockly.Blocks['test_block'];
      delete Blockly.Blocks['test_statement_block'];
      delete Blockly.Blocks['test_text'];
      sinon.restore();
    });

    test('Match all blocks', async () => {
      this.workspaceSearch.searchAndHighlight('test', false);
      var expectedBlocks = [
          this.testBlock,
          this.testStatementBlock,
          this.testStatementBlockWithInput,
          this.testStatementBlockWithInputCollapsed,
          this.fieldWithOutputConnected,
          this.fieldWithOutput
      ];
      assertEqualsSearchGroup(
          this.blocks, this.workspaceSearch.blocks_, expectedBlocks);
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
      assert.equal(isBlockHighlighted(this.fieldWithOutputCollapsed),
          false,
          'Expected field within a collapsed block to not be highlighted.');
    });

    test('Match no blocks', async () => {
      this.workspaceSearch.searchAndHighlight('none', false);
      assertEqualsSearchGroup(this.blocks, this.workspaceSearch.blocks_, []);
      assertNoExtraCurrentStyling(this.blocks);
    });

    test('Match all non-fields', async () => {
      this.workspaceSearch.searchAndHighlight('block', false);
      var expectedBlocks = [
          this.testBlock,
          this.testStatementBlock,
          this.testStatementBlockWithInput,
          this.testStatementBlockWithInputCollapsed
      ];
      assertEqualsSearchGroup(
          this.blocks, this.workspaceSearch.blocks_, expectedBlocks);
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });

    test('Match all field and collapsed blocks', async () => {
      this.workspaceSearch.searchAndHighlight('string', false);
      var expectedBlocks = [
          this.testStatementBlockWithInputCollapsed,
          this.fieldWithOutputConnected,
          this.fieldWithOutput
      ];
      assertEqualsSearchGroup(
          this.blocks, this.workspaceSearch.blocks_, expectedBlocks);
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });

    test('Preserve current, in results', async () => {
      this.workspaceSearch.searchAndHighlight('test', false);
      this.workspaceSearch.setCurrentBlock_(1);
      // this.testStatementBlock should be current.
      var expectedBlocks = [
        this.testBlock,
        this.testStatementBlock,
        this.testStatementBlockWithInput,
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput
      ];
      this.workspaceSearch.searchAndHighlight('test', true);
      assertEqualsSearchGroup(
          this.blocks, this.workspaceSearch.blocks_, expectedBlocks);
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[1]);
    });

    test('Preserve current, not in results', async () => {
      this.workspaceSearch.searchAndHighlight('test', false);
      this.workspaceSearch.setCurrentBlock_(1);
      // this.testStatementBlock should be current.
      this.workspaceSearch.searchAndHighlight('string', false);
      var expectedBlocks = [
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput
      ];
      assertEqualsSearchGroup(
          this.blocks, this.workspaceSearch.blocks_, expectedBlocks);
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });
  });

  suite('next()', () => {
    setup(() => {
      this.workspaceSearch.blocks_ =
          [ this.testBlock, this.testStatementBlock ];
    });

    test('next() with unset current', async () => {
      this.workspaceSearch.next();
      var currentIndex = this.workspaceSearch.currentBlockIndex_;
      assert.equal(currentIndex, 0);
    });

    test('next() wrap around', async () => {
      this.workspaceSearch.currentBlockIndex_ = 0;
      this.workspaceSearch.next();
      var currentIndex = this.workspaceSearch.currentBlockIndex_;
      assert.equal(currentIndex, 1);
      this.workspaceSearch.next();
      currentIndex = this.workspaceSearch.currentBlockIndex_;
      assert.equal(currentIndex, 0);
    });
  });

  suite('previous()', () => {
    setup(() => {
      this.workspaceSearch.blocks_ =
          [ this.testBlock, this.testStatementBlock ];
    });

    test('previous() with unset current', async () => {
      this.workspaceSearch.previous();
      // No expected current index, but should not throw.
    });

    test('previous() wrap around', async () => {
      this.workspaceSearch.currentBlockIndex_ = 1;
      this.workspaceSearch.previous();
      currentIndex = this.workspaceSearch.currentBlockIndex_;
      assert.equal(currentIndex, 0);
      this.workspaceSearch.previous();
      currentIndex = this.workspaceSearch.currentBlockIndex_;
      assert.equal(currentIndex, 1);
    });
  });
});
