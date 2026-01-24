import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
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
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInternalChange = useRef(false);
  const [counts, setCounts] = useState<{ chars: number; images: number }>(() => countFromHtml(value));

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
  };

  const counterText = useMemo(() => {
    return `全体: ${counts.chars}文字 / 画像${counts.images}枚`;
  }, [counts]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border border-gray-200 rounded-md p-2 bg-white">
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
        className="mt-2 min-h-[280px] w-full rounded-md border border-gray-200 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-gray-300"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ position: 'relative' }}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
