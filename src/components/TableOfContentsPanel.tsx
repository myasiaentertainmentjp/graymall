// src/components/TableOfContentsPanel.tsx

  type HeadingItem = { level: 2 | 3; text: string };

  type Props = {
    headings: HeadingItem[];
    onJump?: (index: number) => void;
  };

  export function TableOfContentsPanel({ headings, onJump }: Props) {
    return (
      <div>
        {headings.length === 0 ? (
          <div className="text-sm text-gray-500">見出しがまだありません</div>
        ) : (
          <div className="space-y-1">
            {headings.map((x, idx) => (
              <button
                key={`${x.level}-${idx}-${x.text}`}
                type="button"
                onClick={() => onJump?.(idx)}
                className={[
                  'w-full text-left py-2 text-sm',
                  'hover:text-gray-900',
                  x.level === 3 ? 'pl-4 text-gray-500' : 'pl-0 font-semibold text-gray-800',
                ].join(' ')}
              >
                {x.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  export default TableOfContentsPanel;
