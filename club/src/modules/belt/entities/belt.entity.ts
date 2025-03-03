import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BeltName } from '../enums/belt.enum';

@Entity()
export class BeltEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: BeltName })
  name: BeltName;

  @Column({ type: 'integer' })
  level: number;

  @Column({ type: 'integer', nullable: true })
  min_age?: number;

  @Column({ type: 'integer', nullable: true })
  max_age?: number;

  @Column({ type: 'integer', nullable: true, default: 0 })
  duration_month: number;
}
