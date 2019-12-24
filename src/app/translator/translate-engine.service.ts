import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class TranslateEngine {

  constructor() {
  }

  translateHtml(html: string): Observable<string> {
    return of(html);
  }
}
