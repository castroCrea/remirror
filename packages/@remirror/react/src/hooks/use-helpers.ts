import type { AnyExtension, RemirrorManager } from '@remirror/core';

import { ReactFrameworkOutput } from '../react-types';
import { useRemirrorContext } from './use-remirror-context';

type UseHelpersReturn<ExtensionUnion extends AnyExtension> = ReactFrameworkOutput<
  RemirrorManager<ExtensionUnion>['~E']
>['helpers'];

/**
 * A core hook which provides the helpers for usage in your editor.
 *
 * ```tsx
 * import { useHelpers } from 'remirror/react';
 *
 * const EditorButton = () => {
 *   const helpers = useHelpers();
 *
 *   return (
 *     <>
 *       <button onClick={() => Helpers.toggleBold()}>
 *         Click me!
 *       </button>
 *       <button onClick={() => Helpers.chain.toggleBold().toggleItalic().run()}>
 *         Chain me!
 *       </button>
 *     </>
 *   );
 * }
 * ````
 */
export function useHelpers<
  ExtensionUnion extends AnyExtension = Remirror.AllExtensionUnion
>(): UseHelpersReturn<ExtensionUnion> {
  return useRemirrorContext<ExtensionUnion>().helpers;
}
