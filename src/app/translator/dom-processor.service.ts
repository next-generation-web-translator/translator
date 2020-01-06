import { Subject } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';
import { OriginalModel } from './models/original.model';
import { TranslationModel } from './models/translation.model';
import * as hash from 'object-hash';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class DomProcessor implements OnDestroy {
  constructor(private translator: Translator) {
  }

  private dom: Element;
  private observer: MutationObserver;
  private translate$$ = new Subject<OriginalModel>();

  setup(dom: Element = document.body): void {
    this.dom = dom;
    this.translate$$.pipe(
        mergeMap((original) => this.translator.query(original).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 404) {
                return this.translator.create(original);
              } else {
                throw error;
              }
            }),
            tap((result) => this.applyResult(result)),
        )),
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

    const elementToWrap = cloneAndWrapTextNodes(node, 0);

    const id = generateFingerprint(node, elementToWrap.innerHTML);
    node.setAttribute(attrNameOfMarker, id);

    this.translate$$.next({
      id,
      pageUri: location.href,
      xpath: getPathsTo(node).join('/'),
      original: elementToWrap.innerHTML.trim(),
    });
  }

  private applyResult(result: TranslationModel): void {
    const originalNode = this.findOriginalNode(result.id);
    const translationNode = document.createElement('div');
    translationNode.innerHTML = result.translation;
    this.mergeDom(originalNode, translationNode);
  }

  private findOriginalNode(resultId: string): Element {
    return this.dom.querySelector(`[${attrNameOfMarker}="${resultId}"]`);
  }

  private mergeDom(originalRoot: Node, translationRoot: Element): void {
    if (translationRoot.children.length === 0) {
      if (translationRoot.hasAttribute(attrNameOfTextWrapper)) {
        originalRoot.nodeValue = translationRoot.textContent;
      } else {
        originalRoot.textContent = translationRoot.textContent;
      }
      return;
    }
    for (let i = 0; i < translationRoot.children.length; ++i) {
      const translationNode = translationRoot.children.item(i);
      const index = +translationNode.getAttribute(attrNameOfNodeIndex).slice(1);
      const originalNode = findNodeByIndexData(originalRoot, index);
      this.mergeDom(originalNode, translationNode);
    }
  }
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isAttributeNode(node: Node): node is Attr {
  return node.nodeType === Node.ATTRIBUTE_NODE;
}

function isCommentNode(node: Node): node is Comment {
  return node.nodeType === Node.COMMENT_NODE;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function hasSibling(node: Node): boolean {
  const parent = node.parentElement;
  for (let i = 0; i < parent.childNodes.length; ++i) {
    const subNode = parent.childNodes.item(i);
    if (subNode !== node && (isTextNode(subNode) || isElementNode(subNode))) {
      return true;
    }
  }
  return false;
}

let currentId = 1;

function nextId(): string {
  currentId++;
  return '_' + currentId.toString(10);
}

const customTranslateAttributeName = '__ngwt-translate-me';
const attrNameOfNodeIndexData = '__ngwt-node-index';
const attrNameOfNodeIndex = '__index';
const attrNameOfTextWrapper = '__text';
const attrNameOfMarker = '__marker';

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

function generateFingerprint(node: Element, html: string) {
  return toUrlSafe(hash(`${location.href}\n${getPathsTo(node).join('/')}\n${html}`, {
    encoding: 'base64',
    algorithm: 'sha1',
  }));
}

function toUrlSafe(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function findNodeByIndexData(root: Node, index: number): Node {
  for (let i = 0; i < root.childNodes.length; ++i) {
    const subNode = root.childNodes.item(i);
    if (subNode[attrNameOfNodeIndexData] === index) {
      return subNode;
    }
  }
}

export function cloneAndWrapTextNodes(node: Element, index: number): Element {
  const result = document.createElement(node.tagName);
  result.setAttribute(attrNameOfNodeIndex, `_${index}`);
  for (let i = 0; i < node.childNodes.length; ++i) {
    const childNode = node.childNodes.item(i);
    childNode[attrNameOfNodeIndexData] = i;
    if (isTextNode(childNode) && hasSibling(childNode)) {
      const wrapped = document.createElement('span');
      wrapped.setAttribute(attrNameOfTextWrapper, '');
      wrapped.textContent = childNode.nodeValue;
      wrapped.setAttribute(attrNameOfNodeIndex, `_${i}`);
      result.appendChild(wrapped);
    } else if (isAttributeNode(childNode) || isCommentNode(childNode)) {
      // ignore it
    } else if (isElementNode(childNode)) {
      result.appendChild(cloneAndWrapTextNodes(childNode, i));
    } else {
      result.append(childNode);
    }
  }
  return result;
}
