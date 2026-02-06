import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AutomotorListItem,
  AutomotorDetail,
  CreateAutomotorRequest,
  UpdateAutomotorRequest,
} from '../models/automotor.model';

@Injectable({ providedIn: 'root' })
export class AutomotorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'automotores';

  getAll(): Observable<AutomotorListItem[]> {
    return this.http.get<AutomotorListItem[]>(this.baseUrl);
  }

  getByDominio(dominio: string): Observable<AutomotorDetail> {
    return this.http.get<AutomotorDetail>(`${this.baseUrl}/${dominio}`);
  }

  create(request: CreateAutomotorRequest): Observable<AutomotorDetail> {
    return this.http.post<AutomotorDetail>(this.baseUrl, request);
  }

  update(
    dominio: string,
    request: UpdateAutomotorRequest,
  ): Observable<AutomotorDetail> {
    return this.http.put<AutomotorDetail>(
      `${this.baseUrl}/${dominio}`,
      request,
    );
  }

  delete(dominio: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${dominio}`);
  }
}
