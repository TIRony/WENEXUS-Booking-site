import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Booking, BookingStatus } from './entities/booking.entity';

interface ProcessBookingJob {
  bookingId: string;
}

@Processor('bookings')
export class BookingsProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingsProcessor.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  /**
   * This is where overbooking is actually prevented.
   *
   * We open a single DB transaction per job and SELECT ... FOR UPDATE the
   * event row (`pessimistic_write`). Postgres row locks mean that if 50
   * bookings for the same event are being processed concurrently by
   * multiple workers, only one of them can hold the lock on that event row
   * at a time — every other worker blocks until it commits or rolls back.
   * That serializes "read available_seats -> check -> decrement" for a
   * given event, so there is no window where two workers can both read
   * "5 seats left" and both confirm, driving seats negative.
   *
   * The booking row is also locked and re-checked for PENDING status, so if
   * a job is retried (e.g. after a crash) after it already succeeded, it's
   * a safe no-op rather than double-deducting seats.
   */
  async process(job: Job<ProcessBookingJob>): Promise<void> {
    const { bookingId } = job.data;

    await this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .createQueryBuilder(Booking, 'booking')
        .setLock('pessimistic_write')
        .where('booking.id = :id', { id: bookingId })
        .getOne();

      if (!booking) {
        this.logger.warn(`Booking ${bookingId} not found, skipping`);
        return;
      }

      if (booking.status !== BookingStatus.PENDING) {
        // Already processed (e.g. a retried job) - nothing to do.
        return;
      }

      const event = await manager
        .createQueryBuilder(Event, 'event')
        .setLock('pessimistic_write')
        .where('event.id = :id', { id: booking.eventId })
        .getOne();

      if (!event) {
        booking.status = BookingStatus.FAILED;
        booking.failureReason = 'Event not found';
        await manager.save(booking);
        return;
      }

      if (event.availableSeats < booking.seats) {
        booking.status = BookingStatus.FAILED;
        booking.failureReason = 'Sold out: not enough seats available';
        await manager.save(booking);
        return;
      }

      event.availableSeats -= booking.seats;
      booking.status = BookingStatus.CONFIRMED;
      booking.failureReason = null;

      await manager.save(event);
      await manager.save(booking);
    });
  }
}
