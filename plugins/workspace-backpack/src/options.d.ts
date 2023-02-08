/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Typedefs and utility methods for parsing options for the
 * backpack plugin.
 * @author kozbial@google.com (Monica Kozbial)
 */
export type BackpackOptions = {
    allowEmptyBackpackOpen: boolean;
    contextMenu: {
        emptyBackpack: boolean;
        removeFromBackpack: boolean;
        copyToBackpack: boolean;
        copyAllToBackpack: boolean;
        pasteAllToBackpack: boolean;
        disablePreconditionChecks: boolean;
    };
};
export type BackpackContextMenuOptions = {
    allowEmptyBackpackOpen?: boolean;
    contextMenu?: BackpackContextMenuOptions;
};
/**
 * Returns a new options object with all properties set, using default values
 * if not specified in the optional options that were passed in.
 * @param {BackpackOptions=} options The options to use.
 * @return {!BackpackOptions} The created options object.
 */
export declare function parseOptions(options?: BackpackOptions): BackpackOptions;
