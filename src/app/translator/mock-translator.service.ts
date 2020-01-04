import { from, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Translation } from './models/translation';
import { TranslationType } from './models/translation-type';
import { Translator } from './translator.service';
import { Original } from './models/original';
import { map, toArray } from 'rxjs/operators';

@Injectable()
export class MockTranslator extends Translator {
  translate(entries: Original[]): Observable<Translation[]> {
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
