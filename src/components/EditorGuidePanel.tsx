// src/components/EditorGuidePanel.tsx

  function Key({ children }: { children: string }) {
    return (
      <span className="min-w-[24px] text-center px-1.5 py-0.5 rounded border border-gray-200 bg-white text-xs">
        {children}
      </span>
    );
  }

  function ShortcutRow({ label, keys }: { label: string; keys: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="inline-flex items-center gap-1">{keys}</span>
      </div>
    );
  }

  export default function EditorGuidePanel() {
    return (
      <div className="space-y-6">
        {/* キーボードショートカット */}
        <div>
          <div className="space-y-1">
            <ShortcutRow
              label="中央寄せ"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>E</Key></>}
            />
            <ShortcutRow
              label="左寄せ"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>L</Key></>}
            />
            <ShortcutRow
              label="右寄せ"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>R</Key></>}
            />
            <ShortcutRow
              label="箇条書きリスト"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>8</Key></>}
            />
            <ShortcutRow
              label="番号付きリスト"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>7</Key></>}
            />
            <ShortcutRow
              label="段落を上に移動"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>↑</Key></>}
            />
            <ShortcutRow
              label="段落を下に移動"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>↓</Key></>}
            />
            <ShortcutRow
              label="段落内改行"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>Return</Key></>}
            />
            <ShortcutRow
              label="段落内改行"
              keys={<><Key>⌥</Key><span className="text-gray-400">+</span><Key>Return</Key></>}
            />
            <ShortcutRow
              label="リンク"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>K</Key></>}
            />
            <ShortcutRow
              label="ルビ"
              keys={<><Key>⌘</Key><span className="text-gray-400">+</span><Key>⌥</Key><span className="text-gray-400">+</span><Key>|選択|</Key></>}
            />
          </div>
        </div>

        {/* 記法 */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">記法</div>

          <div className="space-y-4">
            {/* ルビ */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">ルビ</div>
              <p className="text-xs text-gray-500 mb-2">
                ルビ記法をつかうことで、ふりがなをつけることができます。難しい漢字や表現をわかりやすく伝えることができます。
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">好き</span>
                <span className="px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600">
                  |好き《スキ》|
                </span>
              </div>
            </div>

            {/* 数式 */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">数式</div>
              <p className="text-xs text-gray-500 mb-2">
                数式記法をつかうことで、TeX方式で書かれた数式を表示することができます。
              </p>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700"
              >
                数式について
              </button>
            </div>

            {/* 株価チャート */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">株価チャート</div>
              <p className="text-xs text-gray-500 mb-2">
                証券コードを入力しリターンキーを押すことで、株価のチャートを記事内に表示できます。
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">日本株</span>
                  <span className="px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600">
                    ^6243
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">米国株</span>
                  <span className="px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs text-gray-600">
                    $GOOG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
