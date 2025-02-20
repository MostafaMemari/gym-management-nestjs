import { EntityName } from '../common/enums/entity.enum';
import { Gender } from '../common/enums/gender.enum';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateStudentsTable1739978912710 implements MigrationInterface {
  name = 'CreateStudentsTable1739978912710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: EntityName.Students,
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'full_name', type: 'varchar', length: '80', isNullable: false },
          { name: 'gender', type: 'enum', enumName: 'gender_enum', enum: [Gender.Male, Gender.Female], isNullable: false },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'image_url', type: 'varchar', isNullable: true },
          { name: 'father_name', type: 'varchar', length: '80', isNullable: true },
          { name: 'national_code', type: 'varchar', length: '10', isUnique: true, isNullable: false },
          { name: 'phone_number', type: 'varchar', length: '15', isNullable: true },
          { name: 'landline_number', type: 'varchar', length: '12', isNullable: true },
          { name: 'address', type: 'varchar', length: '200', isNullable: true },
          { name: 'birth_date', type: 'date', isNullable: false },
          { name: 'sports_insurance_date', type: 'date', isNullable: true },
          { name: 'expire_image_date', type: 'date', isNullable: true },
          { name: 'user_id', type: 'int', isUnique: true, isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
    ),
      true;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(EntityName.Students);
  }
}
