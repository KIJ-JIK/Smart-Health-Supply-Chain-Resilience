'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { translateStringToHindi } from '@/utils/translationDictionary';

const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

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
      let original = originalTextMap.get(node);
      if (original === undefined) {
        original = node.nodeValue || '';
        originalTextMap.set(node, original);
      }

      // Always translate from pristine original English
      const translated = translateStringToHindi(original);
      if (node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    }

    // 2. Translate placeholders & titles
    const elements = root.querySelectorAll('input, textarea, button, [title], [placeholder]');
    elements.forEach((el) => {
      if (el.hasAttribute('placeholder')) {
        let origPh = originalPlaceholderMap.get(el);
        if (origPh === undefined) {
          origPh = el.getAttribute('placeholder') || '';
          originalPlaceholderMap.set(el, origPh);
        }
        const transPh = translateStringToHindi(origPh);
        if (el.getAttribute('placeholder') !== transPh) {
          el.setAttribute('placeholder', transPh);
        }
      }

      if (el.hasAttribute('title')) {
        let origTitle = originalTitleMap.get(el);
        if (origTitle === undefined) {
          origTitle = el.getAttribute('title') || '';
          originalTitleMap.set(el, origTitle);
        }
        const transTitle = translateStringToHindi(origTitle);
        if (el.getAttribute('title') !== transTitle) {
          el.setAttribute('title', transTitle);
        }
      }
    });
  } finally {
    isTranslating = false;
  }
}

function restoreDOMTree(root: Element | Document = document) {
  // 1. Restore text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (originalTextMap.has(node)) {
      const orig = originalTextMap.get(node) || '';
      if (node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
    }
  }

  // 2. Restore placeholders & titles
  const elements = root.querySelectorAll('input, textarea, button, [title], [placeholder]');
  elements.forEach((el) => {
    if (originalPlaceholderMap.has(el)) {
      el.setAttribute('placeholder', originalPlaceholderMap.get(el) || '');
    }
    if (originalTitleMap.has(el)) {
      el.setAttribute('title', originalTitleMap.get(el) || '');
    }
  });
}

export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguageStore();
  const observerRef = useRef<MutationObserver | null>(null);

  // Sync across tabs and initialize on mount
  useEffect(() => {
    // Initialize on mount
    const saved = localStorage.getItem('aura-portal-language');
    if (saved === 'en' || saved === 'hi') {
      setLanguage(saved);
    }

    // Sync across tabs
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
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      restoreDOMTree(document.body);
    }
  }, [language]);

  return <>{children}</>;
}
