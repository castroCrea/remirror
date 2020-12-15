import {
  ApplySchemaAttributes,
  CommandFunction,
  extension,
  ExtensionTag,
  KeyBindings,
  MarkExtension,
  MarkExtensionSpec,
  MarkSpecOverride,
  toggleMark,
} from '@remirror/core';

@extension({})
export class UnderlineExtension extends MarkExtension {
  get name() {
    return 'underline' as const;
  }

  createTags() {
    return [ExtensionTag.FontStyle, ExtensionTag.SupportsExit, ExtensionTag.FormattingMark];
  }

  createMarkSpec(extra: ApplySchemaAttributes, override: MarkSpecOverride): MarkExtensionSpec {
    return {
      ...override,
      attrs: extra.defaults(),
      parseDOM: [
        {
          tag: 'u',
          getAttrs: extra.parse,
        },
        {
          style: 'text-decoration',
          getAttrs: (node) => (node === 'underline' ? {} : false),
        },
      ],
      toDOM: (mark) => ['u', extra.dom(mark), 0],
    };
  }

  createKeymap(): KeyBindings {
    return {
      'Mod-u': toggleMark({ type: this.type }),
    };
  }

  createCommands() {
    return {
      /**
       * Toggle the underline formatting of the selected text.
       */
      toggleUnderline: (): CommandFunction => toggleMark({ type: this.type }),
    };
  }
}

declare global {
  namespace Remirror {
    interface AllExtensions {
      underline: UnderlineExtension;
    }
  }
}
