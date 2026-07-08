import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ name: 'total_seats', type: 'int' })
  totalSeats: number;

  // available_seats is decremented atomically (under a row lock) by the
  // booking worker. It is the single source of truth for "seats left" —
  // we never recompute it by summing bookings on every read.
  @Column({ name: 'available_seats', type: 'int' })
  availableSeats: number;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents: number;

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];
}
