import { from, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { TranslationResult } from './models/translation-result';
import { TranslationType } from './models/translation.type';
import { Translator } from './translator.service';
import { TranslationEntry } from './models/translation-entry';
import { map, toArray } from 'rxjs/operators';

@Injectable()
export class MockTranslator extends Translator {
  translate(entries: TranslationEntry[]): Observable<TranslationResult[]> {
    return from(entries).pipe(
        map(({ id, content }) => ({ id, type: TranslationType.mock, content: this.translateHtml(content) })),
        toArray(),
    );
  }

  private translateHtml(html: string): string {
    const dom = document.createElement('div');
    dom.innerHTML = html;
    this.translateDom(dom);
    return dom.innerHTML;
  }

  private translateDom(dom: Element): void {
    if (dom.children.length === 0) {
      dom.textContent = '中' + dom.textContent;
    } else {
      for (let i = 0; i < dom.children.length; ++i) {
        this.translateDom(dom.children.item(i));
      }
    }
  }
}
