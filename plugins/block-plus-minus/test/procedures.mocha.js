/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const Blockly = require('blockly/node');
const {testHelpers} = require('@blockly/dev-tools');
const procedureTestHelpers = require('./procedures_test_helpers.mocha');

require('../src/index');

const assert = chai.assert;
const {CodeGenerationTestSuite, runCodeGenerationTestSuites,
  runSerializationTestSuite, SerializationTestCase} = testHelpers;
const {assertDefBlockStructure, assertCallBlockStructure,
  assertProcBlocksStructure, createProcDefBlock,
  createProcCallBlock} = procedureTestHelpers;

suite.only('Procedure blocks', function() {
  setup(function() {
    this.workspace = new Blockly.Workspace();
    this.clock = sinon.useFakeTimers();
  });

  teardown(function() {
    // We have to make sure the procedure call gets the change event before
    // we teardown. Otherwise we get a race condition where it tries to create
    // a new def.
    this.clock.tick(100);
    this.workspace.dispose();
  });

  const testSuites = [
    {title: 'with return', hasReturn: true, defType: 'procedures_defreturn',
      callType: 'procedures_callreturn'},
    {title: 'no return', hasReturn: false, defType: 'procedures_defnoreturn',
      callType: 'procedures_callnoreturn'},
  ];

  testSuites.forEach((testSuite) => {
    suite(testSuite.title, function() {
      suite('Structure', function() {
        test('Definition block', function() {
          const defBlock = this.workspace.newBlock(testSuite.defType);
          assertDefBlockStructure(defBlock, testSuite.hasReturn);
        });

        test('Call block', function() {
          this.workspace.newBlock(testSuite.defType);
          const callBlock = this.workspace.newBlock(testSuite.callType);
          assertCallBlockStructure(callBlock);
        });
      });

      // TODO(kozbial): Fix errors with runCodeGenerationTestSuites call
      suite.skip('blockToCode', function() {
        const trivial = (workspace) => {
          return workspace.newBlock(testSuite.defType);
        };

        /**
         * Test suites for code generation test.
         * @type {Array<CodeGenerationTestSuite>}
         */
        const testSuites = [
          {title: 'Dart', generator: Blockly.Dart,
            testCases: [
              {title: 'Trivial', expectedCode: 'if (false) {\n}\n',
                createBlock: createProcDefBlock},
            ]},
          {title: 'JavaScript', generator: Blockly.JavaScript,
            testCases: [
              {title: 'Trivial', expectedCode: 'if (false) {\n}\n',
                createBlock: trivial},
            ]},
          {title: 'Lua', generator: Blockly.Lua,
            testCases: [
              {title: 'Trivial', expectedCode: 'if false then\nend\n',
                createBlock: createProcDefBlock},
            ]},
          {title: 'PHP', generator: Blockly.PHP,
            testCases: [
              {title: 'Trivial', expectedCode: 'if (false) {\n}\n',
                createBlock: createProcDefBlock},
            ]},
          {title: 'Python', generator: Blockly.Python,
            testCases: [
              {title: 'Trivial', expectedCode: 'if False:\nundefined',
                createBlock: createProcDefBlock},
            ]},
        ];

        runCodeGenerationTestSuites(testSuites);
      });

      /**
       * Test cases for serialization tests.
       * @type {Array<SerializationTestCase>}
       */
      const testCases = [
        {title: 'Empty XML definition',
          xml: '<block type="' + testSuite.defType + '"/>',
          expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' + testSuite.defType + '" id="1">\n' +
              '  <field name="NAME"></field>\n' +
              '</block>',
          assertBlockStructure:
              (block) => {
                assertDefBlockStructure(block, testSuite.hasReturn);
              },
        },
        {title: 'Empty XML caller',
          xml: '<block type="' + testSuite.callType + '"/>',
          expectedXml:
              '<block xmlns="https://developers.google.com/blockly/xml" ' +
              'type="' + testSuite.callType + '" id="1">\n' +
              // TODO(kozbial) investigate whether callreturn and callnoreturn
              //  should have the same default value for name mutation.
              '  <mutation name="' +
              ((testSuite.hasReturn) ? '' :'1') +'"></mutation>\n' +
              '</block>',
          assertBlockStructure:
              (block) => {
                assertCallBlockStructure(block);
              },
        },
      ];
      runSerializationTestSuite(testCases);


      suite('Adding and removing inputs', function() {
        setup(function() {
          this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
          this.call = createProcCallBlock(this.workspace, testSuite.hasReturn);
        });

        test('Add', function() {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          this.def.plus();
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
              ['x']);
        });

        test('Add many', function() {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          for (let i = 0; i < 5; i++) {
            this.def.plus();
          }
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
              ['x', 'y', 'z', 'a', 'b']);
        });

        if (testSuite.hasReturn) {
          test('Add, no stack', function() {
            this.def = createProcDefBlock(
                this.workspace, true, 'proc name2', false);
            this.call = createProcCallBlock(this.workspace, true, 'proc name2');
            assertProcBlocksStructure(this.def, this.call, true,
                [], false);
            this.def.plus();
            assertProcBlocksStructure(this.def, this.call, true,
                ['x'], false);
          });
        }


        test('Remove', function() {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          this.def.plus();
          this.def.minus(this.def.argData_[0].argId);
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
        });

        test('Remove many', function() {
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
          for (let i = 0; i < 10; i++) {
            this.def.plus();
          }
          // Remove every other input. Must do it backwards so that the array
          // doesn't get out of whack.
          for (let i = 9; i > 0; i-=2) {
            this.def.minus(this.def.argData_[i].argId);
          }
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
              ['x', 'z', 'b', 'd', 'f']);
        });

        test('Remove too many (w/ no args)', function() {
          this.def.minus('whatevs');
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn);
        });

        test('Remove bad arg', function() {
          this.def.plus();
          this.def.minus('whatevs');
          assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
              ['x']);
        });
      });

      suite('Vars', function() {
        setup(function() {
          this.assertVars = function(constsArray) {
            const constNames = this.workspace.getVariablesOfType('').map(
                (model) => model.name );
            assert.sameMembers(constNames, constsArray);
          };
        });
        teardown(function() {
          delete this.assertVars;
        });

        suite('Renaming args', function() {
          setup(function() {
            this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
            this.call = createProcCallBlock(this.workspace,
                testSuite.hasReturn);
          });
          test('Simple Rename', function() {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('newName');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['newName']);
            this.assertVars(['x', 'newName']);
          });
          test('Change Case', function() {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('X');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['X']);
            this.assertVars(['X']);
          });
          test('Empty', function() {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['x']);
            this.assertVars(['x']);
          });
          test('Whitespace', function() {
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('  newName   ');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['newName']);
            this.assertVars(['x', 'newName']);
          });
          test('Duplicate', function() {
            this.def.plus();
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('y');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['x', 'y']);
            this.assertVars(['x', 'y']);
          });
          test('Duplicate Different Case', function() {
            this.def.plus();
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('Y');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['x', 'y']);
            this.assertVars(['x', 'y']);
          });
          test('Match Existing', function() {
            this.workspace.createVariable('test', '');
            this.def.plus();
            const field = this.def.inputList[1].fieldRow[2];
            field.setValue('test');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['test']);
            this.assertVars(['x', 'test']);
            assert.equal(this.def.argData_[0].model.getId(),
                this.workspace.getVariable('test', '').getId());
          });
        });
        suite('Vars Renamed Elsewhere', function() {
          setup(function() {
            this.def = createProcDefBlock(this.workspace, testSuite.hasReturn);
            this.call = createProcCallBlock(this.workspace,
                testSuite.hasReturn);
          });
          test('Simple Rename', function() {
            this.def.plus();
            const Variable = this.workspace.getVariable('x', '');
            this.workspace.renameVariableById(Variable.getId(), 'test');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['test']);
            this.assertVars(['test']);
          });
          // Don't know how we want to react here.
          test.skip('Duplicate', function() {
            this.def.plus();
            this.def.plus();
            const Variable = this.workspace.getVariable('x', '');
            this.workspace.renameVariableById(Variable.getId(), 'y');
            // Don't know what we want to have happen.
          });
          test('Change Case', function() {
            this.def.plus();
            const Variable = this.workspace.getVariable('x', '');
            this.workspace.renameVariableById(Variable.getId(), 'X');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['X']);
            this.assertVars(['X']);
          });
          test('Coalesce Change Case', function() {
            const variable = this.workspace.createVariable('test');
            this.def.plus();
            this.workspace.renameVariableById(variable.getId(), 'X');
            assertProcBlocksStructure(this.def, this.call, testSuite.hasReturn,
                ['X']);
            this.assertVars(['X']);
          });
        });
      });
    });
  });
});
