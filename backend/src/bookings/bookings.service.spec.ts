import { NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';

function makeRepoMock(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    ...overrides,
  } as any;
}

describe('BookingsService', () => {
  const baseDto = {
    requestId: 'req-1',
    eventId: 1,
    customerName: 'Rahim Uddin',
    customerEmail: 'rahim@example.com',
    seats: 2,
  };

  it('returns the existing booking instead of creating a duplicate when requestId was already used', async () => {
    const existing: Partial<Booking> = {
      id: 'b-1',
      requestId: 'req-1',
      bookingReference: 'BK-EXIST01',
      eventId: 1,
      customerName: 'Rahim Uddin',
      customerEmail: 'rahim@example.com',
      seats: 2,
      status: BookingStatus.CONFIRMED,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bookingsRepo = makeRepoMock({ findOne: jest.fn().mockResolvedValue(existing) });
    const eventsRepo = makeRepoMock();
    const queue = { add: jest.fn() } as any;

    const service = new BookingsService(bookingsRepo, eventsRepo, queue);
    const result = await service.create(baseDto as any);

    expect(result.bookingReference).toBe('BK-EXIST01');
    expect(queue.add).not.toHaveBeenCalled();
    expect(eventsRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the event does not exist', async () => {
    const bookingsRepo = makeRepoMock({ findOne: jest.fn().mockResolvedValue(null) });
    const eventsRepo = makeRepoMock({ findOne: jest.fn().mockResolvedValue(null) });
    const queue = { add: jest.fn() } as any;

    const service = new BookingsService(bookingsRepo, eventsRepo, queue);

    await expect(service.create(baseDto as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('falls back to the existing row if a unique-constraint race occurs on insert', async () => {
    const dup: Partial<Booking> = {
      id: 'b-2',
      requestId: 'req-1',
      bookingReference: 'BK-RACE01',
      eventId: 1,
      customerName: 'Rahim Uddin',
      customerEmail: 'rahim@example.com',
      seats: 2,
      status: BookingStatus.PENDING,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bookingsRepo = makeRepoMock({
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockRejectedValue({ code: '23505' }),
      findOneOrFail: jest.fn().mockResolvedValue(dup),
    });
    const eventsRepo = makeRepoMock({
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Event', availableSeats: 10 }),
    });
    const queue = { add: jest.fn() } as any;

    const service = new BookingsService(bookingsRepo, eventsRepo, queue);
    const result = await service.create(baseDto as any);

    expect(result.bookingReference).toBe('BK-RACE01');
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('enqueues a processing job for a genuinely new booking', async () => {
    const bookingsRepo = makeRepoMock({
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((entity) => {
        entity.id = 'generated-id';
        return Promise.resolve(entity);
      }),
    });
    const eventsRepo = makeRepoMock({
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test Event', availableSeats: 10 }),
    });
    const queue = { add: jest.fn().mockResolvedValue(undefined) } as any;

    const service = new BookingsService(bookingsRepo, eventsRepo, queue);
    const result = await service.create(baseDto as any);

    expect(queue.add).toHaveBeenCalledWith(
      'process-booking',
      { bookingId: 'generated-id' },
      expect.any(Object),
    );
    expect(result.status).toBe(BookingStatus.PENDING);
  });
});
