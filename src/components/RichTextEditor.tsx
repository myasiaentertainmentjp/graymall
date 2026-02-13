import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onUploadImage?: (file: File) => Promise<string>;
};

function countFromHtml(html: string): { chars: number; images: number } {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const images = doc.body.querySelectorAll('img').length;

  const rawText = doc.body.textContent || '';
  const compact = rawText.replace(/\s+/g, '');
  const chars = Array.from(compact).length;

  return { chars, images };
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '本文を入力…',
  className = '',
  onUploadImage,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const isInternalChange = useRef(false);
  const [counts, setCounts] = useState<{ chars: number; images: number }>(() => countFromHtml(value));

  // リンクモーダル
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // 画像アップロード中
  const [uploading, setUploading] = useState(false);

  const emitChange = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    isInternalChange.current = true;

    const next = countFromHtml(html);
    setCounts(next);

    onChange(html);
  }, [onChange]);

  // 外部からvalueが変更された場合にinnerHTMLを更新
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 内部での変更の場合はスキップ
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    // 外部からの変更を反映
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
      const next = countFromHtml(value || '');
      setCounts(next);
    }
  }, [value]);

  const ensureFocus = () => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el) el.focus();
  };

  const exec = (command: string, valueArg?: string) => {
    ensureFocus();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const setHeading = (level: 2 | 3) => {
    ensureFocus();
    document.execCommand('formatBlock', false, `h${level}`);
    emitChange();
  };

  const setParagraph = () => {
    ensureFocus();
    document.execCommand('formatBlock', false, 'p');
    emitChange();
  };

  const setBlockquote = () => {
    ensureFocus();
    document.execCommand('formatBlock', false, 'blockquote');
    emitChange();
  };

  const insertHR = () => {
    ensureFocus();
    document.execCommand('insertHorizontalRule', false);
    emitChange();
  };

  const clearFormatting = () => {
    ensureFocus();
    document.execCommand('removeFormat', false);
    document.execCommand('formatBlock', false, 'p');
    emitChange();
  };

  // 選択範囲を保存
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // 選択範囲を復元
  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  };

  // リンク挿入モーダルを開く
  const openLinkModal = () => {
    saveSelection();
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  // リンクを挿入
  const insertLink = () => {
    if (!linkUrl.trim()) {
      setLinkModalOpen(false);
      return;
    }

    ensureFocus();
    restoreSelection();

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;

    if (linkText.trim()) {
      // テキストがある場合はHTMLを挿入
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      // 選択範囲にリンクを適用
      document.execCommand('createLink', false, url);
      // target="_blank"を設定
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const parentEl = selection.anchorNode.parentElement;
        if (parentEl && parentEl.tagName === 'A') {
          parentEl.setAttribute('target', '_blank');
          parentEl.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }

    emitChange();
    setLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // 画像選択
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    // GIFはサポート対象外
    if (file.type === 'image/gif') {
      alert('GIF画像はサポートされていません。JPG、PNG、WebPをお使いください。');
      return;
    }

    setUploading(true);
    try {
      const url = await onUploadImage(file);
      ensureFocus();
      document.execCommand('insertImage', false, url);
      emitChange();
    } catch (err) {
      console.error('画像アップロードエラー:', err);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (imgInputRef.current) {
        imgInputRef.current.value = '';
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    ensureFocus();
    document.execCommand('insertText', false, text);
    emitChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      ensureFocus();
      document.execCommand('insertText', false, '  ');
      emitChange();
    }
    // Ctrl/Cmd + K でリンク挿入
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openLinkModal();
    }
  };

  const counterText = useMemo(() => {
    return `全体: ${counts.chars}文字 / 画像${counts.images}枚`;
  }, [counts]);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* ツールバー - sticky（ヘッダー+セクションタイトルの下） */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-2 bg-white sticky top-[110px] z-10 rounded-t-lg">
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => exec('bold')}
          title="太字"
        >
          太字
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => exec('italic')}
          title="斜体"
        >
          斜体
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => exec('underline')}
          title="下線"
        >
          下線
        </button>

        <div className="w-px bg-gray-200 mx-1 h-6" />

        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => setHeading(2)}
          title="見出し2"
        >
          H2
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => setHeading(3)}
          title="見出し3"
        >
          H3
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={setParagraph}
          title="本文"
        >
          P
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={setBlockquote}
          title="引用"
        >
          引用
        </button>

        <div className="w-px bg-gray-200 mx-1 h-6" />

        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => exec('insertUnorderedList')}
          title="箇条書き"
        >
          箇条書き
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={() => exec('insertOrderedList')}
          title="番号付き"
        >
          番号
        </button>

        <div className="w-px bg-gray-200 mx-1 h-6" />

        {/* リンク挿入ボタン */}
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center gap-1"
          onClick={openLinkModal}
          title="リンク (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
          リンク
        </button>

        {/* 画像挿入ボタン */}
        {onUploadImage && (
          <button
            type="button"
            className="px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center gap-1 disabled:opacity-50"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploading}
            title="画像を挿入"
          >
            <ImageIcon className="w-4 h-4" />
            {uploading ? '...' : '画像'}
          </button>
        )}

        <input
          ref={imgInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageSelect}
        />

        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
          onClick={insertHR}
          title="区切り線"
        >
          区切り線
        </button>

        <button
          type="button"
          className="ml-auto px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-600"
          onClick={clearFormatting}
          title="装飾解除"
        >
          解除
        </button>

        <div className="text-xs text-gray-500 select-none px-2">{counterText}</div>
      </div>

      <div
        ref={ref}
        className="mt-2 min-h-[280px] w-full rounded-md border border-gray-200 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-gray-300 prose prose-sm max-w-none"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ position: 'relative' }}
      />

      {/* リンク挿入モーダル */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">リンクを挿入</h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示テキスト（空欄の場合は選択中のテキストを使用）
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="リンクテキスト"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  挿入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        [contenteditable] a {
          color: #2563EB;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
