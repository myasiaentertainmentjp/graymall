// src/components/EnhancedRichTextEditor.tsx
  import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
  import { Editor } from '@tiptap/core';
  import { EditorContent, useEditor } from '@tiptap/react';
  import { DOMSerializer } from '@tiptap/pm/model';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import Link from '@tiptap/extension-link';
  import TextAlign from '@tiptap/extension-text-align';
  import { Table } from '@tiptap/extension-table';
  import { TableRow } from '@tiptap/extension-table-row';
  import { TableHeader } from '@tiptap/extension-table-header';
  import { TableCell } from '@tiptap/extension-table-cell';
  import {
    Plus,
    Image as ImageIcon,
    Type,
    List,
    ListOrdered,
    Quote,
    Code,
    FileText,
    Minus,
    Bold,
    Strikethrough,
    Link as LinkIcon,
    ChevronDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Undo,
    Redo,
    Pencil,
    DollarSign,
    Heading2,
    Heading3,
    X,
    ExternalLink,
    Trash2,
    Table2,
  } from 'lucide-react';

  import { supabase } from '../lib/supabase';

  import BlockquoteWithSource from './editor/extensions/BlockquoteWithSource';
  import ImageWithCaption from './editor/extensions/ImageWithCaption';

  export type HeadingItem = { level: 2 | 3; text: string };

  export type RichTextEditorRef = {
    focusFree: () => void;
    focusPaid: () => void;
    scrollToHeadingIndex: (index: number) => void;
    openImagePicker: () => void;
    openFilePicker: () => void;
    toggleBold: () => void;
    toggleStrike: () => void;
    toggleBlockquote: () => void;
    toggleBulletList: () => void;
    toggleOrderedList: () => void;
    toggleCodeBlock: () => void;
    setParagraph: () => void;
    setHorizontalRule: () => void;
    setLink: (url: string) => void;
    undo: () => void;
    redo: () => void;
    toggleHeading2: () => void;
    toggleHeading3: () => void;
  };

  type Props = {
    articleId: string;
    content: string;
    paidContent: string;
    paidEnabled: boolean;
    onChangeContent: (html: string) => void;
    onChangePaidContent: (html: string) => void;
    onHeadingsChange?: (items: HeadingItem[]) => void;
    onTogglePaid?: (cursorContentAfter?: string) => void;
  };

  function safeUuid() {
    const c = globalThis.crypto;
    if (c && 'randomUUID' in c) return c.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getExt(name: string) {
    const dot = name.lastIndexOf('.');
    if (dot === -1) return '';
    return name.slice(dot + 1).toLowerCase();
  }

  function extractHeadingsFromHtml(html: string): HeadingItem[] {
    try {
      const doc = new DOMParser().parseFromString(html || '', 'text/html');
      const nodes = Array.from(doc.querySelectorAll('h2, h3'));
      return nodes
        .map((n) => {
          const level = n.tagName.toLowerCase() === 'h2' ? 2 : 3;
          const text = (n.textContent || '').trim();
          return text ? ({ level, text } as HeadingItem) : null;
        })
        .filter(Boolean) as HeadingItem[];
    } catch {
      return [];
    }
  }

  async function uploadToArticleImages(articleId: string, folder: 'articles' | 'files', file: File) {
    const ext = getExt(file.name) || 'bin';
    const key = `${folder}/${articleId}/${Date.now()}-${safeUuid()}.${ext}`;

    const { error } = await supabase.storage.from('article-images').upload(key, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;

    const { data } = supabase.storage.from('article-images').getPublicUrl(key);
    if (!data?.publicUrl) throw new Error('publicUrl の取得に失敗しました');
    return data.publicUrl;
  }

  // 外部画像URLかどうか判定
  function isExternalImageUrl(url: string): boolean {
    if (!url) return false;
    // data:URLは除外
    if (url.startsWith('data:')) return false;
    // 自サイトのSupabase Storageは除外
    if (url.includes('supabase') && url.includes('article-images')) return false;
    // 相対パスは除外
    if (url.startsWith('/') && !url.startsWith('//')) return false;
    // HTTPSの外部URLのみ対象
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // 画像をwebpに変換・リサイズ
  const MAX_IMAGE_WIDTH = 1200;
  const WEBP_QUALITY = 0.85;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // ファイルからWebPに変換（直接アップロード用）
  async function convertImageFileToWebp(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        // リサイズ計算
        let width = img.width;
        let height = img.height;
        if (width > MAX_IMAGE_WIDTH) {
          height = Math.round((height * MAX_IMAGE_WIDTH) / width);
          width = MAX_IMAGE_WIDTH;
        }

        // Canvasでwebpに変換
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context取得に失敗'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('WebP変換に失敗'));
            }
          },
          'image/webp',
          WEBP_QUALITY
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('画像の読み込みに失敗'));
      };

      img.src = objectUrl;
    });
  }

  async function convertToWebp(base64: string, contentType: string): Promise<Blob | null> {
    try {
      const img = new Image();
      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

      img.src = `data:${contentType};base64,${base64}`;
      await loadPromise;

      // リサイズ計算
      let width = img.width;
      let height = img.height;
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round((height * MAX_IMAGE_WIDTH) / width);
        width = MAX_IMAGE_WIDTH;
      }

      // Canvasでwebpに変換
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0, width, height);

      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', WEBP_QUALITY);
      });
    } catch (e) {
      console.warn('webp変換エラー:', e);
      return null;
    }
  }

  // Edge Function経由で外部画像を取得し、webp変換してStorageにアップロード
  async function proxyImageToStorage(imageUrl: string, articleId: string): Promise<string | null> {
    try {
      // 1. Edge Functionで外部画像をbase64で取得（CORSバイパス）
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ image_url: imageUrl }),
        }
      );

      if (!response.ok) {
        console.warn('proxy-image failed:', await response.text());
        return null;
      }

      const data = await response.json();
      if (!data.success || !data.base64) {
        console.warn('proxy-image no data:', data);
        return null;
      }

      // 2. フロントエンドでwebp変換
      const webpBlob = await convertToWebp(data.base64, data.content_type);
      if (!webpBlob) {
        console.warn('webp変換失敗');
        return null;
      }

      // 3. Supabase Storageにアップロード
      const file = new File([webpBlob], `image-${Date.now()}.webp`, { type: 'image/webp' });
      const newUrl = await uploadToArticleImages(articleId, 'articles', file);
      return newUrl;
    } catch (e) {
      console.warn('proxy-image error:', e);
      return null;
    }
  }

  function processInlineMarkdown(text: string): string {
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return text;
  }

  function simpleMarkdownToHtml(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          result.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          if (inList) {
            result.push(listType === 'ol' ? '</ol>' : '</ul>');
            inList = false;
            listType = null;
          }
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        continue;
      }

      if (line.trim() === '') {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        result.push(`<h3>${h3Match[1]}</h3>`);
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        result.push(`<h2>${h2Match[1]}</h2>`);
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        result.push(`<h2>${h1Match[1]}</h2>`);
        continue;
      }

      const olMatch = line.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(listType === 'ol' ? '</ol>' : '</ul>');
          result.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${processInlineMarkdown(olMatch[1])}</li>`);
        continue;
      }

      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(listType === 'ol' ? '</ol>' : '</ul>');
          result.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${processInlineMarkdown(ulMatch[1])}</li>`);
        continue;
      }

      const quoteMatch = line.match(/^>\s*(.*)$/);
      if (quoteMatch) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        result.push(`<blockquote><p>${processInlineMarkdown(quoteMatch[1])}</p></blockquote>`);
        continue;
      }

      if (line.match(/^[-*_]{3,}$/)) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
          listType = null;
        }
        result.push('<hr>');
        continue;
      }

      if (inList) {
        result.push(listType === 'ol' ? '</ol>' : '</ul>');
        inList = false;
        listType = null;
      }
      result.push(`<p>${processInlineMarkdown(line)}</p>`);
    }

    if (inList) {
      result.push(listType === 'ol' ? '</ol>' : '</ul>');
    }
    if (inCodeBlock) {
      result.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
    }

    return result.join('');
  }

  function looksLikeMarkdown(text: string): boolean {
    const patterns = [
      /^#{1,3}\s+/m,
      /^\d+\.\s+/m,
      /^[-*]\s+/m,
      /^>\s+/m,
      /\*\*[^*]+\*\*/,
      /`[^`]+`/,
      /^```/m,
      /\[[^\]]+\]\([^)]+\)/,
    ];
    return patterns.some((p) => p.test(text));
  }

  function buildExtensions(placeholder: string) {
    return [
      StarterKit.configure({ blockquote: false }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'border-collapse w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      BlockquoteWithSource,
      ImageWithCaption,
    ];
  }

  function runOn(editor: Editor | null, fn: (ed: Editor) => void) {
    if (!editor) return;
    fn(editor);
  }

  type PlusButtonState = {
    visible: boolean;
    top: number;
    left: number;
    buttonY: number;
  };

  type FloatingToolbarState = {
    visible: boolean;
    top: number;
    left: number;
  };

  type LinkPopoverState = {
    visible: boolean;
    top: number;
    left: number;
    url: string;
    isEditing: boolean;
  };

  export default forwardRef<RichTextEditorRef, Props>(function EnhancedRichTextEditor(
    { articleId, content, paidContent, paidEnabled, onChangeContent, onChangePaidContent, onHeadingsChange, onTogglePaid },
    ref,
  ) {
    const [active, setActive] = useState<'free' | 'paid'>('free');
    const [plusBtn, setPlusBtn] = useState<PlusButtonState>({ visible: false, top: 0, left: 0, buttonY: 0 });
    const [plusMenuOpen, setPlusMenuOpen] = useState(false);
    const [floatingToolbar, setFloatingToolbar] = useState<FloatingToolbarState>({ visible: false, top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
    const [listMenuOpen, setListMenuOpen] = useState(false);
    const [alignMenuOpen, setAlignMenuOpen] = useState(false);
    const [bubbleHeadingMenuOpen, setBubbleHeadingMenuOpen] = useState(false);
    const [isInTable, setIsInTable] = useState(false);
    const [tableMenuOpen, setTableMenuOpen] = useState(false);

    const [linkPopover, setLinkPopover] = useState<LinkPopoverState>({
      visible: false,
      top: 0,
      left: 0,
      url: '',
      isEditing: false,
    });
    const linkInputRef = useRef<HTMLInputElement | null>(null);

    const imgInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const freeEditorContainerRef = useRef<HTMLDivElement | null>(null);
    const paidEditorContainerRef = useRef<HTMLDivElement | null>(null);

    const headingExtractTimerRef = useRef<number | null>(null);

    // 有料エリア挿入用: ＋ボタン表示時の段落位置を保存
    // before: 段落の前の位置（この位置から後ろが有料エリアになる）
    const savedParagraphPosRef = useRef<{ before: number } | null>(null);

    const freeEditorInitializedRef = useRef(false);
    const paidEditorInitializedRef = useRef(false);
    const lastExternalContentRef = useRef(content);
    const lastExternalPaidContentRef = useRef(paidContent);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const scheduleHeadingExtraction = useCallback((html: string) => {
      if (headingExtractTimerRef.current) {
        clearTimeout(headingExtractTimerRef.current);
      }
      headingExtractTimerRef.current = window.setTimeout(() => {
        onHeadingsChange?.(extractHeadingsFromHtml(html));
      }, 50);
    }, [onHeadingsChange]);

    const updatePlusButtonPosition = useCallback((editor: Editor, containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!editor || !containerRef.current) {
        setPlusBtn({ visible: false, top: 0, left: 0, buttonY: 0 });
        return;
      }

      const { selection } = editor.state;
      const { $from } = selection;
      const node = $from.parent;
      const isEmptyParagraph = node.type.name === 'paragraph' && node.content.size === 0;

      if (!isEmptyParagraph) {
        setPlusBtn({ visible: false, top: 0, left: 0, buttonY: 0 });
        setPlusMenuOpen(false);
        // 位置はクリアしない（handleInsertPaidAreaの最後でクリアされる）
        // メニュー操作中にフォーカスが動いても保存位置を保持するため
        return;
      }

      try {
        const domNode = editor.view.nodeDOM($from.before());
        if (!domNode || !(domNode instanceof HTMLElement)) {
          setPlusBtn({ visible: false, top: 0, left: 0, buttonY: 0 });
          return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const nodeRect = domNode.getBoundingClientRect();

        // ＋ボタン表示時に段落位置を保存（有料エリア挿入用）
        // before() で段落の前の位置を取得（その段落から後ろが有料になる）
        try {
          const beforePos = $from.before();
          console.log('updatePlusButtonPosition: 保存する位置:', beforePos, 'カーソル位置:', $from.pos, 'ドキュメントサイズ:', editor.state.doc.content.size);
          savedParagraphPosRef.current = { before: beforePos };
        } catch (e) {
          console.warn('updatePlusButtonPosition: $from.before()でエラー:', e);
          savedParagraphPosRef.current = null;
        }

        setPlusBtn({
          visible: true,
          top: nodeRect.top - containerRect.top + nodeRect.height / 2 - 16,
          left: 8,
          buttonY: nodeRect.top,
        });
      } catch {
        setPlusBtn({ visible: false, top: 0, left: 0, buttonY: 0 });
      }
    }, []);

    const updateFloatingToolbar = useCallback((editor: Editor, containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!editor || !containerRef.current) {
        setFloatingToolbar({ visible: false, top: 0, left: 0 });
        return;
      }

      const { selection } = editor.state;
      const { from, to, empty } = selection;
      const isInTable = editor.isActive('table');

      // テーブル内の場合: 選択がなくても（クリックしただけでも）ツールバーを表示
      if (isInTable) {
        try {
          const coords = editor.view.coordsAtPos(from);
          const containerRect = containerRef.current.getBoundingClientRect();

          const menuHeight = 44;
          const offset = 12;
          let top = coords.top - containerRect.top - menuHeight - offset;

          if (top < 0) {
            top = coords.bottom - containerRect.top + offset;
          }

          setFloatingToolbar({
            visible: true,
            top: Math.max(0, top),
            left: Math.max(120, Math.min(coords.left - containerRect.left, containerRect.width - 120)),
          });
        } catch {
          setFloatingToolbar({ visible: false, top: 0, left: 0 });
        }
        return;
      }

      // テーブル外: 選択がない場合はツールバーを隠す
      if (empty) {
        setFloatingToolbar({ visible: false, top: 0, left: 0 });
        setBubbleHeadingMenuOpen(false);
        setLinkPopover(prev => ({ ...prev, visible: false }));
        return;
      }

      try {
        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const containerRect = containerRef.current.getBoundingClientRect();
        const centerX = (start.left + end.left) / 2 - containerRect.left;

        const menuHeight = 44;
        const offset = 12;
        let top = start.top - containerRect.top - menuHeight - offset;

        if (top < 0) {
          top = end.bottom - containerRect.top + offset;
        }

        setFloatingToolbar({
          visible: true,
          top: Math.max(0, top),
          left: Math.max(120, Math.min(centerX, containerRect.width - 120)),
        });
      } catch {
        setFloatingToolbar({ visible: false, top: 0, left: 0 });
      }
    }, []);

    const handleSelectionUpdate = useCallback(
      (editor: Editor, containerRef: React.RefObject<HTMLDivElement | null>) => {
        updatePlusButtonPosition(editor, containerRef);
        updateFloatingToolbar(editor, containerRef);
        // テーブル内かどうかを更新（モバイル用）
        setIsInTable(editor.isActive('table'));
      },
      [updatePlusButtonPosition, updateFloatingToolbar],
    );

    const freeEditor = useEditor({
      extensions: buildExtensions('本文を書く'),
      content,
      onCreate: ({ editor }) => {
        freeEditorInitializedRef.current = true;
        setTimeout(() => updatePlusButtonPosition(editor, freeEditorContainerRef), 50);
        // 初期化時に見出しを抽出
        const initialHtml = editor.getHTML();
        if (initialHtml) {
          scheduleHeadingExtraction(initialHtml);
        }
      },
      onFocus: ({ editor }) => {
        setActive('free');
        setTimeout(() => handleSelectionUpdate(editor, freeEditorContainerRef), 0);
      },
      onSelectionUpdate: ({ editor }) => {
        if (active === 'free') {
          handleSelectionUpdate(editor, freeEditorContainerRef);
          // モバイル用の位置保存は＋ボタンクリック時に行う（onSelectionUpdateでは行わない）
        }
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        if (freeEditorInitializedRef.current) {
          onChangeContent(html);
          lastExternalContentRef.current = html;
        }
        scheduleHeadingExtraction(html);
        if (active === 'free') handleSelectionUpdate(editor, freeEditorContainerRef);
      },
      onBlur: () => {
        setTimeout(() => {
          setFloatingToolbar({ visible: false, top: 0, left: 0 });
          setBubbleHeadingMenuOpen(false);
        }, 200);
      },
      editorProps: {
        attributes: { class: 'prose prose-slate max-w-none focus:outline-none min-h-[420px] pl-12 pr-4 py-4' },
        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;

          const html = clipboardData.getData('text/html');
          if (html && html.trim()) {
            setTimeout(() => {
              const currentHtml = view.state.doc.textContent ? (view as any).editor?.getHTML() : '';
              if (currentHtml) {
                scheduleHeadingExtraction(currentHtml);
              }
            }, 100);
            return false;
          }

          const text = clipboardData.getData('text/plain');
          if (!text) return false;

          if (looksLikeMarkdown(text)) {
            event.preventDefault();
            const convertedHtml = simpleMarkdownToHtml(text);
            setTimeout(() => {
              const editorInstance = (view as any).editor;
              if (editorInstance) {
                editorInstance.chain().focus().insertContent(convertedHtml).run();
                setTimeout(() => {
                  scheduleHeadingExtraction(editorInstance.getHTML());
                }, 50);
              }
            }, 0);
            return true;
          }

          return false;
        },
      },
    });

    const paidEditor = useEditor({
      extensions: buildExtensions('有料エリアを書く'),
      content: paidContent,
      onCreate: ({ editor }) => {
        paidEditorInitializedRef.current = true;
        setTimeout(() => {
          if (active === 'paid') updatePlusButtonPosition(editor, paidEditorContainerRef);
        }, 50);
      },
      onFocus: ({ editor }) => {
        setActive('paid');
        setTimeout(() => handleSelectionUpdate(editor, paidEditorContainerRef), 0);
      },
      onSelectionUpdate: ({ editor }) => {
        if (active === 'paid') handleSelectionUpdate(editor, paidEditorContainerRef);
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        if (paidEditorInitializedRef.current) {
          onChangePaidContent(html);
          lastExternalPaidContentRef.current = html;
        }
        if (active === 'paid') handleSelectionUpdate(editor, paidEditorContainerRef);
      },
      onBlur: () => {
        setTimeout(() => {
          setFloatingToolbar({ visible: false, top: 0, left: 0 });
          setBubbleHeadingMenuOpen(false);
        }, 200);
      },
      editorProps: {
        attributes: { class: 'prose prose-slate max-w-none focus:outline-none min-h-[260px] pl-12 pr-4 py-4' },
        handlePaste: (view, event) => {
          const clipboardData = event.clipboardData;
          if (!clipboardData) return false;

          const html = clipboardData.getData('text/html');
          if (html && html.trim()) return false;

          const text = clipboardData.getData('text/plain');
          if (!text) return false;

          if (looksLikeMarkdown(text)) {
            event.preventDefault();
            const convertedHtml = simpleMarkdownToHtml(text);
            setTimeout(() => {
              const editorInstance = (view as any).editor;
              if (editorInstance) {
                editorInstance.chain().focus().insertContent(convertedHtml).run();
              }
            }, 0);
            return true;
          }

          return false;
        },
      },
    });

    useEffect(() => {
      if (!freeEditor || !freeEditorInitializedRef.current) return;
      if (content !== lastExternalContentRef.current) {
        const currentHtml = freeEditor.getHTML();
        if (currentHtml !== content) {
          freeEditor.commands.setContent(content || '<p></p>', false);
          // コンテンツ読み込み時に見出しを抽出
          scheduleHeadingExtraction(content || '');
        }
        lastExternalContentRef.current = content;
      }
    }, [content, freeEditor, scheduleHeadingExtraction]);

    useEffect(() => {
      if (!paidEditor || !paidEditorInitializedRef.current) return;
      if (paidContent !== lastExternalPaidContentRef.current) {
        const currentHtml = paidEditor.getHTML();
        if (currentHtml !== paidContent) {
          paidEditor.commands.setContent(paidContent || '<p></p>', false);
        }
        lastExternalPaidContentRef.current = paidContent;
      }
    }, [paidContent, paidEditor]);

    const currentEditor = useMemo(() => (active === 'paid' ? paidEditor : freeEditor), [active, freeEditor, paidEditor]);

    async function handlePickImage(file: File) {
      // GIFはサポート対象外
      if (file.type === 'image/gif') {
        alert('GIF画像はサポートされていません。JPG、PNG、WebPをお使いください。');
        return;
      }

      // 対応形式のチェック
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        alert('サポートされていない画像形式です。JPG、PNG、WebPをお使いください。');
        return;
      }

      try {
        // WebPに変換・圧縮
        const webpBlob = await convertImageFileToWebp(file);
        const webpFile = new File([webpBlob], `${Date.now()}.webp`, { type: 'image/webp' });

        const url = await uploadToArticleImages(articleId, 'articles', webpFile);
        runOn(currentEditor, (ed) => {
          ed.chain().focus().insertContent({ type: 'imageWithCaption', attrs: { src: url, alt: file.name, caption: '' } }).run();
        });
      } catch (err) {
        console.error('画像変換エラー:', err);
        // フォールバック: 変換失敗時は元のファイルをアップロード
        const url = await uploadToArticleImages(articleId, 'articles', file);
        runOn(currentEditor, (ed) => {
          ed.chain().focus().insertContent({ type: 'imageWithCaption', attrs: { src: url, alt: file.name, caption: '' } }).run();
        });
      }
    }

    async function handlePickFile(file: File) {
      const url = await uploadToArticleImages(articleId, 'files', file);
      runOn(currentEditor, (ed) => {
        const name = file.name || 'file';
        ed.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).run();
      });
    }

    // 外部画像を含むHTMLをペースト時に変換・アップロード
    const processingImagesRef = useRef(false);

    // HTMLからfigure/figcaptionを解析してキャプション付き画像を抽出
    function extractFiguresWithCaptions(html: string): { src: string; caption: string; figureHtml: string }[] {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const figures = doc.querySelectorAll('figure');

        return Array.from(figures).map(fig => {
          const img = fig.querySelector('img');
          const figcaption = fig.querySelector('figcaption');
          return {
            src: img?.getAttribute('src') || '',
            caption: figcaption?.textContent?.trim() || '',
            figureHtml: fig.outerHTML,
          };
        }).filter(f => f.src && isExternalImageUrl(f.src));
      } catch {
        return [];
      }
    }

    async function processExternalImagesInHtml(html: string, editor: Editor): Promise<void> {
      if (processingImagesRef.current) return;

      // まずfigure/figcaptionを処理（note.com等からのコピー対応）
      const figuresWithCaptions = extractFiguresWithCaptions(html);

      // 通常のimg要素も抽出（figure内以外）
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      const matches: { fullMatch: string; url: string; caption: string }[] = [];
      let match;

      // figure内の画像URLを記録（重複処理を避ける）
      const figureImageUrls = new Set(figuresWithCaptions.map(f => f.src));

      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1];
        if (isExternalImageUrl(url) && !figureImageUrls.has(url)) {
          matches.push({ fullMatch: match[0], url, caption: '' });
        }
      }

      // figure + 通常の画像がなければ終了
      if (figuresWithCaptions.length === 0 && matches.length === 0) return;

      processingImagesRef.current = true;

      let currentHtml = editor.getHTML();
      const { from } = editor.state.selection;

      // 1. figureキャプション付き画像を処理
      for (const { src, caption, figureHtml } of figuresWithCaptions) {
        try {
          const newUrl = await proxyImageToStorage(src, articleId);
          if (!newUrl) continue;

          // figure要素をimageWithCaptionノードに置換
          // まずfigure全体を探して、imageWithCaptionのHTMLに置換
          const imageWithCaptionHtml = `<div data-gm-image="1"><img src="${newUrl}" alt=""><figcaption>${caption}</figcaption></div>`;

          // HTMLからfigure要素を検索して置換
          const escapedFigureHtml = figureHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const figureRegex = new RegExp(escapedFigureHtml, 'g');

          if (figureRegex.test(currentHtml)) {
            currentHtml = currentHtml.replace(figureRegex, imageWithCaptionHtml);
          } else {
            // figureが見つからない場合、src URLで置換を試みる
            const escapedUrl = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            currentHtml = currentHtml.replace(new RegExp(escapedUrl, 'g'), newUrl);
          }
        } catch (e) {
          console.warn('figure画像の変換に失敗:', src, e);
        }
      }

      // 2. 通常の画像を処理
      for (const { url } of matches) {
        try {
          const newUrl = await proxyImageToStorage(url, articleId);
          if (!newUrl) continue;

          const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          currentHtml = currentHtml.replace(new RegExp(escapedUrl, 'g'), newUrl);
        } catch (e) {
          console.warn('外部画像の変換に失敗:', url, e);
        }
      }

      // 変更があれば更新
      if (currentHtml !== editor.getHTML()) {
        editor.commands.setContent(currentHtml, false);
        try {
          editor.commands.setTextSelection(Math.min(from, editor.state.doc.content.size));
        } catch {}
      }

      processingImagesRef.current = false;
    }

    function openImagePicker() { imgInputRef.current?.click(); }
    function openFilePicker() { fileInputRef.current?.click(); }

    // 外部画像の自動変換（ペースト後に実行）
    useEffect(() => {
      if (!freeEditor || !freeEditorInitializedRef.current) return;
      const html = freeEditor.getHTML();
      if (html.includes('<img') && html.includes('http')) {
        // 遅延して実行（ペースト完了後）
        const timer = setTimeout(() => {
          processExternalImagesInHtml(html, freeEditor);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [content, freeEditor]);

    useEffect(() => {
      if (!paidEditor || !paidEditorInitializedRef.current) return;
      const html = paidEditor.getHTML();
      if (html.includes('<img') && html.includes('http')) {
        const timer = setTimeout(() => {
          processExternalImagesInHtml(html, paidEditor);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [paidContent, paidEditor]);

    const showLinkPopover = useCallback(() => {
      if (!currentEditor) return;

      const { selection } = currentEditor.state;
      const { from } = selection;
      const containerRef = active === 'paid' ? paidEditorContainerRef : freeEditorContainerRef;

      if (!containerRef.current) return;

      try {
        const coords = currentEditor.view.coordsAtPos(from);
        const containerRect = containerRef.current.getBoundingClientRect();

        const existingUrl = currentEditor.getAttributes('link').href || '';

        setLinkPopover({
          visible: true,
          top: coords.top - containerRect.top - 50,
          left: coords.left - containerRect.left,
          url: existingUrl,
          isEditing: !!existingUrl,
        });

        setTimeout(() => linkInputRef.current?.focus(), 100);
      } catch {
        const url = window.prompt('URLを入力');
        if (url) {
          currentEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
      }
    }, [currentEditor, active]);

    const applyLink = useCallback(() => {
      if (!currentEditor || !linkPopover.url.trim()) return;

      let url = linkPopover.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }

      currentEditor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setLinkPopover(prev => ({ ...prev, visible: false, url: '' }));
    }, [currentEditor, linkPopover.url]);

    const removeLink = useCallback(() => {
      if (!currentEditor) return;
      currentEditor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkPopover(prev => ({ ...prev, visible: false, url: '' }));
    }, [currentEditor]);

    // 有料エリア挿入: 現在のカーソル位置の段落から後ろを有料エリアに移動
    const handleInsertPaidArea = useCallback(() => {
      if (!freeEditor || paidEnabled) {
        // 既に有料エリアがある場合はトグル
        onTogglePaid?.();
        return;
      }

      const { state } = freeEditor;
      const { doc } = state;
      const docEnd = doc.content.size;

      // 現在の選択位置から分割点を計算
      // $from.before() で「現在の段落の前」の位置を取得
      // これにより、現在の段落から後ろがすべて有料エリアになる
      let splitPos: number | null = null;

      // まず保存された位置を確認
      if (savedParagraphPosRef.current?.before != null) {
        splitPos = savedParagraphPosRef.current.before;
      }

      // 保存位置がない場合、現在の選択位置を使用
      if (splitPos === null) {
        try {
          const { $from } = freeEditor.state.selection;
          // $from.before() で現在の段落の前の位置を取得
          splitPos = $from.before();
        } catch {
          // エラーの場合はドキュメント末尾（有料エリアは空になる）
          splitPos = docEnd;
        }
      }

      // 位置の妥当性をチェック
      if (splitPos < 0) splitPos = 0;
      if (splitPos > docEnd) splitPos = docEnd;

      console.log('有料エリア挿入: savedParagraphPosRef:', savedParagraphPosRef.current, '分割位置:', splitPos, 'ドキュメントサイズ:', docEnd, '現在の選択位置:', freeEditor.state.selection.from);

      let contentAfterCursor = '';

      // 分割位置より後にコンテンツがある場合
      if (splitPos < docEnd) {
        try {
          const slice = doc.slice(splitPos, docEnd);

          // sliceにコンテンツがあるか確認
          if (slice.content.size > 0) {
            const tempDiv = document.createElement('div');

            // DOMSerializerを使用してHTMLに変換
            const serializer = DOMSerializer.fromSchema(state.schema);
            const fragment = serializer.serializeFragment(slice.content);
            tempDiv.appendChild(fragment);
            contentAfterCursor = tempDiv.innerHTML;

            console.log('有料エリアに移動するコンテンツ:', contentAfterCursor.substring(0, 100) + '...');

            // 分割位置より後を削除
            if (contentAfterCursor && contentAfterCursor.trim()) {
              freeEditor.chain().focus().deleteRange({ from: splitPos, to: docEnd }).run();
              onChangeContent(freeEditor.getHTML());
            }
          }
        } catch (e) {
          console.warn('コンテンツ移動エラー:', e);
        }
      }

      // 保存された位置をクリア
      savedParagraphPosRef.current = null;

      // 有料エリアを表示
      onTogglePaid?.(contentAfterCursor);
    }, [freeEditor, paidEnabled, onTogglePaid, onChangeContent]);

    const insertBlock = useCallback(
      (type: string) => {
        if (!currentEditor && type !== 'paid') return;
        setPlusMenuOpen(false);
        setMobileMenuOpen(false);
        setHeadingMenuOpen(false);
        setListMenuOpen(false);
        setAlignMenuOpen(false);
        setBubbleHeadingMenuOpen(false);
        setLinkPopover(prev => ({ ...prev, visible: false }));

        switch (type) {
          case 'h2': currentEditor?.chain().focus().toggleHeading({ level: 2 }).run(); break;
          case 'h3': currentEditor?.chain().focus().toggleHeading({ level: 3 }).run(); break;
          case 'bullet': currentEditor?.chain().focus().toggleBulletList().run(); break;
          case 'ordered': currentEditor?.chain().focus().toggleOrderedList().run(); break;
          case 'quote': currentEditor?.chain().focus().toggleBlockquote().run(); break;
          case 'code': currentEditor?.chain().focus().toggleCodeBlock().run(); break;
          case 'hr': currentEditor?.chain().focus().setHorizontalRule().run(); break;
          case 'table': currentEditor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
          case 'image': openImagePicker(); break;
          case 'file': openFilePicker(); break;
          case 'bold': currentEditor?.chain().focus().toggleBold().run(); break;
          case 'strike': currentEditor?.chain().focus().toggleStrike().run(); break;
          case 'align-left': currentEditor?.chain().focus().setTextAlign('left').run(); break;
          case 'align-center': currentEditor?.chain().focus().setTextAlign('center').run(); break;
          case 'align-right': currentEditor?.chain().focus().setTextAlign('right').run(); break;
          case 'undo': currentEditor?.chain().focus().undo().run(); break;
          case 'redo': currentEditor?.chain().focus().redo().run(); break;
          case 'paid': handleInsertPaidArea(); break;
        }
      },
      [currentEditor, handleInsertPaidArea],
    );

    useImperativeHandle(ref, () => ({
      focusFree: () => freeEditor?.commands.focus(),
      focusPaid: () => paidEditor?.commands.focus(),
      scrollToHeadingIndex: (index: number) => {
        if (!freeEditor) return;
        const root = freeEditor.view.dom as HTMLElement;
        const nodes = root.querySelectorAll('h2, h3');
        const el = nodes.item(index) as HTMLElement | null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      openImagePicker,
      openFilePicker,
      toggleBold: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleBold().run()),
      toggleStrike: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleStrike().run()),
      toggleBlockquote: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleBlockquote().run()),
      toggleBulletList: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleBulletList().run()),
      toggleOrderedList: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleOrderedList().run()),
      toggleCodeBlock: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleCodeBlock().run()),
      setParagraph: () => runOn(currentEditor, (ed) => ed.chain().focus().setParagraph().run()),
      setHorizontalRule: () => runOn(currentEditor, (ed) => ed.chain().focus().setHorizontalRule().run()),
      setLink: (url: string) => runOn(currentEditor, (ed) => { if (url) ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); }),
      undo: () => runOn(currentEditor, (ed) => ed.chain().focus().undo().run()),
      redo: () => runOn(currentEditor, (ed) => ed.chain().focus().redo().run()),
      toggleHeading2: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run()),
      toggleHeading3: () => runOn(currentEditor, (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run()),
    }));

    const plusMenuItems = [
      { key: 'h2', icon: Type, label: '見出し2', size: 'w-5 h-5' },
      { key: 'h3', icon: Type, label: '見出し3', size: 'w-4 h-4' },
      { key: 'bullet', icon: List, label: '箇条書き', size: 'w-5 h-5' },
      { key: 'ordered', icon: ListOrdered, label: '番号リスト', size: 'w-5 h-5' },
      { key: 'quote', icon: Quote, label: '引用', size: 'w-5 h-5' },
      { key: 'code', icon: Code, label: 'コードブロック', size: 'w-5 h-5' },
      { key: 'hr', icon: Minus, label: '区切り線', size: 'w-5 h-5' },
      { key: 'table', icon: Table2, label: '表（テーブル）', size: 'w-5 h-5' },
      { key: 'image', icon: ImageIcon, label: '画像', size: 'w-5 h-5' },
      { key: 'file', icon: FileText, label: 'ファイル', size: 'w-5 h-5' },
      { key: 'paid', icon: DollarSign, label: paidEnabled ? '有料エリア削除' : '有料エリア挿入', size: 'w-5 h-5' },
    ];

    const getMenuPosition = useCallback(() => {
      const viewportHeight = window.innerHeight;
      const menuHeight = 440;
      const buttonY = plusBtn.buttonY;
      const spaceBelow = viewportHeight - buttonY - 50;
      const spaceAbove = buttonY - 50;
      if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
        return { showAbove: true };
      }
      return { showAbove: false };
    }, [plusBtn.buttonY]);

    const renderPlusButton = (containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) => {
      if (!isActive || !plusBtn.visible || isMobile) return null;

      const { showAbove } = getMenuPosition();

      return (
        <>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // PC版: 位置は updatePlusButtonPosition で保存済みなので上書きしない
              setPlusMenuOpen(!plusMenuOpen);
            }}
            className="absolute z-20 w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            style={{ top: plusBtn.top, left: plusBtn.left }}
          >
            <Plus className={`w-5 h-5 text-gray-500 transition-transform ${plusMenuOpen ? 'rotate-45' : ''}`} />
          </button>

          {plusMenuOpen && (
            <div
              className="absolute z-30 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 min-w-[180px] max-h-[400px] overflow-y-auto"
              style={showAbove
                ? { bottom: `calc(100% - ${plusBtn.top}px + 8px)`, left: plusBtn.left }
                : { top: plusBtn.top + 40, left: plusBtn.left }
              }
              onMouseDown={(e) => e.preventDefault()}
            >
              {plusMenuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertBlock(item.key);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700"
                >
                  <item.icon className={item.size} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </>
      );
    };

    const renderLinkPopover = () => {
      if (!linkPopover.visible) return null;

      const containerRef = active === 'paid' ? paidEditorContainerRef : freeEditorContainerRef;
      if (!containerRef.current) return null;

      return (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-3"
          style={{ top: linkPopover.top, left: linkPopover.left, minWidth: '280px' }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <input
              ref={linkInputRef}
              type="url"
              placeholder="https://example.com"
              value={linkPopover.url}
              onChange={(e) => setLinkPopover(prev => ({ ...prev, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  setLinkPopover(prev => ({ ...prev, visible: false }));
                }
              }}
              className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={applyLink}
              onTouchEnd={applyLink}
              className="h-9 px-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
            >
              適用
            </button>
          </div>
          {linkPopover.isEditing && (
            <div className="mt-2 flex items-center gap-2">
              <a
                href={linkPopover.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate flex-1"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{linkPopover.url}</span>
              </a>
              <button
                type="button"
                onClick={removeLink}
                onTouchEnd={removeLink}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                解除
              </button>
            </div>
          )}
        </div>
      );
    };

    const renderFloatingToolbar = (isActive: boolean) => {
      if (!isActive || !floatingToolbar.visible || !currentEditor || isMobile) return null;

      const isBold = currentEditor.isActive('bold');
      const isStrike = currentEditor.isActive('strike');
      const isLink = currentEditor.isActive('link');
      const isQuote = currentEditor.isActive('blockquote');
      const isCode = currentEditor.isActive('codeBlock');
      const isH2 = currentEditor.isActive('heading', { level: 2 });
      const isH3 = currentEditor.isActive('heading', { level: 3 });
      const isTable = currentEditor.isActive('table');

      // テーブル内の場合は専用ツールバーを表示（シンプルに+ボタンのみ）
      if (isTable) {
        // テーブルから抜ける処理
        const exitTable = () => {
          // テーブルの後ろに移動
          const { state } = currentEditor;
          const { $from } = state.selection;
          // テーブルノードを探して、その後ろに移動
          let depth = $from.depth;
          while (depth > 0) {
            const node = $from.node(depth);
            if (node.type.name === 'table') {
              const after = $from.after(depth);
              currentEditor.chain().focus().setTextSelection(after).run();
              return;
            }
            depth--;
          }
          // 見つからない場合は末尾に移動
          currentEditor.chain().focus('end').run();
        };

        return (
          <div
            className="absolute z-40 bg-slate-900 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
            style={{ top: floatingToolbar.top, left: floatingToolbar.left, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); exitTable(); }}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-white"
              title="表から出る"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-600" />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().addRowAfter().run(); }}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-700 flex items-center gap-1.5 text-white text-sm"
              title="行を追加"
            >
              <Plus className="w-4 h-4" />
              <span>行</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().addColumnAfter().run(); }}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-700 flex items-center gap-1.5 text-white text-sm"
              title="列を追加"
            >
              <Plus className="w-4 h-4" />
              <span>列</span>
            </button>
          </div>
        );
      }

      return (
        <div
          className="absolute z-40 bg-slate-900 rounded-xl shadow-lg px-2 py-1.5 flex items-center gap-0.5"
          style={{ top: floatingToolbar.top, left: floatingToolbar.left, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().toggleBold().run(); }}
            className={`p-2 rounded-lg ${isBold ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
            title="太字"
          >
            <Bold className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().toggleStrike().run(); }}
            className={`p-2 rounded-lg ${isStrike ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
            title="取り消し線"
          >
            <Strikethrough className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              showLinkPopover();
            }}
            className={`p-2 rounded-lg ${isLink ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
            title="リンク"
          >
            <LinkIcon className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().toggleBlockquote().run(); }}
            className={`p-2 rounded-lg ${isQuote ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
            title="引用"
          >
            <Quote className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); currentEditor.chain().focus().toggleCodeBlock().run(); }}
            className={`p-2 rounded-lg ${isCode ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
            title="コード"
          >
            <Code className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBubbleHeadingMenuOpen(!bubbleHeadingMenuOpen);
              }}
              className={`p-2 rounded-lg flex items-center gap-1 ${(isH2 || isH3) ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              title="見出し"
            >
              <Type className="w-4 h-4 text-white" />
              <ChevronDown className="w-3 h-3 text-white" />
            </button>
            {bubbleHeadingMenuOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px] z-50"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    currentEditor.chain().focus().toggleHeading({ level: 2 }).run();
                    setBubbleHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${isH2 ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <Heading2 className="w-4 h-4" />
                  見出し大
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    currentEditor.chain().focus().toggleHeading({ level: 3 }).run();
                    setBubbleHeadingMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${isH3 ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                >
                  <Heading3 className="w-4 h-4" />
                  見出し小
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    currentEditor.chain().focus().setParagraph().run();
                    setBubbleHeadingMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                >
                  <Type className="w-4 h-4" />
                  本文
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    // 要件5修正: SP版ツールバーにonClick/onTouchEndを追加
    const handleMobileAction = useCallback((action: () => void) => {
      return {
        onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); action(); },
        onClick: (e: React.MouseEvent) => { e.preventDefault(); action(); },
        onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); action(); },
      };
    }, []);

    const renderMobileToolbar = () => {
      if (!isMobile) return null;

      // テーブル内の場合は専用ツールバーを表示（シンプルに+ボタンのみ）
      if (isInTable && currentEditor) {
        // テーブルから抜ける処理
        const exitTable = () => {
          const { state } = currentEditor;
          const { $from } = state.selection;
          let depth = $from.depth;
          while (depth > 0) {
            const node = $from.node(depth);
            if (node.type.name === 'table') {
              const after = $from.after(depth);
              currentEditor.chain().focus().setTextSelection(after).run();
              return;
            }
            depth--;
          }
          currentEditor.chain().focus('end').run();
        };

        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
            <div className="flex items-center justify-center px-4 py-3 gap-3">
              <button
                type="button"
                {...handleMobileAction(exitTable)}
                className="h-10 px-4 rounded-lg bg-gray-100 active:bg-gray-200 flex items-center gap-2 text-sm text-gray-700"
              >
                <X className="w-4 h-4" />
                <span>戻る</span>
              </button>
              <button
                type="button"
                {...handleMobileAction(() => currentEditor.chain().focus().addRowAfter().run())}
                className="h-10 px-4 rounded-lg bg-gray-100 active:bg-gray-200 flex items-center gap-2 text-sm text-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span>行を追加</span>
              </button>
              <button
                type="button"
                {...handleMobileAction(() => currentEditor.chain().focus().addColumnAfter().run())}
                className="h-10 px-4 rounded-lg bg-gray-100 active:bg-gray-200 flex items-center gap-2 text-sm text-gray-700"
              >
                <Plus className="w-4 h-4" />
                <span>列を追加</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb" style={{ overflow: 'visible' }}>
          <div className="flex items-center px-2 py-2 gap-1" style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <button
              type="button"
              {...handleMobileAction(() => {
                // モバイルの＋ボタンでも段落位置を保存（有料エリア挿入用）
                if (!mobileMenuOpen && freeEditor) {
                  try {
                    const { $from } = freeEditor.state.selection;
                    savedParagraphPosRef.current = { before: $from.before() };
                  } catch {
                    savedParagraphPosRef.current = null;
                  }
                }
                setMobileMenuOpen(!mobileMenuOpen);
                setHeadingMenuOpen(false);
                setListMenuOpen(false);
                setAlignMenuOpen(false);
              })}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
            >
              <Plus className={`w-5 h-5 text-gray-700 ${mobileMenuOpen ? 'rotate-45' : ''} transition-transform`} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <div className="relative flex-shrink-0">
              <button
                type="button"
                {...handleMobileAction(() => {
                  setHeadingMenuOpen(!headingMenuOpen);
                  setMobileMenuOpen(false);
                  setListMenuOpen(false);
                  setAlignMenuOpen(false);
                })}
                className="h-10 px-3 rounded-lg flex items-center gap-1 hover:bg-gray-100 active:bg-gray-200 text-sm text-gray-700"
              >
                見出し
                <ChevronDown className="w-4 h-4" />
              </button>
              {headingMenuOpen && (
                <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-1 min-w-[120px] z-50">
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('h2'))}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    見出し2
                  </button>
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('h3'))}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    見出し3
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('bold'))}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentEditor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <Bold className="w-5 h-5 text-gray-700" />
            </button>

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('strike'))}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentEditor?.isActive('strike') ? 'bg-gray-200' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <Strikethrough className="w-5 h-5 text-gray-700" />
            </button>

            <div className="relative flex-shrink-0">
              <button
                type="button"
                {...handleMobileAction(() => {
                  setListMenuOpen(!listMenuOpen);
                  setMobileMenuOpen(false);
                  setHeadingMenuOpen(false);
                  setAlignMenuOpen(false);
                })}
                className="h-10 px-2 rounded-lg flex items-center gap-1 hover:bg-gray-100 active:bg-gray-200"
              >
                <List className="w-5 h-5 text-gray-700" />
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {listMenuOpen && (
                <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-1 min-w-[140px] z-50">
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('bullet'))}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 rounded-lg flex items-center gap-2"
                  >
                    <List className="w-4 h-4" /> 箇条書き
                  </button>
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('ordered'))}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100 rounded-lg flex items-center gap-2"
                  >
                    <ListOrdered className="w-4 h-4" /> 番号リスト
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <button
                type="button"
                {...handleMobileAction(() => {
                  setAlignMenuOpen(!alignMenuOpen);
                  setMobileMenuOpen(false);
                  setHeadingMenuOpen(false);
                  setListMenuOpen(false);
                })}
                className="h-10 px-2 rounded-lg flex items-center gap-1 hover:bg-gray-100 active:bg-gray-200"
              >
                <AlignLeft className="w-5 h-5 text-gray-700" />
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {alignMenuOpen && (
                <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-200 p-1 z-50">
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('align-left'))}
                    className="w-full px-3 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('align-center'))}
                    className="w-full px-3 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    {...handleMobileAction(() => insertBlock('align-right'))}
                    className="w-full px-3 py-2 hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              type="button"
              {...handleMobileAction(showLinkPopover)}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentEditor?.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <LinkIcon className="w-5 h-5 text-gray-700" />
            </button>

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('quote'))}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentEditor?.isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <Quote className="w-5 h-5 text-gray-700" />
            </button>

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('code'))}
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentEditor?.isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <Code className="w-5 h-5 text-gray-700" />
            </button>

            <button
              type="button"
              {...handleMobileAction(openImagePicker)}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
            >
              <Pencil className="w-5 h-5 text-gray-700" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('undo'))}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
            >
              <Undo className="w-5 h-5 text-gray-700" />
            </button>

            <button
              type="button"
              {...handleMobileAction(() => insertBlock('redo'))}
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
            >
              <Redo className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="p-3 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                {plusMenuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    {...handleMobileAction(() => insertBlock(item.key))}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                  >
                    <item.icon className="w-6 h-6 text-gray-700" />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    // 要件2修正: 有料エリア削除時にpaidContentをfreeEditorの末尾にマージ
    const handleRemovePaidArea = useCallback(() => {
      if (!paidEnabled) return;

      // paidEditorの内容をfreeEditorの末尾にマージ
      if (freeEditor && paidEditor) {
        const paidHtml = paidEditor.getHTML();
        // 空でない場合のみマージ
        const isEmpty = !paidHtml || !paidHtml.trim() || paidHtml === '<p></p>' || paidHtml === '<p><br></p>';
        if (!isEmpty) {
          // freeEditorの末尾に移動してpaidContentを挿入
          freeEditor.chain().focus('end').insertContent(paidHtml).run();
          onChangeContent(freeEditor.getHTML());
        }
        // paidEditorをクリア（マージしたので）
        paidEditor.commands.setContent('<p></p>', false);
        onChangePaidContent('<p></p>');
      }

      // 有料エリアを非表示
      onTogglePaid?.();
    }, [paidEnabled, freeEditor, paidEditor, onTogglePaid, onChangeContent, onChangePaidContent]);

    useEffect(() => {
      const handleClickOutside = () => {
        setPlusMenuOpen(false);
        setMobileMenuOpen(false);
        setHeadingMenuOpen(false);
        setListMenuOpen(false);
        setAlignMenuOpen(false);
        setBubbleHeadingMenuOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (headingExtractTimerRef.current) {
          clearTimeout(headingExtractTimerRef.current);
        }
      };
    }, []);

    return (
      <div className={`space-y-4 ${isMobile ? 'pb-16' : ''}`}>
        <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.currentTarget.value = '';
            if (!f) return;
            try { await handlePickImage(f); }
            catch (err: any) { console.error(err); alert(err?.message || '画像アップロードに失敗しました'); }
          }}
        />

        <input ref={fileInputRef} type="file" className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.currentTarget.value = '';
            if (!f) return;
            try { await handlePickFile(f); }
            catch (err: any) { console.error(err); alert(err?.message || 'ファイルアップロードに失敗しました'); }
          }}
        />

        <div ref={freeEditorContainerRef} className={`relative ${paidEnabled ? '[&_.ProseMirror]:!min-h-0' : ''}`} onMouseDown={() => setActive('free')} onTouchStart={() => setActive('free')}>
          <EditorContent editor={freeEditor} />
          {renderPlusButton(freeEditorContainerRef, active === 'free')}
          {renderFloatingToolbar(active === 'free')}
          {active === 'free' && renderLinkPopover()}
        </div>

        {/* 有料エリア - paidContentは常に保持される */}
        <div className={paidEnabled ? '' : 'hidden'}>
          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 border-t-2 border-dashed border-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">ここから先は有料部分です</span>
              <button
                type="button"
                onClick={handleRemovePaidArea}
                onTouchEnd={handleRemovePaidArea}
                className="p-1 rounded hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                title="有料エリアを削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-gray-300" />
          </div>
          <div
            ref={paidEditorContainerRef}
            className="relative [&_.ProseMirror]:!min-h-0"
            onMouseDown={() => setActive('paid')}
            onTouchStart={() => setActive('paid')}
          >
            <EditorContent editor={paidEditor} />
            {renderPlusButton(paidEditorContainerRef, active === 'paid')}
            {renderFloatingToolbar(active === 'paid')}
            {active === 'paid' && renderLinkPopover()}
          </div>
        </div>

        {renderMobileToolbar()}
      </div>
    );
  });
