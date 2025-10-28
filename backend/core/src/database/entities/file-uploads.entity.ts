import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '.';

@Entity('files')
export class FileUploads {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  submissionId: string;

  @Column('uuid', { nullable: true })
  aiProcessingLogId: string;

  @Column()
  originalFilename: string;

  @Column({ nullable: true })
  fileType: string;

  @Column({ nullable: true })
  mimetype: string;

  @Column()
  fileSize: number;

  @Column({ nullable: true })
  key: string; // S3 object key

  @Column({ nullable: true })
  storagePath: string; // S3 public URL

  @Column({ nullable: true })
  storageProvider: string;

  @Column({ nullable: true })
  checksum: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // TODO: remove user relation; createdBy does the same job;
  // TODO: but make sure to change all references
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  createdBy: User;
}
