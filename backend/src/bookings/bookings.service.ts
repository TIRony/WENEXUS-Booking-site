import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { customAlphabet } from 'nanoid';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { Booking, BookingStatus } from './entities/booking.entity';

const referenceId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export interface BookingResponse {
  id: string;
  requestId: string;
  bookingReference: string;
  eventId: number;
  eventName?: string;
  customerName: string;
  customerEmail: string;
  seats: number;
  status: BookingStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectQueue('bookings')
    private readonly bookingsQueue: Queue,
  ) {}

  /**
   * Creates a booking and returns immediately (the actual seat check /
   * deduction happens asynchronously in the queue worker).
   *
   * Idempotency: `requestId` has a unique DB constraint. We check for an
   * existing row first (fast path), but the real guarantee is the unique
   * index: if two identical requests race each other, the DB rejects the
   * second insert with a 23505 error, which we catch and turn into "return
   * the existing booking" instead of creating a duplicate.
   */
  async create(dto: CreateBookingDto): Promise<BookingResponse> {
    const existing = await this.bookingsRepo.findOne({
      where: { requestId: dto.requestId },
    });
    if (existing) {
      return this.toResponse(existing);
    }

    const event = await this.eventsRepo.findOne({ where: { id: dto.eventId } });
    if (!event) {
      throw new NotFoundException(`Event ${dto.eventId} does not exist`);
    }

    const booking = this.bookingsRepo.create({
      requestId: dto.requestId,
      bookingReference: `BK-${referenceId()}`,
      eventId: dto.eventId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      seats: dto.seats,
      status: BookingStatus.PENDING,
    });

    try {
      await this.bookingsRepo.save(booking);
    } catch (err: any) {
      // Unique violation on request_id: another concurrent request for the
      // same requestId won the race and inserted first. Return that one.
      if (err?.code === '23505') {
        const dup = await this.bookingsRepo.findOneOrFail({
          where: { requestId: dto.requestId },
        });
        return this.toResponse(dup);
      }
      throw err;
    }

    await this.bookingsQueue.add(
      'process-booking',
      { bookingId: booking.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return this.toResponse(booking, event.name);
  }

  async findAll(query: QueryBookingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.bookingsRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.eventId) {
      qb.andWhere('booking.eventId = :eventId', { eventId: query.eventId });
    }
    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((b) => this.toResponse(b, b.event?.name)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private toResponse(booking: Booking, eventName?: string): BookingResponse {
    return {
      id: booking.id,
      requestId: booking.requestId,
      bookingReference: booking.bookingReference,
      eventId: booking.eventId,
      eventName,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      seats: booking.seats,
      status: booking.status,
      failureReason: booking.failureReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
