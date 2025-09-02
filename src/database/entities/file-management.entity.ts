import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileManagementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string; // S3 object key

  @Column()
  url: string; // S3 public URL

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
