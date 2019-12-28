import { Observable, of } from 'rxjs';
import { TranslateEngine } from './translate-engine.service';
import { Injectable } from '@angular/core';

@Injectable()
export class FakeTranslateEngine implements TranslateEngine {
  translateHtml(html: string): Observable<string> {
    return of(this.translateNow(html));
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
