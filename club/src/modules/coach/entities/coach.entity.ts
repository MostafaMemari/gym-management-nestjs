import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { StudentEntity } from '../../student/entities/student.entity';

@Entity(EntityName.Coaches)
export class CoachEntity extends AbstractEntity {
  @Column({ type: 'integer', unique: true, nullable: false })
  user_id: Number;

  @Column({ type: 'varchar', length: 80 })
  full_name: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  father_name?: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  national_code: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  landline_number?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'date' })
  birth_date: Date;

  @Column({ type: 'date', nullable: true })
  sports_insurance_date?: Date;

  @Column({ type: 'date', nullable: true })
  expire_image_date?: Date;

  @OneToMany(() => StudentEntity, (student) => student.coach)
  student: StudentEntity[];
}
