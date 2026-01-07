 // src/components/editor/extensions/ImageWithCaption.tsx
  import React from 'react';
  import { Node, mergeAttributes } from '@tiptap/core';
  import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

  function ImageWithCaptionView(props: any) {
    const { src, alt, caption } = props.node.attrs || {};

    return (
      <NodeViewWrapper className="my-6">
        <figure className="m-0">
          <img
            src={src}
            alt={alt || ''}
            className="w-full rounded-xl"
          />
          <div className="mt-2 flex items-center justify-center">
            <input
              value={caption || ''}
              onChange={(e) => props.updateAttributes({ caption: e.target.value })}
              placeholder="キャプションを入力"
              className="text-center text-sm text-gray-500 bg-transparent border-none outline-none w-full placeholder:text-gray-400"
            />
          </div>
        </figure>
      </NodeViewWrapper>
    );
  }

  const ImageWithCaption = Node.create({
    name: 'imageWithCaption',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
      return {
        src: { default: '' },
        alt: { default: '' },
        caption: { default: '' },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'figure[data-gm-image="1"]',
          getAttrs: (el) => {
            const figure = el as HTMLElement;
            const img = figure.querySelector('img') as HTMLImageElement | null;
            const cap = figure.querySelector('figcaption') as HTMLElement | null;
            return {
              src: img?.getAttribute('src') || '',
              alt: img?.getAttribute('alt') || '',
              caption: cap?.textContent || '',
            };
          },
        },
        {
          tag: 'img[src]',
          getAttrs: (el) => {
            const img = el as HTMLImageElement;
            return { src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '', caption: '' };
          },
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      const { src, alt, caption, ...rest } = HTMLAttributes as any;

      const imgAttrs = mergeAttributes(rest, {
        src,
        alt: alt || '',
      });

      if (caption) {
        return [
          'figure',
          { 'data-gm-image': '1' },
          ['img', imgAttrs],
          ['figcaption', { style: 'margin-top:8px;font-size:14px;color:#6b7280;text-align:center;' }, caption],
        ];
      }

      return ['figure', { 'data-gm-image': '1' }, ['img', imgAttrs]];
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageWithCaptionView);
    },
  });

  export default ImageWithCaption;
