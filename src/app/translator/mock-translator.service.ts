import { from, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { TranslationModel } from './models/translation.model';
import { Translator } from './translator.service';
import { OriginalModel } from './models/original.model';
import { map, toArray } from 'rxjs/operators';

@Injectable()
export class MockTranslator extends Translator {
  translate(entries: OriginalModel[]): Observable<TranslationModel[]> {
    return from(entries).pipe(
        map(({ id, original }) => ({ id, confidence: 1, translation: this.translateHtml(original) })),
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
