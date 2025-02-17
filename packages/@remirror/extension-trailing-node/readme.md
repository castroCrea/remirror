# @remirror/extension-trailing-node

> Make sure there's always space to type in your editor.

[![Version][version]][npm] [![Weekly Downloads][downloads-badge]][npm] [![Bundled size][size-badge]][size] [![Typed Codebase][typescript]](#) [![MIT License][license]](#)

[version]: https://flat.badgen.net/npm/v/@remirror/extension-trailing-node/next
[npm]: https://npmjs.com/package/@remirror/extension-trailing-node/v/next
[license]: https://flat.badgen.net/badge/license/MIT/purple
[size]: https://bundlephobia.com/result?p=@remirror/extension-trailing-node@next
[size-badge]: https://flat.badgen.net/bundlephobia/minzip/@remirror/extension-trailing-node@next
[typescript]: https://flat.badgen.net/badge/icon/TypeScript?icon=typescript&label
[downloads-badge]: https://badgen.net/npm/dw/@remirror/extension-trailing-node/red?icon=npm

## Installation

```bash
# yarn
yarn add @remirror/extension-trailing-node@next @remirror/pm@next

# pnpm
pnpm add @remirror/extension-trailing-node@next @remirror/pm@next

# npm
npm install @remirror/extension-trailing-node@next @remirror/pm@next
```

This is included by default when you install the recommended `remirror` package. All exports are also available via the entry-point, `remirror/extension/trailing-node`.

## Usage

The following code creates an instance of this extension.

```ts
import { TrailingNodeExtension } from 'remirror/extension/trailing-node';

const extension = new TrailingNodeExtension();
```
