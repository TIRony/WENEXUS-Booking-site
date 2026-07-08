import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Booking } from '../bookings/entities/booking.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'wenexus',
  password: process.env.DB_PASS || 'wenexus',
  database: process.env.DB_NAME || 'wenexus',
  entities: [Event, Booking],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  // We rely on explicit migrations, not auto-sync, so schema changes are
  // reviewable and reproducible in production.
  synchronize: false,
  logging: false,
};

// Default export required by the TypeORM CLI (`-d src/config/typeorm.config.ts`).
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
