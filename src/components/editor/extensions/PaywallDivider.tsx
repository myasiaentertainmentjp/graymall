// src/components/editor/extensions/PaywallDivider.tsx
import { Node } from '@tiptap/core';

export const PaywallDivider = Node.create({
  name: 'paywallDivider',
  group: 'block',
  atom: true,

  parseHTML() {
    return [
      { tag: 'div[data-paywall-boundary="true"]' },
      { tag: 'hr[data-paywall-boundary="true"]' },
    ];
  },

  renderHTML() {
    return ['div', { 'data-paywall-boundary': 'true' }];
  },
});

export default PaywallDivider;
