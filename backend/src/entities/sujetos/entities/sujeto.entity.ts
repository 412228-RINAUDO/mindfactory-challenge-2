import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { VinculoSujetoObjeto } from '../../vinculos/entities/vinculo-sujeto-objeto.entity.js';

@Entity('sujeto')
export class Sujeto {
  @PrimaryGeneratedColumn({ name: 'spo_id', type: 'bigint' })
  id: number;

  @Column({ name: 'spo_cuit', type: 'varchar', length: 11, unique: true })
  cuit: string;

  @Column({ name: 'spo_denominacion', type: 'varchar', length: 160 })
  denominacion: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VinculoSujetoObjeto, (vinculo: VinculoSujetoObjeto) => vinculo.sujeto)
  vinculos: VinculoSujetoObjeto[];
}
