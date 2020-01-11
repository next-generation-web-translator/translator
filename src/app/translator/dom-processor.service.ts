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
          .forEach((mutation) => mutation.addedNodes.forEach((node) => this.attach(findSentenceLevelAncestor(node))));
    });
    this.observer.observe(dom, { attributes: true, childList: true, subtree: true });
    this.attach(dom);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.translate$$.complete();
  }

  attach(node: Element): void {
    const sentences = this.findSentences(node);
    sentences.forEach(sentence => {
      this.translate$$.next({
        id: sentence[attrNameOfMarker],
        pageUri: location.href,
        xpath: getPathsTo(node).join('/'),
        original: sentence.innerHTML.trim(),
      });
    });
  }

  findSentences(dom: Element): Element[] {
    const result: Element[] = [];
    let segment = document.createElement(dom.tagName);
    for (let i = 0; i < dom.childNodes.length; ++i) {
      const node = dom.childNodes.item(i);
      node[attrNameOfNodeIndexData] = i;
      const clonedNode = node.cloneNode(true);
      if (isTextNode(clonedNode) && hasSibling(clonedNode)) {
        const wrapped = document.createElement('span');
        wrapped.setAttribute(attrNameOfTextWrapper, '');
        wrapped.setAttribute(attrNameOfNodeIndex, `_${i}`);
        wrapped.append(clonedNode);
        segment.appendChild(wrapped);
      } else if (isElementNode(node)) {
        if (isInlineElement(node)) {
          (clonedNode as Element).setAttribute(attrNameOfNodeIndex, `_${i}`);
          segment.append(clonedNode);
        } else {
          result.push(...this.findSentences(node));
          const id = generateFingerprint(segment.innerHTML.trim());
          segment.setAttribute(attrNameOfMarker, id);
          if (segment.innerHTML.trim()) {
            result.push(segment);
          }
          segment = document.createElement(node.tagName);
        }
      } else if (!isAttributeNode(clonedNode) && !isCommentNode(clonedNode)) {
        segment.appendChild(clonedNode);
      }
    }
    if (segment.firstChild && segment.innerHTML.trim()) {
      result.push(segment);
    }
    return result;
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

function isInlineElement(node: Element): boolean {
  const display = getComputedStyle(node).display;
  return display === 'inline' || display === 'inline-block' || display === 'inline-flex';

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

function generateFingerprint(html: string) {
  return toUrlSafe(hash(html, {
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

function findSentenceLevelAncestor(node: Node): Element {
  // TODO: 处理纯文本节点
  if (!node.parentNode) {
    return node as Element;
  }
  if (isElementNode(node) && !isInlineElement(node)) {
    return node;
  }
  return findSentenceLevelAncestor(node.parentNode);
}
