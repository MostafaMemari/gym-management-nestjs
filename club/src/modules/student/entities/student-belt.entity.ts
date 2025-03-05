import { AbstractEntity } from 'src/common/abstracts/abstract.entity';
import { EntityName } from 'src/common/enums/entity.enum';
import { BeltEntity } from 'src/modules/belt/entities/belt.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { StudentEntity } from './student.entity';

@Entity(EntityName.StudentBelts)
export class StudentBeltEntity extends AbstractEntity {
  @OneToOne(() => StudentEntity, (student) => student.beltInfo, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentEntity;

  @ManyToOne(() => BeltEntity, { nullable: false, onDelete: 'SET NULL' })
  @JoinColumn()
  belt: BeltEntity;

  @Column({ type: 'date', nullable: true })
  belt_date: Date;

  @Column({ type: 'date', nullable: true })
  next_belt_date: Date;

  @ManyToOne(() => BeltEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  next_belt: BeltEntity;
}
