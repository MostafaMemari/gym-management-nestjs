import { Exclude } from 'class-transformer';
import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class AbstractEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  @Exclude()
  public created_at: Date;

  @UpdateDateColumn()
  @Exclude()
  public updated_at: Date;
}
