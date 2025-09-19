import { ConnectionType } from "src/common/enums";
import { Column, CreateDateColumn, UpdateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import type { ConnectionConfig } from "src/integration/interfaces/connection-config.interface";


@Entity('external_connections')
export class ExternalConnection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;
    
    @Column()
    type: ConnectionType;

    @Column('jsonb')
    configuration: ConnectionConfig;

    @Column()
    isActive: boolean;

    @Column()
    lastTestedAt: Date;

    @Column('jsonb', { nullable: true })
    testResults: any;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.externalConnections, { eager: true })
    @JoinColumn({ name: 'createdBy', referencedColumnName: 'id' })
    createdBy: User;
}