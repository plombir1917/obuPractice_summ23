import { Account } from 'src/account/entities/account.entity';
import { Event } from 'src/events/entities/events.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  info: string;

  @OneToOne(() => Account, (account) => account.company, {
    cascade: true,
  })
  @JoinColumn()
  account: Account;

  @OneToMany(() => Event, (event) => event.company)
  event: Event[];
}
