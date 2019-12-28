import { from, Subject } from 'rxjs';
import { bufferTime, switchMap, tap } from 'rxjs/operators';
import { TranslateEntry, TranslateResult, Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';

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
    if (this.observer) {
      this.observer.disconnect();
    }
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
    if (node[attrNameOfNodeIndex]) {
      return;
    }
    node[attrNameOfNodeIndex] = indexInParent(node);
    if (!this.shouldTranslate(node)) {
      return;
    }

    const id = nextId();
    node.setAttribute(attrNameOfMarker, id);

    const wrappedElement = node.cloneNode(true) as Element;
    this.wrapTextNodes(wrappedElement);
    this.addTranslationMarker(wrappedElement);

    this.translate$$.next({
      id,
      url: location.href,
      paths: getPathsTo(node),
      content: wrappedElement.innerHTML,
    });
  }

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
        wrapped.textContent = item.nodeValue;
        node.replaceChild(wrapped, item);
      } else if (isElementNode(item)) {
        this.wrapTextNodes(item as Element);
      }
    }
  }

  addTranslationMarker(root: Element): void {
    root.setAttribute(attrNameOfNodeIndex, `_${indexInParent(root)}`);
    for (let i = 0; i < root.children.length; ++i) {
      this.addTranslationMarker(root.children.item(i));
    }
  }

  private applyResult(result: TranslateResult): void {
    const originNode = this.dom.querySelector(`[${attrNameOfMarker}=${result.id}]`);
    const translationNode = document.createElement('div');
    translationNode.innerHTML = result.content;
    this.mergeDom(originNode, translationNode);
  }

  private mergeDom(originRoot: Node, translationRoot: Element): void {
    if (translationRoot.children.length === 0) {
      if (translationRoot.hasAttribute(attrNameOfWrapper)) {
        originRoot.nodeValue = translationRoot.textContent;
      } else {
        originRoot.textContent = translationRoot.textContent;
      }
      return;
    }
    for (let i = 0; i < translationRoot.children.length; ++i) {
      const translationNode = translationRoot.children.item(i);
      const index = +translationNode.getAttribute(attrNameOfNodeIndex).slice(1);
      const originNode = originRoot.childNodes[index];
      this.mergeDom(originNode, translationNode);
    }
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
  return '_' + currentId.toString(10);
}

const customTranslateAttributeName = 'ngwt-translate-me';
const attrNameOfNodeIndex = '__ngwt-node-index';
const attrNameOfWrapper = '__ngwt-node-wrapper';
const attrNameOfMarker = '__ngwt-node-marker';

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
}

function getPathsTo(element: Element): string[] {
  if (element === document.body) {
    return [];
  }
  return [...getPathsTo(element.parentElement), element.tagName, indexInParent(element).toString(10)];
}
