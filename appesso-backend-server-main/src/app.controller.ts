import { Controller, Get, Post, Render, Res } from '@nestjs/common';
import { AppService } from './app.service';
// import { ResponceType } from './types/responce';
import { Response } from 'express';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
