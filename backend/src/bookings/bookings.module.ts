import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { BookingsController } from './bookings.controller';
import { BookingsProcessor } from './bookings.processor';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Event]),
    BullModule.registerQueue({ name: 'bookings' }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsProcessor],
})
export class BookingsModule {}
