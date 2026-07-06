import { editorViewCtx, type CmdKey } from '@milkdown/kit/core';
import {
  createCodeBlockCommand,
  insertHrCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import {
  insertTableCommand,
  toggleStrikethroughCommand,
} from '@milkdown/kit/preset/gfm';
import { callCommand } from '@milkdown/kit/utils';
import { useInstance } from '@milkdown/react';
import {
  BoldIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  SquareCodeIcon,
  StrikethroughIcon,
  TableIcon,
  TextQuoteIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';

import type { MarkdownFeatures } from '@elek-io/core';

export interface MarkdownToolbarProps {
  features: MarkdownFeatures;
  disabled: boolean;
}

/**
 * Compact toolbar over the markdown editor. Renders only the affordances the
 * field's features enable. Buttons use onMouseDown with preventDefault so the
 * editor selection survives the click.
 */
export const MarkdownToolbar = ({
  features,
  disabled,
}: MarkdownToolbarProps): ReactElement | null => {
  const [isLoading, getEditor] = useInstance();

  function run<T>(key: CmdKey<T>, payload?: T): void {
    if (isLoading) {
      return;
    }
    const editor = getEditor();
    editor.action(callCommand(key, payload));
    editor.action((ctx) => {
      ctx.get(editorViewCtx).focus();
    });
  }

  const button = (
    label: string,
    icon: ReactNode,
    onRun: () => void
  ): ReactElement => (
    <Button
      key={label}
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onRun();
      }}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  );

  const hasMarks =
    features.strong ||
    features.emphasis ||
    features.inlineCode ||
    features.strikethrough;
  const hasBlocks =
    features.headings.length > 0 ||
    features.blockquotes ||
    features.lists ||
    features.codeBlocks ||
    features.thematicBreak ||
    features.tables;

  if (!hasMarks && !hasBlocks) {
    return null;
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-1 border-b border-zinc-200 p-1 dark:border-zinc-700">
      {features.headings.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
            >
              <HeadingIcon />
              <span className="sr-only">Heading</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={() => {
                run(turnIntoTextCommand.key);
              }}
            >
              <PilcrowIcon /> Paragraph
            </DropdownMenuItem>
            {features.headings.map((depth) => (
              <DropdownMenuItem
                key={depth}
                onSelect={() => {
                  run(wrapInHeadingCommand.key, depth);
                }}
              >
                Heading {depth}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {features.strong
        ? button('Bold', <BoldIcon />, () => {
            run(toggleStrongCommand.key);
          })
        : null}
      {features.emphasis
        ? button('Italic', <ItalicIcon />, () => {
            run(toggleEmphasisCommand.key);
          })
        : null}
      {features.inlineCode
        ? button('Inline code', <CodeIcon />, () => {
            run(toggleInlineCodeCommand.key);
          })
        : null}
      {features.strikethrough
        ? button('Strikethrough', <StrikethroughIcon />, () => {
            run(toggleStrikethroughCommand.key);
          })
        : null}

      {features.lists
        ? button('Bullet list', <ListIcon />, () => {
            run(wrapInBulletListCommand.key);
          })
        : null}
      {features.lists
        ? button('Ordered list', <ListOrderedIcon />, () => {
            run(wrapInOrderedListCommand.key);
          })
        : null}
      {features.blockquotes
        ? button('Blockquote', <TextQuoteIcon />, () => {
            run(wrapInBlockquoteCommand.key);
          })
        : null}
      {features.codeBlocks
        ? button('Code block', <SquareCodeIcon />, () => {
            run(createCodeBlockCommand.key);
          })
        : null}
      {features.tables
        ? button('Table', <TableIcon />, () => {
            run(insertTableCommand.key, {});
          })
        : null}
      {features.thematicBreak
        ? button('Thematic break', <MinusIcon />, () => {
            run(insertHrCommand.key);
          })
        : null}
    </div>
  );
};
