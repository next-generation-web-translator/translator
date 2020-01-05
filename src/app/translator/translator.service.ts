import { Observable } from 'rxjs';
import { OriginalModel } from './models/original.model';
import { TranslationModel } from './models/translation.model';

export abstract class Translator {
  abstract translate(entries: OriginalModel[]): Observable<TranslationModel[]>;
}
