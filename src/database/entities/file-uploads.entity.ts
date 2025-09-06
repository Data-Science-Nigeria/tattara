import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileUploads {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  submissionId: string;

  @Column('uuid')
  aiProcessingLodId: string;

  @Column()
  originalFilename: string;

  @Column()
  fileType: string;

  @Column()
  mimetype: string;

  @Column()
  fileSize: number;

  @Column()
  key: string; // S3 object key

  @Column()
  storagePath: string; // S3 public URL

  @Column()
  storageProvider: string;

  @Column()
  checksum: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isProcessed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // @ManyToOne(() => User, (user) => user.fileUploads)
  // @JoinColumn({ name: 'userId' })
  // user: User;
}
