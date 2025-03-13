import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { BeltEntity } from '../../../modules/belt/entities/belt.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { StudentEntity } from './student.entity';

@Entity(EntityName.StudentBelts)
export class StudentBeltEntity extends AbstractEntity {
  @Column({ type: 'date', nullable: true })
  belt_date: Date;

  @Column({ type: 'date', nullable: true })
  next_belt_date: Date;

  @Column({ type: 'integer', nullable: true })
  studentId: number;

  @Column({ type: 'integer', nullable: true })
  beltId: number;

  @OneToOne(() => StudentEntity, (student) => student.beltInfo, { onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentEntity;

  @ManyToOne(() => BeltEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  belt: BeltEntity;
}
