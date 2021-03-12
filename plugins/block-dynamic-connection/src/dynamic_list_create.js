Blockly.Blocks['dynamic_list_create'] = {
  inputCounter: 2,
  /**
   * Block for concatenating any number of strings.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg['LISTS_CREATE_WITH_HELPURL']);
    this.setStyle('list_blocks');
    this.appendValueInput('ADD0')
        .appendField(Blockly.Msg['LISTS_CREATE_WITH_INPUT_WITH']);
    this.appendValueInput('ADD1');
    this.setOutput(true, 'Array');
    this.setTooltip(Blockly.Msg['LISTS_CREATE_WITH_TOOLTIP']);
  },
  /**
   * Create XML to represent number of text inputs.
   * @return {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.inputList.length);
    return container;
  },
  /**
   * Parse XML to restore the text inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function(xmlElement) {
    const targetCount = parseInt(xmlElement.getAttribute('items'), 10);
    for (let i = 2; i < targetCount; i++) {
      this.appendValueInput('ADD' + (this.inputCounter++));
    }
  },

  /**
   * Check whether a new input should be added and determine where it should go.
   * @param {Blockly.Connection} connection - The connection that has a
   * pending connection.
   * @return {Number} The index before which to insert a new input,
   * or null if no input should be added.
   */
  getIndexForNewInput: function(connection) {
    if (!connection.targetConnection) {
      // this connection is available
      return null;
    }

    let connectionIndex;
    for (let i = 0; i < this.inputList.length; i++) {
      if (this.inputList[i].connection == connection) {
        connectionIndex = i;
      }
    }

    if (connectionIndex == this.inputList.length - 1) {
      // this connection is the last one and already has a block in it, so
      // we should add a new connection at the end.
      return this.inputList.length + 1;
    }

    const nextInput = this.inputList[connectionIndex + 1];
    const nextConnection = nextInput && nextInput.connection.targetConnection;
    if (nextConnection && !nextConnection.sourceBlock_.isInsertionMarker()) {
      return connectionIndex + 1;
    }

    // Don't add new connection
    return null;
  },

  /**
   * Called when a block is dragged over one of the connections on this block.
   * @param {Blockly.Connection} connection - The connection on this block that
   * has a pending connection.
   */
  onPendingConnection: function(connection) {
    const insertIndex = this.getIndexForNewInput(connection);
    if (insertIndex == null) {
      return;
    }
    this.appendValueInput('ADD' + (this.inputCounter++));
    this.moveNumberedInputBefore(this.inputList.length - 1, insertIndex);
  },

  /**
   * Called when a block is dropped into one of the connections on this block,
   * or when a block drags over connections on this block and then is dragged
   * away.
   */
  finalizeConnections: function() {
    if (this.inputList.length > 2) {
      let toRemove = [];
      this.inputList.forEach((input) => {
        const targetConnection = input.connection.targetConnection;
        if (!targetConnection) {
          toRemove.push(input.name);
        }
      });

      if (this.inputList.length - toRemove.length < 2) {
        // Always show at least two inputs
        toRemove = toRemove.slice(2);
      }
      toRemove.forEach((inputName) => this.removeInput(inputName));
      // The first input should have the block text. If we removed the
      // first input, add the block text to the new first input.
      if (this.inputList[0].fieldRow.length == 0) {
        this.inputList[0]
            .appendField(Blockly.Msg['LISTS_CREATE_WITH_INPUT_WITH']);
      }
    }
  },
};
