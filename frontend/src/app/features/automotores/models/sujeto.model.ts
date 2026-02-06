export interface Sujeto {
  readonly id: number;
  readonly cuit: string;
  readonly denominacion: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateSujetoRequest {
  readonly cuit: string;
  readonly denominacion: string;
}
