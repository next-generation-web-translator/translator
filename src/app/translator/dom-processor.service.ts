import { from, Subject } from 'rxjs';
import { bufferTime, switchMap, tap } from 'rxjs/operators';
import { Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';
import { TranslationEntry } from './models/translation-entry';
import { TranslationResult } from './models/translation-result';

@Injectable()
export class DomProcessor implements OnDestroy {
  constructor(private translator: Translator) {
  }

  private dom: Element;
  private observer: MutationObserver;
  private translate$$ = new Subject<TranslationEntry>();

  setup(dom: Element = document.body): void {
    this.dom = dom;
    this.translate$$.pipe(
        bufferTime(100, undefined, 50),
        switchMap((entries) => this.translator.translate(entries)),
        switchMap(results => from(results)),
        tap(result => this.applyResult(result)),
    ).subscribe();

    this.observer = new MutationObserver((mutationsList: MutationRecord[]) => {
      mutationsList.filter(it => it.type === 'childList')
          .forEach((mutation) => mutation.addedNodes.forEach((node) => this.attach(node)));
    });
    this.observer.observe(dom, { attributes: true, childList: true, subtree: true });
    dom.querySelectorAll(`h1,h2,h3,h4,h5,h6,p,t,[${customTranslateAttributeName}]`)
        .forEach(element => this.attach(element));
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.translate$$.complete();
  }

  shouldTranslate(node: Node): node is Element {
    if (!isElementNode(node)) {
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

  attach(node: Node): void {
    if (!this.shouldTranslate(node)) {
      return;
    }

    if (node.hasAttribute(attrNameOfMarker)) {
      return;
    }

    const id = nextId();
    node.setAttribute(attrNameOfMarker, id);

    const elementToWrap = node.cloneNode(true) as Element;
    this.wrapTextNodes(elementToWrap);
    this.addNodeIndex(elementToWrap);

    this.translate$$.next({
      id,
      url: location.href,
      paths: getPathsTo(node),
      content: elementToWrap.innerHTML,
    });
  }

  wrapTextNodes(node: Element): void {
    if (!isCompoundNode(node)) {
      return;
    }
    for (let i = 0; i < node.childNodes.length; ++i) {
      const childNode = node.childNodes.item(i);
      if (isTextNode(childNode)) {
        const wrapped = document.createElement('span');
        wrapped.setAttribute(attrNameOfWrapper, '');
        wrapped.textContent = childNode.nodeValue;
        node.replaceChild(wrapped, childNode);
      } else if (isElementNode(childNode)) {
        this.wrapTextNodes(childNode as Element);
      }
    }
  }

  addNodeIndex(root: Element): void {
    root.setAttribute(attrNameOfNodeIndex, `_${indexInParent(root)}`);
    for (let i = 0; i < root.children.length; ++i) {
      this.addNodeIndex(root.children.item(i));
    }
  }

  private applyResult(result: TranslationResult): void {
    const originNode = this.findOriginNode(result.id);
    const translationNode = document.createElement('div');
    translationNode.innerHTML = result.content;
    this.mergeDom(originNode, translationNode);
  }

  private findOriginNode(resultId: string): Element {
    return this.dom.querySelector(`[${attrNameOfMarker}=${resultId}]`);
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

function isCompoundNode(node: Element) {
  return node.childNodes.length > 1;
}

let currentId = 1;

function nextId(): string {
  currentId++;
  return '_' + currentId.toString(10);
}

const customTranslateAttributeName = '__ngwt-translate-me';
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
  return -1;
}

function getPathsTo(element: Element): string[] {
  if (element === document.body) {
    return [];
  }
  return [...getPathsTo(element.parentElement), element.tagName, indexInParent(element).toString(10)];
}
