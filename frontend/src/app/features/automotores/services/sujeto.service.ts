import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sujeto, CreateSujetoRequest } from '../models/sujeto.model';

@Injectable({ providedIn: 'root' })
export class SujetoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'sujetos';

  getByCuit(cuit: string): Observable<Sujeto> {
    return this.http.get<Sujeto>(`${this.baseUrl}/by-cuit`, {
      params: { cuit },
    });
  }

  create(request: CreateSujetoRequest): Observable<Sujeto> {
    return this.http.post<Sujeto>(this.baseUrl, request);
  }
}
