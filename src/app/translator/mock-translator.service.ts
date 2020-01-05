import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { TranslationModel } from './models/translation.model';
import { OriginalModel } from './models/original.model';

@Injectable()
export class MockTranslator {
  query(original: OriginalModel): Observable<TranslationModel> {
    return of({ id: original.id, confidence: 1, translation: this.translateHtml(original.original) });
  }

  create(original: OriginalModel): Observable<TranslationModel> {
    return of({ id: original.id, confidence: 1, translation: this.translateHtml(original.original) });
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
