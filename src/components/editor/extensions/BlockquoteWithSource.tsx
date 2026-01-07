// src/components/editor/extensions/BlockquoteWithSource.tsx
  import React from 'react';
  import Blockquote from '@tiptap/extension-blockquote';
  import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

  function BlockquoteView(props: any) {
    const source: string = props.node?.attrs?.source || '';

    return (
      <NodeViewWrapper className="my-6">
        <div className="flex">
          {/* 左の縦線 */}
          <div className="w-1 bg-gray-200 rounded-full flex-shrink-0 mr-4" />

          <div className="flex-1">
            {/* 引用内容 */}
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <div className="prose prose-slate max-w-none text-gray-700">
                <NodeViewContent />
              </div>
            </div>

            {/* 出典入力 */}
            <div className="mt-2 flex justify-end">
              <input
                value={source}
                onChange={(e) => props.updateAttributes({ source: e.target.value })}
                placeholder="出典を入力"
                className="text-sm text-gray-500 bg-transparent border-none outline-none text-right placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  export const BlockquoteWithSource = Blockquote.extend({
    addAttributes() {
      return {
        ...(this.parent?.() || {}),
        source: {
          default: '',
          parseHTML: (element) => (element as HTMLElement).getAttribute('data-source') || '',
          renderHTML: (attributes) => {
            const src = attributes.source as string;
            return src ? { 'data-source': src } : {};
          },
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(BlockquoteView);
    },

    renderHTML({ HTMLAttributes }) {
      const source = (HTMLAttributes as any)?.['data-source'] || '';
      const base: any[] = ['blockquote', HTMLAttributes, 0];

      if (!source) return base;

      return [
        'blockquote',
        HTMLAttributes,
        ['div', { class: 'gm-quote-body' }, 0],
        ['div', { class: 'gm-quote-source', style: 'margin-top:8px;font-size:12px;color:#6b7280;text-align:right;' }, `出典: ${source}`],
      ];
    },
  });

  export default BlockquoteWithSource;
