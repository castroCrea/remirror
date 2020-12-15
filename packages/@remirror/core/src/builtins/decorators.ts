import { LiteralUnion } from 'type-fest';

import { ExtensionPriority } from '@remirror/core-constants';
import { isEmptyObject } from '@remirror/core-helpers';
import {
  AnyFunction,
  CommandFunction,
  KeyBindingCommandFunction,
  NonChainableCommandFunction,
  ProsemirrorAttributes,
  Shape,
} from '@remirror/core-types';
import type { I18n } from '@remirror/i18n';
import { MessageDescriptor } from '@remirror/i18n';
import type { CoreIcon } from '@remirror/icons';

import { AnyExtension, HelperAnnotation } from '../extension';
import { GetOptions, TypedPropertyDescriptor } from '../types';

/**
 * A decorator which can be applied to top level methods on an extension to
 * identify them as helpers. This can be used as a replacement for the
 * `createHelpers` method.
 *
 * To allow the TypeScript compiler to automatically infer types, please create
 * your methods with the following type signature.
 *
 * ```ts
 * import { CommandFunction } from '@remirror/core';
 *
 * type Signature = (...args: any[]) => CommandFunction;
 * ```
 *
 * The following is an example of how this can be used within your extension.
 *
 * ```ts
 * import { helper, Helper } from '@remirror/core';
 *
 * class MyExtension {
 *   get name() {
 *     return 'my';
 *   }
 *
 *   @helper()
 *   alwaysTrue(): Helper<boolean> {
 *     return true;
 *   }
 * }
 * ```
 *
 * The above helper can now be used within your editor instance.
 *
 * ```tsx
 * import { useRemirrorContext } from 'remirror/react';
 *
 * const MyEditorButton = () => {
 *   const { helpers } = useRemirrorContext();
 *
 *   return helpers.alwaysTrue() ? <button>My Button</button> : null
 * }
 * ```
 *
 * @category Method Decorator
 */
export function helper(options: HelperDecoratorOptions = {}) {
  return <Extension extends AnyExtension, Type>(
    target: Extension,
    propertyKey: string,
    _descriptor: TypedPropertyDescriptor<
      // This type signature helps enforce the need for the `Helper` annotation
      // while allowing for `null | undefined`.
      AnyFunction<NonNullable<Type> extends HelperAnnotation ? Type : never>
    >,
  ): void => {
    // Attach the options to the `decoratedCommands` property for this extension.
    (target.decoratedHelpers ??= {})[propertyKey] = options;
  };
}

/**
 * A decorator which can be applied to top level methods on an extension to
 * identify them as commands. This can be used as a replacement for the
 * `createCommands` method.
 *
 * If you prefer not to use decorators, then you can continue using
 * `createCommands`. Internally the decorators are being used as they are better
 * for documentation purposes.
 *
 * For automated type inference methods that use this decorator must implement
 * the following type signature.
 *
 * ```ts
 * import { CommandFunction } from '@remirror/core';
 *
 * type Signature = (...args: any[]) => CommandFunction;
 * ```
 *
 * The following is an example of how this can be used within your extension.
 *
 * ```ts
 * import { command, CommandFunction } from '@remirror/core';
 *
 * class MyExtension {
 *   get name() {
 *     return 'my';
 *   }
 *
 *   @command() myCommand(text: string): CommandFunction {return ({ tr, dispatch
 *   }) => {dispatch?.(tr.insertText('my command ' + text)); return true;
 *     }
 *   }
 * }
 * ```
 *
 * The above command can now be used within your editor instance.
 *
 * ```tsx
 * import { useRemirrorContext } from 'remirror/react';
 *
 * const MyEditorButton = () => {
 *   const { commands } = useRemirrorContext();
 *
 *   return <button onClick={() => commands.myCommand('hello')}>My Button</button>
 * }
 * ```
 *
 * @category Method Decorator
 */
export function command<Extension extends AnyExtension>(
  options?: ChainableCommandDecoratorOptions,
): ExtensionDecorator<Extension, CommandFunction, void>;
export function command<Extension extends AnyExtension>(
  options: NonChainableCommandDecoratorOptions,
): ExtensionDecorator<Extension, NonChainableCommandFunction, void>;
export function command(options: CommandDecoratorOptions = {}): any {
  return (target: any, propertyKey: string, _descriptor: any): void => {
    if (isEmptyObject(options)) {
      return;
    }

    // Attach the options to the decoratedCommands property for this extension.
    (target.decoratedCommands ??= {})[propertyKey] = options;
  };
}

/**
 * A decorator which can be applied to an extension method to
 * identify as a key binding method. This can be used as a replacement for
 * the `createKeymap` method depending on your preference.
 *
 * If you prefer not to use decorators, then you can continue using
 * `createKeymap`.
 *
 * @category Method Decorator
 */

export function keyBinding<Extension extends AnyExtension>(
  options: KeybindingDecoratorOptions<Required<GetOptions<Extension>>>,
) {
  return (
    target: Extension,
    propertyKey: string,
    _descriptor: TypedPropertyDescriptor<KeyBindingCommandFunction>,
  ): void => {
    // Attach the options to the decoratedCommands property for this extension.
    (target.decoratedKeybindings ??= {})[propertyKey] = options as any;
  };
}

export interface HelperDecoratorOptions {}

export interface KeybindingDecoratorOptions<Options extends Shape = Shape> {
  /**
   * The keypress sequence to intercept.
   *
   * - `Enter`
   * - `Shift-Enter`
   */
  shortcut:
    | LiteralUnion<
        | 'Enter'
        | 'ArrowDown'
        | 'ArrowUp'
        | 'ArrowLeft'
        | 'ArrowRight'
        | 'Esc'
        | 'Delete'
        | 'Backspace',
        string
      >
    | ((options: Options, store: Remirror.ExtensionStore) => string);

  /**
   * This can be used to set a keybinding as inactive based on the provided
   * options.
   */
  isActive?: (options: Options, store: Remirror.ExtensionStore) => boolean;

  /**
   * The priority for this keybinding.
   */
  priority?:
    | ExtensionPriority
    | ((options: Options, store: Remirror.ExtensionStore) => ExtensionPriority);

  /**
   * The name of the command that the keybinding should be attached to.
   */
  command?: Remirror.AllCommandNames;
}

type ExtensionDecorator<Extension extends AnyExtension, Fn, Return> = (
  target: Extension,
  propertyKey: string,
  _descriptor: TypedPropertyDescriptor<AnyFunction<Fn>>,
) => Return;

export interface CommandUiIcon {
  /**
   * The icon name.
   */
  name: CoreIcon;

  /**
   * Text placed in a superscript position. For `ltr` this is in the top right
   * hand corner of the icon.
   */
  sup?: string;

  /**
   * Text placed in a subscript position. For `ltr` this is in the bottom right
   * hand corner.
   */
  sub?: string;
}

export interface CommandUiDecoratorOptions {
  /**
   * The default command icon to use if this has a UI representation.
   */
  icon?: CommandDecoratorValue<CoreIcon | CommandUiIcon>;

  /**
   * A label for the command with support for i18n. This makes use of
   * `babel-plugin-macros` to generate the message.
   */
  label?: CommandDecoratorMessage;

  /**
   * An i18n compatible description for the command with support for i18n.
   */
  description?: CommandDecoratorValue<MessageDescriptor>;

  /**
   * A keyboard shortcut which can be used to run the specified command.
   *
   * Rather than defining this here, you should create a decorated `keyBinding`
   * and set the `command` name option. This way the shortcut will dynamically
   * be added at runtime.
   */
  shortcut?: string | Array<[attrs: ProsemirrorAttributes, shortcut: string]>;
}

interface CommandDecoratorMessageParameter {
  /**
   * True when the command is enabled.
   */
  enabled: boolean;

  /**
   * True when the extension is active.
   */
  active: boolean;

  /**
   * Predefined attributes which can influence the returned value.
   */
  attrs: Shape;

  /**
   * A translation utility for translating a predefined string / or message
   * descriptor.
   */
  t: I18n['_'];

  /**
   * Access to the extension store.
   */
  store: Remirror.ExtensionStore;
}

export type CommandDecoratorValue<Value> =
  | ((parameter: CommandDecoratorMessageParameter) => Value)
  | Value;

export type CommandDecoratorMessage = CommandDecoratorValue<string>;
interface ChainableCommandDecoratorOptions extends Remirror.CommandDecoratorOptions {
  /**
   * Set this to `true` to disable chaining of this command. This means it will
   * no longer be available when running `
   *
   * @default false
   */
  disableChaining?: false;
}
interface NonChainableCommandDecoratorOptions extends Remirror.CommandDecoratorOptions {
  /**
   * Set this to `true` to disable chaining of this command. This means it will
   * no longer be available when running `
   *
   * @default false
   */
  disableChaining: true;
}

export type CommandDecoratorOptions =
  | ChainableCommandDecoratorOptions
  | NonChainableCommandDecoratorOptions;

declare global {
  namespace Remirror {
    /**
     * UX options for the command which can be extended.
     */
    interface CommandDecoratorOptions extends CommandUiDecoratorOptions {}
  }
}
