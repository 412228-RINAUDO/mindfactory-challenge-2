import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjetoDeValor } from '../../objetos-valor/entities/objeto-valor.entity';
import { Sujeto } from '../../sujetos/entities/sujeto.entity';

@Entity('Vinculo_Sujeto_Objeto')
@Index('idx_vso_ovp', ['ovpId'])
@Index('idx_vso_spo', ['spoId'])
export class VinculoSujetoObjeto {
  @PrimaryGeneratedColumn({ name: 'vso_id', type: 'bigint' })
  id: number;

  @Column({ name: 'vso_ovp_id', type: 'bigint' })
  ovpId: number;

  @Column({ name: 'vso_spo_id', type: 'bigint' })
  spoId: number;

  @Column({ name: 'vso_tipo_vinculo', type: 'varchar', length: 30, default: 'DUENO' })
  tipoVinculo: string;

  @Column({ name: 'vso_porcentaje', type: 'numeric', precision: 5, scale: 2, default: 100 })
  porcentaje: number;

  @Column({ name: 'vso_responsable', type: 'char', length: 1, default: 'S' })
  responsable: string;

  @Column({ name: 'vso_fecha_inicio', type: 'date', default: () => 'CURRENT_DATE' })
  fechaInicio: Date;

  @Column({ name: 'vso_fecha_fin', type: 'date', nullable: true })
  fechaFin: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ObjetoDeValor, (objetoDeValor) => objetoDeValor.vinculos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vso_ovp_id' })
  objetoDeValor: ObjetoDeValor;

  @ManyToOne(() => Sujeto, (sujeto) => sujeto.vinculos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'vso_spo_id' })
  sujeto: Sujeto;
}
