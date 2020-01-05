import { Observable } from 'rxjs';
import { OriginalModel } from './models/original.model';
import { TranslationModel } from './models/translation.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Translator {
  constructor(protected http: HttpClient) {
  }

  query(original: OriginalModel): Observable<TranslationModel> {
    return this.http.get<TranslationModel>(`/api/pairs/${original.id}`);
  }

  create(original: OriginalModel): Observable<TranslationModel> {
    return this.http.post<TranslationModel>(`/api/pairs`, original);
  }
}
