import React, { useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { translateStringToHindi } from '@/utils/translationDictionary';

interface TextState {
  original: string;
  lastTranslated: string;
}

// WeakMaps to track original text per node/element
const textStateMap = new WeakMap<Node, TextState>();
const placeholderStateMap = new WeakMap<Element, TextState>();
const titleStateMap = new WeakMap<Element, TextState>();

let isTranslating = false;

function shouldSkipNode(node: Node): boolean {
  if (!node.parentElement) return false;
  const tagName = node.parentElement.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) {
    return true;
  }
  if (node.parentElement.closest('[data-no-translate]')) {
    return true;
  }
  return false;
}

function translateDOMTree(root: Element | Document = document) {
  if (isTranslating) return;
  isTranslating = true;

  try {
    // 1. Translate all text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodesToTranslate: Node[] = [];
    while (walker.nextNode()) {
      nodesToTranslate.push(walker.currentNode);
    }

    for (const node of nodesToTranslate) {
      let state = textStateMap.get(node);

      // If no state OR current text is NOT what we last translated to, React updated it
      if (!state || node.nodeValue !== state.lastTranslated) {
        state = {
          original: node.nodeValue || '',
          lastTranslated: '',
        };
      }

      const translated = translateStringToHindi(state.original);
      if (node.nodeValue !== translated) {
        node.nodeValue = translated;
      }

      state.lastTranslated = translated;
      textStateMap.set(node, state);
    }

    // 2. Translate placeholders & titles
    const elements = root.querySelectorAll('input, textarea, button, [title], [placeholder]');
    elements.forEach((el) => {
      if (el.hasAttribute('placeholder')) {
        const currentPh = el.getAttribute('placeholder') || '';
        let state = placeholderStateMap.get(el);
        if (!state || currentPh !== state.lastTranslated) {
          state = { original: currentPh, lastTranslated: '' };
        }
        const transPh = translateStringToHindi(state.original);
        if (currentPh !== transPh) {
          el.setAttribute('placeholder', transPh);
        }
        state.lastTranslated = transPh;
        placeholderStateMap.set(el, state);
      }

      if (el.hasAttribute('title')) {
        const currentTitle = el.getAttribute('title') || '';
        let state = titleStateMap.get(el);
        if (!state || currentTitle !== state.lastTranslated) {
          state = { original: currentTitle, lastTranslated: '' };
        }
        const transTitle = translateStringToHindi(state.original);
        if (currentTitle !== transTitle) {
          el.setAttribute('title', transTitle);
        }
        state.lastTranslated = transTitle;
        titleStateMap.set(el, state);
      }
    });
  } finally {
    isTranslating = false;
  }
}

function restoreDOMTree(root: Element | Document = document) {
  // 1. Walk the live DOM to find and restore all translated text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const state = textStateMap.get(node);
    if (state && node.nodeValue === state.lastTranslated) {
      if (node.nodeValue !== state.original) {
        node.nodeValue = state.original;
      }
      state.lastTranslated = state.original; // Reset so next Hindi pass records fresh
    }
  }

  // 2. Restore placeholders & titles via live DOM query
  const elements = root.querySelectorAll('input, textarea, button, [title], [placeholder]');
  elements.forEach((el) => {
    const statePh = placeholderStateMap.get(el);
    if (statePh && el.getAttribute('placeholder') === statePh.lastTranslated) {
      el.setAttribute('placeholder', statePh.original);
      statePh.lastTranslated = statePh.original;
    }

    const stateTitle = titleStateMap.get(el);
    if (stateTitle && el.getAttribute('title') === stateTitle.lastTranslated) {
      el.setAttribute('title', stateTitle.original);
      stateTitle.lastTranslated = stateTitle.original;
    }
  });
}

export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguageStore();
  const observerRef = useRef<MutationObserver | null>(null);

  // Sync across tabs and portals
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'aura-portal-language' && e.newValue) {
        if (e.newValue === 'en' || e.newValue === 'hi') {
          setLanguage(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (language === 'hi') {
      translateDOMTree(document.body);

      let timeoutId: any = null;
      const observer = new MutationObserver(() => {
        if (isTranslating) return;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          translateDOMTree(document.body);
        }, 60);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false, // Prevents text modification self-trigger loops
      });

      observerRef.current = observer;

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
        clearTimeout(timeoutId);
      };
    } else {
      // Disconnect observer first, then restore
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      restoreDOMTree(document.body);
    }
  }, [language]);

  return <>{children}</>;
}
