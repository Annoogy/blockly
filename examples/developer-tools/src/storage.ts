/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const lastEditedBlockKey = 'blockFactoryLastEditedBlock';
const allBlocksKey = 'blockFactoryAllBlocks';
const allBlocks: Set<string> = new Set(
  JSON.parse(window.localStorage?.getItem(allBlocksKey)) || [],
);
const prohibitedBlockNames = new Set([
  lastEditedBlockKey,
  allBlocksKey,
  'blockly_block_factory_preview_block',
]);

const localStorage = window.localStorage;
if (!localStorage) {
  window.alert(
    'Local Storage is disabled on this page. Saving and loading stored blocks is not possible. You may need to enable cookies or local storage on this domain.',
  );
  throw new Error('Local storage is unavailable');
}

/**
 * Adds or updates block in local storage.
 *
 * @param name Name of the block.
 * @param block Stringified JSON representing the block's state.
 */
export const updateBlock = function (name: string, block: string) {
  allBlocks.add(name);
  localStorage.setItem(allBlocksKey, JSON.stringify(Array.from(allBlocks)));
  localStorage.setItem(name, block);
  localStorage.setItem(lastEditedBlockKey, name);
};

/**
 * Gets the block data for the given block name from storage.
 *
 * @param name Name of the block to get.
 * @returns Stringified JSON representing the block's state, or null if not found.
 */
export const getBlock = function (name: string): string | null {
  const block = localStorage.getItem(name);
  if (block) {
    localStorage.setItem(lastEditedBlockKey, name);
  }
  return block;
};

/**
 * Removes block data for the given block name from storage.
 *
 * @param name Name of the block to remove.
 */
export const removeBlock = function (name: string) {
  allBlocks.delete(name);
  localStorage.setItem(allBlocksKey, JSON.stringify(Array.from(allBlocks)));

  localStorage.removeItem(name);

  if (localStorage.getItem(lastEditedBlockKey) === name) {
    localStorage.removeItem(lastEditedBlockKey);
  }
};

/**
 * Gets the name of the last edited block.
 * A block is set as the last edited block when its data is added, changed, or accessed.
 *
 * @returns Name of the last edited block.
 */
export const getLastEditedBlockName = function (): string {
  return localStorage.getItem(lastEditedBlockKey);
};

/**
 * Gets the block data for the last edited block.
 * If there is no last edited block found, it returns the
 * data for the last block saved in storage instead.
 *
 * @returns Stringified JSON reperesenting the block's state,
 *    or null if there are no blocks.
 */
export const getLastEditedBlock = function (): string {
  const lastEditedName = localStorage.getItem(lastEditedBlockKey);
  if (lastEditedName) {
    const lastEditedBlock = getBlock(lastEditedName);
    if (lastEditedBlock) {
      return lastEditedBlock;
    }
  }

  const allBlocksArr = Array.from(allBlocks);
  if (allBlocksArr.length > 0) {
    return getBlock(allBlocksArr[allBlocksArr.length - 1]);
  }

  return null;
};

/** Gets the names of all blocks saved in storage. */
export const getAllSavedBlockNames = function (): Set<string> {
  return allBlocks;
};

/**
 * Gets prohibited names for the blocks.
 * This includes keys that are already used by this application.
 */
export const getProhibitedBlockNames = function (): Set<string> {
  return prohibitedBlockNames;
};
