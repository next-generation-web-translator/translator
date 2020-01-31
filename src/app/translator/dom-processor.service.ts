import { Subject } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';
import { OriginalModel } from './models/original.model';
import { TranslationModel } from './models/translation.model';
import { HttpErrorResponse } from '@angular/common/http';
import {
  findFirstBlockLevelAncestor,
  generateFingerprint,
  getBlockType,
  getPathsTo,
  hasSibling,
  isElementNode,
  isInlineStyle,
  isTextNode,
} from './dom-utils';

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
          .forEach((mutation) => mutation.addedNodes.forEach((node) => this.attach(findFirstBlockLevelAncestor(node))));
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
    if (hasAttached(node)) {
      return;
    }
    attachNodeIndexToData(node);
    const sentences = gatherSentences(cloneAndWrapText(node) as Element);
    sentences.filter(it => it.hasAttribute(attrNameOfMarker) && !!it.innerHTML.trim()).forEach(sentence => {
      this.translate$$.next({
        id: sentence.getAttribute(attrNameOfMarker),
        pageUri: location.href,
        xpath: getPathsTo(node).join('/'),
        original: sentence.innerHTML.trim(),
      });
    });
  }

  private applyResult(result: TranslationModel): void {
    const originalNode = sentenceMap[result.id];
    const translationNode = document.createElement('div');
    translationNode.innerHTML = result.translation;
    mergeResultBack(originalNode, translationNode);
  }

}

const attrNameOfNodeIndex = '__ngwt-node-index';
const attrNameOfNodeDisplay = '__ngwt-node-display';
const attrNameOfTextWrapper = '__text';
const attrNameOfMarker = '__ngwt-marker';
const dataNameOfOriginNode = '__ngwt-origin-node';

function hasAttached(node: Element) {
  return node[attrNameOfNodeIndex] !== undefined;
}

export function attachNodeIndexToData(root: Node): void {
  for (let i = 0; i < root.childNodes.length; ++i) {
    const node = root.childNodes.item(i);
    node[attrNameOfNodeIndex] = i;
    if (isElementNode(node)) {
      const display = getComputedStyle(node).display;
      node[attrNameOfNodeDisplay] = display;
      if (!isInlineStyle(display)) {
        const id = generateFingerprint(node.innerHTML);
        node[attrNameOfMarker] = id;
        sentenceMap[id] = node;
      }
    }
    attachNodeIndexToData(node);
  }
}

export function cloneAndWrapText(root: Element): Element {
  const result = root.cloneNode() as Element;
  result[dataNameOfOriginNode] = root;
  result[attrNameOfMarker] = root[attrNameOfMarker];
  for (let i = 0; i < root.childNodes.length; ++i) {
    const node = root.childNodes.item(i);
    if (isTextNode(node) && hasSibling(node)) {
      const wrapped = document.createElement('span');
      wrapped.setAttribute(attrNameOfTextWrapper, '');
      wrapped.setAttribute(attrNameOfNodeIndex, i.toString(10));
      wrapped.setAttribute(attrNameOfNodeDisplay, 'inline');
      wrapped.append(node.cloneNode(true));
      result.appendChild(wrapped);
    } else if (isElementNode(node)) {
      const clonedChild = cloneAndWrapText(node) as Element;
      clonedChild.setAttribute(attrNameOfNodeIndex, i.toString(10));
      clonedChild.setAttribute(attrNameOfNodeDisplay, getBlockType(node));
      result.appendChild(clonedChild);
    } else {
      result.appendChild(node.cloneNode(true));
    }
  }
  return result;
}

const sentenceMap: Record<string, Element> = {};

export function gatherSentences(dom: Element): Element[] {
  const result: Element[] = [];
  let node = dom.firstChild;
  let sentence = document.createElement('div');
  const parent = findFirstBlockLevelAncestor(dom);
  const id = parent[attrNameOfMarker];
  if (id) {
    sentence.setAttribute(attrNameOfMarker, id);
  }
  while (node) {
    if (!isElementNode(node) || ['inline', 'inline-flex', 'inline-block'].includes(node.getAttribute(attrNameOfNodeDisplay))) {
      sentence.appendChild(node.cloneNode(true));
    } else {
      result.push(sentence);
      const subNodes = gatherSentences(node);
      result.push(...subNodes);
      sentence = document.createElement('div');
    }
    node = node.nextSibling;
  }
  result.push(sentence);
  return result.filter(it => !!it.innerHTML.trim());
}

export function mergeResultBack(originalRoot: Node, translationRoot: Node): void {
  if (isTextNode(translationRoot)) {
    originalRoot.nodeValue = translationRoot.nodeValue;
  } else if (isElementNode(translationRoot)) {
    if (translationRoot.hasAttribute(attrNameOfTextWrapper)) {
      originalRoot.nodeValue = translationRoot.textContent;
    } else {
      for (let i = 0; i < translationRoot.childNodes.length; ++i) {
        const translationNode = translationRoot.childNodes.item(i);
        let index = i;
        if (isElementNode(translationNode)) {
          index = +translationNode.getAttribute(attrNameOfNodeIndex);
        }
        const originalNode = originalRoot.childNodes[index];
        if (originalNode) {
          mergeResultBack(originalNode, translationNode);
        }
      }
    }
  }
}
