/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import {ProcedureParameterBase, ProcedureParameterBaseJson} from './events_procedure_parameter_base';


const TYPE = 'procedure_parameter_rename';

/**
 * Notifies listeners that a procedure parameter was renamed.
 */
export class ProcedureParameterRename extends ProcedureParameterBase {
  /** A string used to check the type of the event. */
  type = TYPE;

  /** The new name of the procedure parameter. */
  private readonly newName: string;

  /**
   * Constructs the procedure parameter rename event.
   * @param workspace The workpace this event is associated with.
   * @param procedure The procedure model this event is associated with.
   * @param parameter The parameter model this event is associated with.
   * @param oldName The old name of the procedure parameter.
   * @param newName The (optional) new name of the procedure parameter. If not
   *     provided, the parameter model will be inspected to see what its current
   *     name is.
   */
  constructor(
      workspace: Blockly.Workspace,
      procedure: Blockly.procedures.IProcedureModel,
      parameter: Blockly.procedures.IParameterModel,
      readonly oldName: string,
      newName?: string) {
    super(workspace, procedure, parameter);

    this.newName = newName ?? parameter.getName();
  }

  /**
   * Replays the event in the workspace.
   * @param forward if true, play the event forward (redo), otherwise play it
   *     backward (undo).
   */
  run(forward: boolean) {
    const {parameter} = ProcedureParameterBase.findMatchingParameter(
        this.getEventWorkspace_(),
        this.procedure.getId(),
        this.parameter.getId());
    if (forward) {
      parameter.setName(this.newName);
    } else {
      parameter.setName(this.oldName);
    }
  }

  /**
   * Encode the event as JSON.
   * @returns JSON representation.
   */
  toJson(): ProcedureParameterRenameJson {
    const json = super.toJson() as ProcedureParameterRenameJson;
    json['newName'] = this.newName;
    json['oldName'] = this.oldName;
    return json;
  }

  /**
   * Deserializes the JSON event.
   * @param json The JSON representation of a procedure parameter rename event.
   * @param workspace The workspace to deserialize the event into.
   * @returns The new procedure parameter rename event.
   * @internal
   */
  static fromJson(
      json: ProcedureParameterRenameJson,
      workspace: Blockly.Workspace
  ): ProcedureParameterRename {
    const {procedure, parameter} =
        ProcedureParameterBase.findMatchingParameter(
            workspace, json['procedureId'], json['parameterId']);
    if (!parameter) {
      throw new Error('Cannot delete a non existant parameter');
    }
    return new ProcedureParameterRename(
        workspace, procedure, parameter, json['oldName'], json['newName']);
  }
}

export interface ProcedureParameterRenameJson extends
    ProcedureParameterBaseJson {
  oldName: string;
  newName: string;
}

Blockly.registry.register(
    Blockly.registry.Type.EVENT, TYPE, ProcedureParameterRename);
