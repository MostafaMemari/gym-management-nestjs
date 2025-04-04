import { Exclude } from 'class-transformer';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;
}

export abstract class TimestampedEntity extends BaseEntity {
  @CreateDateColumn({ type: 'timestamp' })
  @Exclude()
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude()
  public updated_at: Date;
}

export abstract class AbstractEntity extends TimestampedEntity {}
