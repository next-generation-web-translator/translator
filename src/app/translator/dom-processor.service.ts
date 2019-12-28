import { from, Subject } from 'rxjs';
import { bufferTime, switchMap, tap } from 'rxjs/operators';
import { TranslateEntry, TranslateResult, Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';

function indexInParent(node: Node): number {
  const siblings = node.parentNode.children;
  for (let i = 0; i < siblings.length; ++i) {
    if (siblings.item(i) === node) {
      return i;
    }
  }
}

@Injectable()
export class DomProcessor implements OnDestroy {
  constructor(private translator: Translator) {
  }

  private dom: Element;
  private observer: MutationObserver;
  private translate$$ = new Subject<TranslateEntry>();

  setup(dom: Element = document.body): void {
    this.dom = dom;
    this.observeSubtree(dom);
    this.translate$$.pipe(
        bufferTime(100),
        switchMap((entries) => this.translator.translate(entries)),
        switchMap(results => from(results)),
        tap(result => this.applyResult(result)),
    ).subscribe();
    const targetNodes = dom.querySelectorAll(`h1,h2,h3,h4,h5,h6,p,t,[${customTranslateAttributeName}]`);
    targetNodes.forEach(element => this.process(element));
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
    this.translate$$.complete();
  }

  observeSubtree(element: Element): void {
    this.observer = new MutationObserver((mutationsList: MutationRecord[]) => {
      mutationsList.filter(it => it.type === 'childList')
          .forEach((mutation) => mutation.addedNodes.forEach((node) => this.process(node)));
    });

    this.observer.observe(element, {attributes: true, childList: true, subtree: true});
  }

  shouldTranslate(node: Node): node is Element {
    if (!(node instanceof Element)) {
      return false;
    }
    if (node instanceof HTMLParagraphElement) {
      return true;
    }
    if (node instanceof HTMLHeadingElement) {
      return true;
    }

    return node.tagName === 'T' || node.hasAttribute(customTranslateAttributeName);
  }

  process(node: Node): void {
    if (node[attrNameOfNodeId]) {
      return;
    }
    node[attrNameOfNodeId] = indexInParent(node);
    if (!this.shouldTranslate(node)) {
      return;
    }
    const wrappedElement = node.cloneNode(true) as Element;
    this.wrapTextNodes(wrappedElement);

    this.translate$$.next({
      id: nextId(),
      url: location.href,
      paths: getPathsTo(node),
      content: wrappedElement.innerHTML,
    });
  }

  // 为子元素添加一些唯一性标记，以便翻译时定位
  wrapTextNodes(node: Element): void {
    const childrenCount = node.childNodes.length;
    if (childrenCount <= 1) {
      return;
    }
    for (let i = 0; i < childrenCount; ++i) {
      const item = node.childNodes.item(i);
      if (isTextNode(item)) {
        const wrapped = document.createElement('span');
        wrapped.setAttribute(attrNameOfWrapper, '');
        wrapped.setAttribute(attrNameOfNodeId, i.toString(10));
        wrapped.textContent = item.nodeValue;
        node.replaceChild(wrapped, item);
      } else if (isElementNode(item)) {
        item.setAttribute(attrNameOfNodeId, i.toString(10));
        this.wrapTextNodes(item as Element);
      }
    }
  }

  private applyResult(result: TranslateResult) {
    return this.dom.querySelector(`[${attrNameOfNodeId}=${result.id}]`).innerHTML = result.content;
  }
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

let currentId = 1;

function nextId(): string {
  currentId++;
  return '_' + currentId.toString(16);
}

const customTranslateAttributeName = 'ngwt-translate-me';
const attrNameOfNodeId = '__ngwt-node-id';
const attrNameOfWrapper = '__ngwt-node-wrapper';
export const anchorAttrName = '__ngwt-anchor-id';

function elementIndexOf(element: Element): number {
  const parent = element.parentElement;
  for (let i = 0; i < parent.children.length; ++i) {
    if (parent.children.item(i) === element) {
      return i;
    }
  }
  throw new Error('Should never run here!');
}

function getPathsTo(element: Element): string[] {
  if (element === document.body) {
    return [];
  }
  return [...getPathsTo(element.parentElement), element.tagName, elementIndexOf(element).toString(10)];
}
