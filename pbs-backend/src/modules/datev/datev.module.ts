import { Module } from '@nestjs/common';
import { DatevController } from './datev.controller';

@Module({ controllers: [DatevController] })
export class DatevModule {}
