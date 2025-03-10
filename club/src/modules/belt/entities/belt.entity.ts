import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BeltName } from '../enums/belt-name.enum';
import { AbstractEntity } from 'src/common/abstracts/abstract.entity';
import { EntityName } from 'src/common/enums/entity.enum';

@Entity(EntityName.BELTS)
export class BeltEntity extends AbstractEntity {
  @Column({ type: 'enum', enum: BeltName, unique: true })
  name: BeltName;

  @Column({ type: 'integer' })
  level: number;

  @Column({ type: 'integer', nullable: true })
  min_age?: number;

  @Column({ type: 'integer', nullable: true })
  max_age?: number;

  @Column({ type: 'integer', nullable: true, default: 0 })
  duration_month: number;

  @ManyToMany(() => BeltEntity)
  @JoinTable({
    name: 'belt_next_relation',
    joinColumn: { name: 'belt_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'next_belt_id', referencedColumnName: 'id' },
  })
  nextBelt: BeltEntity[];
}
