import { Observable } from 'rxjs';
import { TranslationEntry } from './models/translation-entry';
import { TranslationResult } from './models/translation-result';

export abstract class Translator {
  abstract translate(entries: TranslationEntry[]): Observable<TranslationResult[]>;
}
