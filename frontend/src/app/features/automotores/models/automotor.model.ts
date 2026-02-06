export interface AutomotorListItem {
  readonly dominio: string;
  readonly fechaFabricacion: number;
  readonly cuit: string | null;
  readonly dueno: string | null;
}

export interface DuenoDetail {
  readonly id: number;
  readonly cuit: string;
  readonly denominacion: string;
  readonly porcentaje: number;
}

export interface AutomotorDetail {
  readonly id: number;
  readonly dominio: string;
  readonly numeroChasis: string | null;
  readonly numeroMotor: string | null;
  readonly color: string | null;
  readonly fechaFabricacion: number;
  readonly fechaAltaRegistro: string;
  readonly duenoActual: DuenoDetail | null;
}

export interface CreateAutomotorRequest {
  readonly dominio: string;
  readonly numeroChasis?: string;
  readonly numeroMotor?: string;
  readonly color?: string;
  readonly fechaFabricacion: number;
  readonly cuitDueno: string;
}

export interface UpdateAutomotorRequest {
  readonly numeroChasis?: string;
  readonly numeroMotor?: string;
  readonly color?: string;
  readonly fechaFabricacion?: number;
  readonly cuitDueno?: string;
}
