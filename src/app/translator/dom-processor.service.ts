import { from, Subject } from 'rxjs';
import { bufferTime, switchMap, tap } from 'rxjs/operators';
import { TranslateEntry, TranslateResult, Translator } from './translator.service';
import { Injectable } from '@angular/core';

@Injectable()
export class DomProcessor {
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
    targetNodes.forEach(element => this.attach(element));
  }

  destroy(): void {
    this.observer.disconnect();
    this.translate$$.complete();
  }

  observeSubtree(element: Element): void {
    this.observer = new MutationObserver((mutationsList: MutationRecord[]) => {
      mutationsList.filter(it => it.type === 'childList')
          .forEach((mutation) => mutation.addedNodes.forEach((node) => this.attach(node)));
    });

    this.observer.observe(element, {attributes: true, childList: true, subtree: true});
  }

  shouldAttach(node: Node): node is Element {
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

  attach(node: Node): void {
    if (!this.shouldAttach(node)) {
      return;
    }
    if (node.hasAttribute(originAttrName)) {
      return;
    }
    const id = nextId();
    node.setAttribute(originAttrName, id);
    this.addTranslationAnchors(node);
    const content = node.innerHTML;
    this.translate$$.next({id, url: location.href, paths: getPathsTo(node), content});
  }

  // 为子元素添加一些唯一性标记，以便翻译时定位
  addTranslationAnchors(element: Element): void {
    for (let i = 0; i < element.children.length; ++i) {
      const item = element.children.item(i);
      item.setAttribute(anchorAttrName, nextId());
      this.addTranslationAnchors(item);
    }
  }

  private applyResult(result: TranslateResult) {
    return this.dom.querySelector(`[${originAttrName}=${result.id}]`).innerHTML = result.content;
  }
}

let currentId = 1;

function nextId(): string {
  currentId++;
  return '_' + currentId.toString(16);
}

const customTranslateAttributeName = 'ngwt-translate-me';
const originAttrName = '__ngwt-origin-id';
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
