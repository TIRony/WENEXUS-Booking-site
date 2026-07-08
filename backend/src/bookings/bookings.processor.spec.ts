import { BookingsProcessor } from './bookings.processor';
import { BookingStatus } from './entities/booking.entity';

function makeQueryBuilder(result: any) {
  return {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

describe('BookingsProcessor', () => {
  it('confirms the booking and decrements available seats when there is capacity', async () => {
    const booking: any = {
      id: 'b-1',
      status: BookingStatus.PENDING,
      seats: 2,
      eventId: 1,
    };
    const event: any = { id: 1, availableSeats: 5 };

    const manager = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(makeQueryBuilder(booking))
        .mockReturnValueOnce(makeQueryBuilder(event)),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      transaction: jest.fn((cb: any) => cb(manager)),
    } as any;

    const processor = new BookingsProcessor(dataSource);
    await processor.process({ data: { bookingId: 'b-1' } } as any);

    expect(event.availableSeats).toBe(3);
    expect(booking.status).toBe(BookingStatus.CONFIRMED);
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('marks the booking FAILED instead of overbooking when there are not enough seats', async () => {
    const booking: any = {
      id: 'b-2',
      status: BookingStatus.PENDING,
      seats: 10,
      eventId: 1,
    };
    const event: any = { id: 1, availableSeats: 3 };

    const manager = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(makeQueryBuilder(booking))
        .mockReturnValueOnce(makeQueryBuilder(event)),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const dataSource = {
      transaction: jest.fn((cb: any) => cb(manager)),
    } as any;

    const processor = new BookingsProcessor(dataSource);
    await processor.process({ data: { bookingId: 'b-2' } } as any);

    expect(event.availableSeats).toBe(3); // untouched
    expect(booking.status).toBe(BookingStatus.FAILED);
    expect(booking.failureReason).toMatch(/sold out/i);
  });

  it('is a no-op if the booking was already processed (safe job retry)', async () => {
    const booking: any = {
      id: 'b-3',
      status: BookingStatus.CONFIRMED,
      seats: 1,
      eventId: 1,
    };

    const manager = {
      createQueryBuilder: jest.fn().mockReturnValueOnce(makeQueryBuilder(booking)),
      save: jest.fn(),
    };

    const dataSource = {
      transaction: jest.fn((cb: any) => cb(manager)),
    } as any;

    const processor = new BookingsProcessor(dataSource);
    await processor.process({ data: { bookingId: 'b-3' } } as any);

    expect(manager.save).not.toHaveBeenCalled();
  });
});
