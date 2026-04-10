import { Module } from '@nestjs/common';
import { WiederkehrendController } from './wiederkehrend.controller';
import { WiederkehrendService } from './wiederkehrend.service';

@Module({ controllers: [WiederkehrendController], providers: [WiederkehrendService] })
export class WiederkehrendModule {}
