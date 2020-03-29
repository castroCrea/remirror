import { Step } from 'prosemirror-transform';

import {
  Attributes,
  BaseExtensionConfig,
  EditorSchema,
  PlainObject,
  Transaction,
} from '@remirror/core';

export interface Sendable {
  version: number;
  steps: Array<Step<EditorSchema>>;
  clientID: number | string;
  origins: Transaction[];
}

export interface JSONSendable extends Omit<Sendable, 'steps' | 'origins'> {
  steps: PlainObject[];
}

export interface OnSendableReceivedParams {
  /**
   * The raw sendable generated by the prosemirror-collab library.
   */
  sendable: Sendable;

  /**
   * A sendable which can be sent to a server
   */
  jsonSendable: JSONSendable;
}

export interface CollaborationExtensionOptions extends BaseExtensionConfig {
  /**
   * The document version.
   *
   * @defaultValue 0
   */
  version?: number;

  /**
   * The unique ID of the client connecting to the server.
   */
  clientID: number | string;

  /**
   * The debounce time in milliseconds
   *
   * @defaultValue 250
   */
  debounce?: number;

  /**
   * Called when an an editor transaction occurs and there are changes ready to be sent to the server.
   *
   * @remarks
   * The callback will receive the `jsonSendable` which can be sent to the server as it is.
   * If you need more control then the `sendable` property can be used to shape the data the way you require.
   *
   * @param params - the sendable and jsonSendable properties which can be sent to your backend
   */
  onSendableReceived(params: OnSendableReceivedParams): void;
}

export type CollaborationAttrs = Attributes<{
  /**
   * @internalremarks
   * TODO give this some better types
   */
  steps: any[];
  version: number;
}>;
