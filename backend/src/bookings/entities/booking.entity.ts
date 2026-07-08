import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

@Entity('bookings')
@Index(['eventId'])
@Index(['status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Client-generated idempotency key. The unique index is what actually
  // guarantees "submit the same requestId twice -> only one booking exists",
  // even if two identical requests race each other at the database level.
  @Column({ name: 'request_id', unique: true })
  requestId: string;

  // Human-friendly reference returned to the client, e.g. BK-9F3KQJ2A.
  @Column({ name: 'booking_reference', unique: true })
  bookingReference: string;

  @ManyToOne(() => Event, (event) => event.bookings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_email' })
  customerEmail: string;

  @Column({ type: 'int' })
  seats: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ name: 'failure_reason', type: 'varchar', nullable: true })
  failureReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
