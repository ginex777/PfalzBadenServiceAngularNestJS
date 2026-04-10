import { Module } from '@nestjs/common';
import { MahnungenController } from './mahnungen.controller';

@Module({ controllers: [MahnungenController] })
export class MahnungenModule {}
