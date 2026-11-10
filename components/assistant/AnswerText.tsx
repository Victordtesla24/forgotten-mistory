import { cn } from '@/lib/cn';

interface ListBlock {
  kind: 'list';
  ordered: boolean;
  items: string[];
}

type Block = { kind: 'paragraph'; text: string } | ListBlock;

const LIST_ITEM = /^\s*(?:([-*•])|(\d+[.)]))\s+(.*)$/;

/** Split text into paragraphs and lists. Blank lines end a block; nothing else is interpreted. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: ListBlock | undefined;

  const endParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };

  for (const line of text.split('\n')) {
    const item = LIST_ITEM.exec(line);
    if (item) {
      endParagraph();
      const ordered = item[2] !== undefined;
      if (list?.ordered === ordered) {
        list.items.push(item[3]);
      } else {
        list = { kind: 'list', ordered, items: [item[3]] };
        blocks.push(list);
      }
    } else if (line.trim() === '') {
      endParagraph();
      list = undefined;
    } else {
      list = undefined;
      paragraph.push(line.trim());
    }
  }
  endParagraph();
  return blocks;
}

/**
 * An answer as plain paragraphs and lists. The text goes through React as text,
 * never as markup, so nothing the model writes can inject HTML.
 */
export function AnswerText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('grid gap-2 wrap-anywhere', className)}>
      {toBlocks(text).map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p key={index} className="max-w-none">
              {block.text}
            </p>
          );
        }
        const List = block.ordered ? 'ol' : 'ul';
        return (
          <List
            key={index}
            className={cn('grid gap-1 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}
          >
            {block.items.map((item, position) => (
              <li key={position}>{item}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
