/**
 * @license
 * 
 * Copyright 2019 Google LLC
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
 * @fileoverview Websocket APIs for passing events between the client and the
 * server.
 * @author navil@google.com (Navil Perez)
 */

import * as Blockly from 'blockly/dist';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

/**
 * Query the database for entries since the given server id.
 * @param {number} serverId serverId for the lower bound of the query.
 * @return {!Promise} Promise object that represents the entries of events since
 * the given serverId.
 * @public
 */
export async function getEvents(serverId) {
  return new Promise((resolve, reject) => {
    socket.emit('getEvents', serverId, (entries) => {
      entries.forEach((entry) => {
        entry.events = entry.events.map((entry) => {
          return Blockly.Events.fromJson(entry, Blockly.getMainWorkspace());
        });
      });
      resolve(entries);
    });
  });
};

/**
 * Add an entry to the database.
 * @param {!LocalEntry} entry The entry to be added to the database.
 * @return {!Promise} Promise object that represents the success of the write.
 * @public
 */
export async function writeEvents(entry) {
  const entryJson = {
    entryId: entry.entryId,
    events: entry.events.map((event) => event.toJson())
  };
  return new Promise((resolve, reject) => {
    socket.emit('addEvents', entryJson, () => {
      resolve();
    });
  });
};

/**
 * Listen for events broadcast by the server.
 * @param {!Function} callback The callback handler that passes the events to
 * the workspace.
 * @return {!Promise} Promise object that represents the success of the write.
 * @public
 */
export function getBroadcast(callback) {
  socket.on('broadcastEvents', (entries)=> {
    entries.forEach((entry) => {
      entry.events = entry.events.map((entry) => {
        return Blockly.Events.fromJson(entry, Blockly.getMainWorkspace());
      });
    });
    callback(entries);
  });
};
