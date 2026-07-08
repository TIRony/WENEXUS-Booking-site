import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepo.find({ order: { date: 'ASC' } });
  }

  findOne(id: number): Promise<Event | null> {
    return this.eventsRepo.findOne({ where: { id } });
  }
}
