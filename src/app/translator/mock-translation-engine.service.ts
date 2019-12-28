import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { TranslationEngine } from './translation-engine.service';
import { TranslationResult } from './models/translation-result';
import { TranslationType } from './models/translation.type';

@Injectable()
export class MockTranslationEngine implements TranslationEngine {
  translateHtml(id: string, html: string): Observable<TranslationResult> {
    return of({ id, type: TranslationType.mock, content: this.translateNow(html) });
  }

  private translateNow(html: string): string {
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
