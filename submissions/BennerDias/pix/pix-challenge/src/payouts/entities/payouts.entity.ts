import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tb_payouts' })
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  externalId: string;

  @Column()
  batch_id: string;

  @Column()
  userId: string;

  @Column('int')
  amountCents: number;

  @Column()
  pixKey: string;

  @Column({
    default: 'PENDING',
    type: 'enum',
    enum: ['PENDING', 'PAID', 'FAILED', 'DUPLICATE'],
  })
  status: 'PENDING' | 'PAID' | 'FAILED' | 'DUPLICATE';

  @CreateDateColumn()
  createdAt: Date;
}
