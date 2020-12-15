import { LiteralUnion } from 'type-fest';

import { ErrorConstant, NULL_CHARACTER } from '@remirror/core-constants';
import { entries, isEmptyObject, object } from '@remirror/core-helpers';
import type {
  AnyFunction,
  EditorState,
  EmptyShape,
  ProsemirrorAttributes,
  RemirrorJSON,
  Shape,
  StateJSON,
} from '@remirror/core-types';
import {
  htmlToProsemirrorNode,
  isMarkActive,
  isNodeActive,
  isSelectionEmpty,
  prosemirrorNodeToHtml,
  StringHandlerOptions,
} from '@remirror/core-utils';

import {
  ActiveFromExtensions,
  AnyExtension,
  extension,
  Helper,
  HelperNames,
  HelpersFromExtensions,
  isMarkExtension,
  isNodeExtension,
  PlainExtension,
} from '../extension';
import { throwIfNameNotUnique } from '../helpers';
import type { ExtensionHelperReturn } from '../types';
import { helper, HelperDecoratorOptions } from './decorators';

/**
 * Helpers are custom methods that can provide extra functionality to the
 * editor.
 *
 * @remarks
 *
 * They can be used for pulling information from the editor or performing custom
 * async commands.
 *
 * Also provides the default helpers used within the extension.
 *
 * @category Builtin Extension
 */
@extension({})
export class HelpersExtension extends PlainExtension {
  get name() {
    return 'helpers' as const;
  }

  /**
   * Add the `html` string handler and `getHtml` manager getter method.
   */
  onCreate() {
    this.store.setStringHandler('text', this.textToProsemirrorNode.bind(this));
    this.store.setStringHandler('html', htmlToProsemirrorNode);
  }

  /**
   * Helpers are only available once the view has been added to
   * `RemirrorManager`.
   */
  onView(): void {
    const helpers: Record<string, AnyFunction> = object();
    const active: Record<string, AnyFunction> = object();
    const names = new Set<string>();

    for (const extension of this.store.extensions) {
      if (isNodeExtension(extension)) {
        active[extension.name] = (attrs?: ProsemirrorAttributes) => {
          return isNodeActive({ state: this.store.getState(), type: extension.type, attrs });
        };
      }

      if (isMarkExtension(extension)) {
        active[extension.name] = () => {
          return isMarkActive({ trState: this.store.getState(), type: extension.type });
        };
      }

      const extensionHelpers = extension.createHelpers?.() ?? {};

      for (const helperName of Object.keys(extension.decoratedHelpers ?? {})) {
        extensionHelpers[helperName] = (extension as Shape)[helperName].bind(extension);
      }

      if (isEmptyObject(extensionHelpers)) {
        continue;
      }

      for (const [name, helper] of entries(extensionHelpers)) {
        throwIfNameNotUnique({ name, set: names, code: ErrorConstant.DUPLICATE_HELPER_NAMES });
        helpers[name] = helper;
      }
    }

    this.store.setStoreKey('active', active);
    this.store.setStoreKey('helpers', helpers);
    this.store.setExtensionStore('helpers', helpers as any);
  }

  /**
   * Check whether the selection is empty.
   */
  @helper()
  isSelectionEmpty(): Helper<boolean> {
    return isSelectionEmpty(this.store.view.state);
  }

  /**
   * Get the full JSON output for the ProseMirror editor state object.
   */
  @helper()
  getStateJSON(state?: EditorState): Helper<StateJSON> {
    const { getState } = this.store;
    return (state ?? getState()).toJSON() as StateJSON;
  }

  /**
   * Get the JSON output for the main ProseMirror `doc` node.
   *
   * This can be used to persist data between sessions and can be passed as
   * content to the `initialContent` prop.
   */
  @helper()
  getJSON(state?: EditorState): Helper<RemirrorJSON> {
    const { getState } = this.store;
    return (state ?? getState()).doc.toJSON() as RemirrorJSON;
  }

  /**
   * @deprecated use `getJSON` instead.
   */
  @helper()
  getRemirrorJSON(state?: EditorState): Helper<RemirrorJSON> {
    return this.getJSON(state);
  }

  /**
   * A method to get all the content in the editor as text. Depending on the
   * content in your editor, it is not guaranteed to preserve it 100%, so it's
   * best to test that it meets your needs before consuming.
   */
  @helper()
  getText(lineBreakDivider = '\n\n'): Helper<string> {
    const { doc } = this.store.getState();
    return doc.textBetween(0, doc.content.size, lineBreakDivider, NULL_CHARACTER);
  }

  /**
   * Get the html from the current state, or provide a custom state.
   */
  @helper()
  getHtml(state?: EditorState): Helper<string> {
    const { getState, document } = this.store;
    const node = (state ?? getState()).doc;

    return prosemirrorNodeToHtml(node, document);
  }

  /**
   * Wrap the content in a pre tag to preserve whitespace and see what the
   * editor does with it.
   */
  private textToProsemirrorNode(options: StringHandlerOptions) {
    const content = `<pre>${options.content}</pre>`;
    return this.store.stringHandlers.html({ ...options, content });
  }
}

declare global {
  namespace Remirror {
    interface ManagerStore<ExtensionUnion extends AnyExtension> {
      /**
       * The helpers provided by the extensions used.
       */
      helpers: HelpersFromExtensions<ExtensionUnion> extends object
        ? HelpersFromExtensions<ExtensionUnion>
        : object;

      /**
       * Check which nodes and marks are active under the current user
       * selection.
       *
       * ```ts
       * const { active } = manager.store;
       *
       * return active.bold() ? 'bold' : 'regular';
       * ```
       */
      active: ActiveFromExtensions<ExtensionUnion>;
    }

    interface BaseExtension {
      /**
       * `ExtensionHelpers`
       *
       * This pseudo property makes it easier to infer Generic types of this
       * class.
       *
       * @internal
       */
      ['~H']: this['createHelpers'] extends AnyFunction
        ? ReturnType<this['createHelpers']>
        : EmptyShape;

      /**
       * @experimental
       *
       * Stores all the helpers that have been added via decorators to the
       * extension instance. This is used by the `HelpersExtension` to pick the
       * helpers.
       *
       * @internal
       */
      decoratedHelpers?: Record<string, HelperDecoratorOptions>;

      /**
       * A helper method is a function that takes in arguments and returns a
       * value depicting the state of the editor specific to this extension.
       *
       * @remarks
       *
       * Unlike commands they can return anything and may not effect the
       * behavior of the editor.
       *
       * Below is an example which should provide some idea on how to add
       * helpers to the app.
       *
       * ```tsx
       * // extension.ts
       * import { ExtensionFactory } from '@remirror/core';
       *
       * const MyBeautifulExtension = ExtensionFactory.plain({
       *   name: 'beautiful',
       *   createHelpers: () => ({
       *     checkBeautyLevel: () => 100
       *   }),
       * })
       * ```
       *
       * ```
       * // app.tsx
       * import { useRemirrorContext } from 'remirror/react';
       *
       * const MyEditor = () => {
       *   const { helpers } = useRemirrorContext({ autoUpdate: true });
       *
       *   return helpers.beautiful.checkBeautyLevel() > 50
       *     ? (<span>😍</span>)
       *     : (<span>😢</span>);
       * };
       * ```
       */
      createHelpers?(): ExtensionHelperReturn;
    }

    interface StringHandlers {
      /**
       * Register the plain `text` string handler which renders a text string
       * inside a `<pre />`.
       */
      text: HelpersExtension;

      /**
       * Register the html string handler, which converts a html string to a
       * prosemirror node.
       */
      html: HelpersExtension;
    }

    interface ExtensionStore {
      /**
       * Helper method to provide information about the content of the editor.
       * Each extension can register its own helpers.
       *
       * This should only be accessed after the `onView` lifecycle method
       * otherwise it will throw an error.
       */
      helpers: HelpersFromExtensions<AllExtensionUnion>;
    }

    interface ListenerProperties<ExtensionUnion extends AnyExtension> {
      helpers: HelpersFromExtensions<ExtensionUnion>;
    }

    interface AllExtensions {
      helpers: HelpersExtension;
    }
  }

  /**
   * The helpers name for all extension defined in the current project.
   */
  type AllHelperNames = LiteralUnion<HelperNames<Remirror.AllExtensionUnion>, string>;
}
