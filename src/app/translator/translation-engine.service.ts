import { Observable } from 'rxjs';
import { TranslationResult } from './models/translation-result';

export abstract class TranslationEngine {
  abstract translateHtml(id: string, html: string): Observable<TranslationResult>;
}
