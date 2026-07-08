import 'dotenv/config';
import dataSource from '../config/typeorm.config';
import { Event } from '../events/entities/event.entity';

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Event);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`Events table already has ${existingCount} row(s), skipping seed.`);
    await dataSource.destroy();
    return;
  }

  const events = repo.create([
    {
      name: 'Dhaka Tech Summit 2026',
      date: new Date('2026-09-15T10:00:00Z'),
      totalSeats: 100,
      availableSeats: 100,
      priceCents: 250000, // 2500.00 BDT
    },
    {
      name: 'Chittagong Music Festival',
      date: new Date('2026-10-02T18:00:00Z'),
      totalSeats: 50,
      availableSeats: 50,
      priceCents: 150000,
    },
    {
      name: 'Comilla Startup Meetup',
      date: new Date('2026-08-20T15:00:00Z'),
      totalSeats: 5,
      availableSeats: 5,
      priceCents: 0,
    },
  ]);

  await repo.save(events);
  console.log(`Seeded ${events.length} events.`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
