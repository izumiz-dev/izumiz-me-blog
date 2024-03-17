import type { Block } from './interfaces';

export const pathJoin = (path: string, subPath: string) => {
  return (
    '/' +
    path
      .split('/')
      .concat(subPath.split('/'))
      .filter((p) => p)
      .join('/')
  );
};

export const blockToText = (blocks: Block[]): string => {
  return blocks.reduce(
    (acc, cur) =>
      acc +
        cur.Paragraph?.RichTexts.reduce(
          (acc, cur) => acc + cur.Text?.Content,
          ''
        ) || '',
    ''
  );
};
