import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { ObjetoDeValor } from '../../objetos-valor/entities/objeto-valor.entity.js';

@Entity('automotores')
@Check('chk_atr_fecha_fabricacion', '"atr_fecha_fabricacion" BETWEEN 190001 AND 299912')
export class Automotor {
  @PrimaryGeneratedColumn({ name: 'atr_id', type: 'bigint' })
  id: number;

  @Column({ name: 'atr_ovp_id', type: 'bigint' })
  @Index('idx_automotores_ovp')
  ovpId: number;

  @Column({ name: 'atr_dominio', type: 'varchar', length: 8, unique: true })
  dominio: string;

  @Column({ name: 'atr_numero_chasis', type: 'varchar', length: 25, nullable: true })
  numeroChasis: string | null;

  @Column({ name: 'atr_numero_motor', type: 'varchar', length: 25, nullable: true })
  numeroMotor: string | null;

  @Column({ name: 'atr_color', type: 'varchar', length: 40, nullable: true })
  color: string | null;

  @Column({ name: 'atr_fecha_fabricacion', type: 'int' })
  fechaFabricacion: number;

  @CreateDateColumn({ name: 'atr_fecha_alta_registro', type: 'timestamptz' })
  fechaAltaRegistro: Date;

  @OneToOne(() => ObjetoDeValor, (objetoDeValor) => objetoDeValor.automotor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'atr_ovp_id' })
  objetoDeValor: ObjetoDeValor;
}
