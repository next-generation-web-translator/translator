import * as hash from 'object-hash';

const inlineStyles = ['inline', 'inline-block', 'inline-flex'];

export function isInlineStyle(display: string) {
  return inlineStyles.includes(display);
}

export function isBlockElement(node: Node): node is Element {
  if (!isElementNode(node)) {
    return false;
  }
  const display = getBlockType(node);
  return !isInlineStyle(display);
}

export function isInlineElement(node: Node): node is Element {
  if (!isElementNode(node)) {
    return false;
  }
  const display = getBlockType(node);
  return inlineStyles.includes(display);
}

export function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function hasSibling(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return false;
  }
  for (let i = 0; i < parent.childNodes.length; ++i) {
    const subNode = parent.childNodes.item(i);
    if (subNode !== node && (isTextNode(subNode) || isElementNode(subNode))) {
      return true;
    }
  }
  return false;
}

function indexInParent(node: Node): number {
  if (!node.parentNode) {
    return -1;
  }
  const siblings = node.parentNode.children;
  for (let i = 0; i < siblings.length; ++i) {
    if (siblings.item(i) === node) {
      return i;
    }
  }
  return -1;
}

export function getPathsTo(element: Element): string[] {
  if (element === document.body) {
    return [];
  }
  return [...getPathsTo(element.parentElement), element.tagName, indexInParent(element).toString(10)];
}

export function getBlockType(node: Element) {
  return getComputedStyle(node).display;
}

export function generateFingerprint(html: string) {
  return toUrlSafeBase64(hash(html, {
    encoding: 'base64',
    algorithm: 'sha1',
  }));
}

function toUrlSafeBase64(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function findFirstBlockLevelAncestor(node: Node): Element {
  if (!node) {
    return;
  } else if (isBlockElement(node)) {
    return node;
  } else {
    return findFirstBlockLevelAncestor(node.parentElement);
  }
}
