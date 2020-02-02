import { Observable, Subject } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { Translator } from './translator.service';
import { Injectable, OnDestroy } from '@angular/core';
import { OriginalModel } from './models/original.model';
import { TranslationModel } from './models/translation.model';
import { HttpErrorResponse } from '@angular/common/http';
import {
  findFirstBlockLevelAncestor,
  generateFingerprint,
  getPathsTo,
  hasSibling,
  isElementNode,
  isOrContainsBlockElement,
  isTextNode,
} from './dom-utils';
import { NodeCloneMap } from './node-clone.map';

@Injectable()
export class DomProcessor implements OnDestroy {
  constructor(private translator: Translator) {
  }

  private dom: Element;
  private observer: MutationObserver;
  private translate$$ = new Subject<OriginalModel>();

  get translate$(): Observable<OriginalModel> {
    return this.translate$$;
  }

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
    const sentences = gatherSentences(cloneAndWrapText(node) as Element);
    sentences.filter(it => !!it.innerHTML.trim()).forEach(sentence => {
      const entry = nodeCloneMap.findByCloned(sentence);
      if (!entry) {
        return;
      }
      const originalNode = entry.original as Element;
      const id = generateFingerprint(originalNode.innerHTML);
      entry.id = id;
      this.translate$$.next({
        id,
        pageUri: location.href,
        xpath: '/' + getPathsTo(originalNode).join('/'),
        original: sentence.innerHTML.trim(),
      });
    });
  }

  private applyResult(result: TranslationModel): void {
    const originalNode = nodeCloneMap.findById(result.id).original;
    const translationNode = document.createElement('div');
    translationNode.innerHTML = result.translation;
    mergeResultBack(originalNode, translationNode);
  }
}

const attrNameOfNodeIndex = '__ngwt-node-index';
const attrNameOfTextWrapper = '__text';

export const nodeCloneMap = new NodeCloneMap();

function hasAttached(node: Element): boolean {
  return !!nodeCloneMap.findByOriginal(node);
}

export function cloneAndWrapText(root: Element): Element {
  const result = root.cloneNode() as Element;
  if (isOrContainsBlockElement(root)) {
    nodeCloneMap.add(root, result);
  }
  for (let i = 0; i < root.childNodes.length; ++i) {
    const node = root.childNodes.item(i);
    if (isTextNode(node) && hasSibling(node) && !!node.nodeValue.trim()) {
      const wrapped = document.createElement('span');
      wrapped.setAttribute(attrNameOfTextWrapper, '');
      wrapped.setAttribute(attrNameOfNodeIndex, i.toString(10));
      wrapped.append(node.cloneNode(true));
      result.appendChild(wrapped);
    } else if (isElementNode(node)) {
      const clonedChild = cloneAndWrapText(node) as Element;
      clonedChild.setAttribute(attrNameOfNodeIndex, i.toString(10));
      result.appendChild(clonedChild);
    } else {
      result.appendChild(node.cloneNode(true));
    }
  }
  return result;
}

export function gatherSentences(dom: Element): Element[] {
  const result: Element[] = [];
  let node = dom.firstChild;
  let sentence = document.createElement('div');
  while (node) {
    const entry = nodeCloneMap.findByCloned(node);
    if (!entry || !isOrContainsBlockElement(entry.original)) {
      sentence.appendChild(node.cloneNode(true));
    } else {
      result.push(sentence);
      if (isElementNode(node)) {
        const subNodes = gatherSentences(node);
        result.push(...subNodes);
      }
      sentence = document.createElement('div');
    }
    node = node.nextSibling;
  }
  result.push(sentence);
  const originalNode = nodeCloneMap.findByCloned(dom).original;
  nodeCloneMap.add(originalNode, sentence);
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
