'use client';

import React, { useEffect, useRef } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { translateStringToHindi } from '@/utils/translationDictionary';

const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

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
    if (!originalTextMap.has(node)) {
      originalTextMap.set(node, node.nodeValue || '');
    }
    const current = node.nodeValue || '';
    const translated = translateStringToHindi(current);
    if (translated !== current) {
      node.nodeValue = translated;
    }
  }

  // 2. Translate placeholders & titles
  const elements = root.querySelectorAll('input, textarea, button, [title], [placeholder]');
  elements.forEach((el) => {
    if (el.hasAttribute('placeholder')) {
      if (!originalPlaceholderMap.has(el)) {
        originalPlaceholderMap.set(el, el.getAttribute('placeholder') || '');
      }
      const ph = el.getAttribute('placeholder') || '';
      const transPh = translateStringToHindi(ph);
      if (transPh !== ph) {
        el.setAttribute('placeholder', transPh);
      }
    }

    if (el.hasAttribute('title')) {
      if (!originalTitleMap.has(el)) {
        originalTitleMap.set(el, el.getAttribute('title') || '');
      }
      const title = el.getAttribute('title') || '';
      const transTitle = translateStringToHindi(title);
      if (transTitle !== title) {
        el.setAttribute('title', transTitle);
      }
    }
  });
}

function restoreDOMTree(root: Element | Document = document) {
  // 1. Restore text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (originalTextMap.has(node)) {
      node.nodeValue = originalTextMap.get(node) || '';
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

  // Synchronize across browser tabs and portals
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
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          translateDOMTree(document.body);
        }, 60);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
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
