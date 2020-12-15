import type * as _ from '@lingui/core';
import { defineMessage } from '@lingui/macro';

export const LABEL = defineMessage({
  id: 'extension.command.toggle-heading.label',
  comment: 'Label for heading command with support for levels.',
  message: `{level, select, 1 {Heading 1}
                            2 {Heading 2}
                            3 {Heading 3}
                            4 {Heading 4}
                            5 {Heading 5}
                            6 {Heading 6}
                            other {Heading}}`,
});

export const DESCRIPTION = defineMessage({
  id: 'extension.command.toggle-heading.description',
  comment: 'Description of the heading command with support for levels.',
  message: `{level, select, 1 {Emphasize the current block as a heading of priority level 1}
                            2 {Emphasize the current block as a heading of priority level 2}
                            3 {Emphasize the current block as a heading of priority level 3}
                            4 {Emphasize the current block as a heading of priority level 4}
                            5 {Emphasize the current block as a heading of priority level 5}
                            6 {Emphasize the current block as a heading of priority level 6}
                            other {Emphasize the current block as a heading}}`,
});
