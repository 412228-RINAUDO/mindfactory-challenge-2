import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Automotor } from '../../automotores/entities/automotor.entity';
import { VinculoSujetoObjeto } from '../../vinculos/entities/vinculo-sujeto-objeto.entity';

@Entity('objeto_de_valor')
export class ObjetoDeValor {
  @PrimaryGeneratedColumn({ name: 'ovp_id', type: 'bigint' })
  id: number;

  @Column({ name: 'ovp_tipo', type: 'varchar', length: 30, default: 'AUTOMOTOR' })
  tipo: string;

  @Column({ name: 'ovp_codigo', type: 'varchar', length: 64, unique: true })
  codigo: string;

  @Column({ name: 'ovp_descripcion', type: 'varchar', length: 240, nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Automotor, (automotor) => automotor.objetoDeValor)
  automotor: Automotor;

  @OneToMany(() => VinculoSujetoObjeto, (vinculo) => vinculo.objetoDeValor)
  vinculos: VinculoSujetoObjeto[];
}
