// src/components/TableOfContentsPanel.tsx
import { Lock } from 'lucide-react';

type HeadingItem = { level: 2 | 3; text: string; isPaid?: boolean };

type Props = {
  headings: HeadingItem[];
  onJump?: (index: number) => void;
};

export function TableOfContentsPanel({ headings, onJump }: Props) {
  // 最初の有料見出しのインデックスを見つける
  const firstPaidIndex = headings.findIndex((h) => h.isPaid);

  return (
    <div>
      {headings.length === 0 ? (
        <div className="text-sm text-gray-500">見出しがまだありません</div>
      ) : (
        <div className="space-y-1">
          {headings.map((x, idx) => {
            // 有料セクションの最初の見出しの前に区切りを表示
            const showPaidDivider = firstPaidIndex !== -1 && idx === firstPaidIndex;

            return (
              <div key={`${x.level}-${idx}-${x.text}`}>
                {showPaidDivider && (
                  <div className="flex items-center gap-2 py-2 mt-2 mb-1 border-t border-gray-200">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600">有料パート</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onJump?.(idx)}
                  className={[
                    'w-full text-left py-2 text-sm flex items-center gap-1.5',
                    'hover:text-gray-900 transition-colors',
                    x.level === 3 ? 'pl-4 text-gray-500' : 'pl-0 font-semibold text-gray-800',
                    x.isPaid ? 'text-gray-400' : '',
                  ].join(' ')}
                >
                  <span className="truncate">{x.text}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TableOfContentsPanel;
