import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  // Not strictly validated as a UUID on purpose: the assignment's own sample
  // payload ("...-booking-001") is not a valid UUID, so we just require a
  // reasonably-sized, non-empty client-generated string.
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  requestId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  eventId: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats: number;
}
