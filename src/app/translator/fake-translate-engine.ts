import { Observable, of } from 'rxjs';
import { anchorAttrName } from './dom-processor.service';
import { TranslateEngine } from './translate-engine.service';
import { Injectable } from '@angular/core';

@Injectable()
export class FakeTranslateEngine implements TranslateEngine {
  translateHtml(html: string): Observable<string> {
    return of(this.translateNow(html));
  }

  private translateNow(html: string): string {
    if (html.startsWith('One')) {
      return `一<span ${anchorAttrName}="3">一</span>`;
    }

    if (html.startsWith('Two')) {
      return `二`;
    }

    if (html.startsWith('Three')) {
      return `三<span ${anchorAttrName}="6">三</span>`;
    }

    return html;
  }
}
