import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll() {
    const events = await this.eventsService.findAll();
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      totalSeats: e.totalSeats,
      availableSeats: e.availableSeats,
      priceCents: e.priceCents,
    }));
  }
}
