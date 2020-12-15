import type { ConditionalPick, LiteralUnion, UnionToIntersection } from 'type-fest';

import type {
  AnyFunction,
  CommandFunction,
  ConditionalReturnPick,
  EditorSchema,
  Flavoring,
  NonChainableCommandFunction,
  ProsemirrorAttributes,
  RemoveAnnotation,
  StringKey,
} from '@remirror/core-types';

import type { CommandShape, GetCommands, GetHelpers } from '../types';
import type {
  AnyExtension,
  AnyMarkExtension,
  AnyNodeExtension,
  AnyPlainExtension,
} from './extension';

export interface ExtensionListParameter<ExtensionUnion extends AnyExtension = AnyExtension> {
  /**
   * The extensions property.
   */
  readonly extensions: readonly ExtensionUnion[];
}

/**
 * A utility type which maps the passed in extension command in an action that
 * is store in the `manager.store.actions.commandName()`.
 */
export type MapToUnchainedCommand<RawCommands extends Record<string, AnyFunction>> = {
  [Command in keyof RawCommands]: CommandShape<Parameters<RawCommands[Command]>>;
};

/**
 * A utility type which maps the chained commands.
 */
export type MapToChainedCommand<RawCommands extends Record<string, AnyFunction>> = {
  [Command in keyof RawCommands]: ReturnType<
    RawCommands[Command]
  > extends NonChainableCommandFunction
    ? void
    : (...args: Parameters<RawCommands[Command]>) => any;
};

/**
 * Utility type which receives an extension and provides the type of actions it
 * makes available.
 */
export type CommandsFromExtensions<ExtensionUnion extends AnyExtension> = UnionToIntersection<
  MapToUnchainedCommand<GetCommands<ExtensionUnion> | GetDecoratedCommands<ExtensionUnion>>
>;

/**
 * This uses a hack available via conditional types and `Distributive
 * conditional types`. When a conditional is used on a union it distributes the
 * types so that the union can avoid the case where:
 *
 * > access is restricted to members that are common to all types in the union
 *
 * A better explanation is available here
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types
 */
type GetDecoratedCommands<Type> = Type extends AnyExtension
  ? ConditionalPick<Type, AnyFunction<CommandFunction>>
  : never;

export interface ChainedCommandRunParameter {
  /**
   * Dispatches the chained commands.
   *
   * @remarks
   *
   * ```ts
   * commands.chain.insertText('hello').run();
   * ```
   */
  run: () => void;
}

export type ChainedIntersection<ExtensionUnion extends AnyExtension> = UnionToIntersection<
  MapToChainedCommand<GetCommands<ExtensionUnion> | GetDecoratedCommands<ExtensionUnion>>
>;

export type ChainedFromExtensions<
  ExtensionUnion extends AnyExtension
> = ChainedCommandRunParameter &
  {
    [Command in keyof ChainedIntersection<ExtensionUnion>]: ChainedIntersection<ExtensionUnion>[Command] extends (
      ...args: any[]
    ) => any
      ? (
          ...args: Parameters<ChainedIntersection<ExtensionUnion>[Command]>
        ) => ChainedFromExtensions<ExtensionUnion>
      : never;
  };

/**
 * Utility type for pulling all the command names from a list
 */
export type CommandNames<ExtensionUnion extends AnyExtension> = StringKey<
  CommandsFromExtensions<ExtensionUnion>
>;

/**
 * A utility type which maps the passed in extension helpers to a method called
 * with `manager.data.helpers.helperName()`.
 */
export type MapHelpers<RawHelpers extends Record<string, AnyFunction>> = {
  [Helper in keyof RawHelpers]: RawHelpers[Helper];
};

/**
 * Utility type which receives an extension and provides the type of helpers it
 * makes available.
 */
export type HelpersFromExtensions<ExtensionUnion extends AnyExtension> = UnionToIntersection<
  MapHelpers<GetHelpers<ExtensionUnion> | GetDecoratedHelpers<ExtensionUnion>>
>;

export type HelperAnnotation = Flavoring<'HelperAnnotation'>;

/**
 * An annotation which marks decorated helper methods for an extension.
 */
export type Helper<Type> = Type extends null | undefined ? Type : Type & HelperAnnotation;

/**
 * Remove the helper annotation.
 */
type RemoveHelper<Type> = Type extends Helper<infer T> ? T : Type;
type RemoveHelpers<Type extends Record<string, AnyFunction>> = {
  [Key in keyof Type]: (...args: Parameters<Type[Key]>) => RemoveHelper<ReturnType<Type[Key]>>;
};

/**
 * A function with a return signature annotated as a helper.
 */
export type HelperFunction<Type extends HelperAnnotation = HelperAnnotation> = AnyFunction<Type>;

type GetDecoratedHelpers<Type> = Type extends object
  ? RemoveHelpers<ConditionalReturnPick<Type, HelperAnnotation>>
  : never;

/**
 * Utility type for pulling all the action names from a list
 */
export type HelperNames<ExtensionUnion extends AnyExtension> = StringKey<
  HelpersFromExtensions<ExtensionUnion>
>;

/**
 * Get the extension type and the extension type of all sub extensions.
 *
 * This uses recursive conditional types which are only available in
 * `typescript@4.1` https://github.com/microsoft/TypeScript/pull/40002
 */
export type GetExtensions<ExtensionUnion> =
  // I don't want to pick up `AnyExtension` in the collected union. If the
  // provided extension is `AnyExtension` return `never`. This has the added
  // benefit of making this a distributive conditional type.
  AnyExtension extends ExtensionUnion
    ? never
    : // Make sure the extension is valid
    ExtensionUnion extends AnyExtension
    ? // Now create the union of the provided extension and it's recursively
      // calculated nested extensions.
      ExtensionUnion | GetExtensions<ExtensionUnion['~E']>
    : never;

/**
 * The type which gets the active methods from the provided extensions.
 */
export type ActiveFromExtensions<ExtensionUnion extends AnyExtension> = Record<
  GetNodeNameUnion<ExtensionUnion> extends never ? string : GetNodeNameUnion<ExtensionUnion>,
  (attributes?: ProsemirrorAttributes) => boolean
> &
  Record<
    GetMarkNameUnion<ExtensionUnion> extends never ? string : GetMarkNameUnion<ExtensionUnion>,
    () => boolean
  >;

/**
 * Get the names of all available extensions.
 */
export type GetNameUnion<ExtensionUnion extends AnyExtension> = ExtensionUnion['name'];

/**
 * A utility type for retrieving the name of an extension only when it's a plain
 * extension.
 */
export type GetPlainNameUnion<
  ExtensionUnion extends AnyExtension
> = ExtensionUnion extends AnyPlainExtension ? ExtensionUnion['name'] : never;

/**
 * A utility type for retrieving the name of an extension only when it's a mark
 * extension.
 */
export type GetMarkNameUnion<
  ExtensionUnion extends AnyExtension
> = ExtensionUnion extends AnyMarkExtension ? ExtensionUnion['name'] : never;

/**
 * A utility type for retrieving the name of an extension only when it's a node
 * extension.
 */
export type GetNodeNameUnion<
  ExtensionUnion extends AnyExtension
> = ExtensionUnion extends AnyNodeExtension ? ExtensionUnion['name'] : never;

/**
 * Gets the editor schema from an extension union.
 */
export type GetSchema<ExtensionUnion extends AnyExtension> = EditorSchema<
  LiteralUnion<GetNodeNameUnion<ExtensionUnion>, string>,
  LiteralUnion<GetMarkNameUnion<ExtensionUnion>, string>
>;
