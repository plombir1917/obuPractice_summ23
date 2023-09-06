import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles-auth.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { User } from 'src/decorators/user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { MemberService } from 'src/member/member.service';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberToEvent } from './entities/memberToEvent.entity';
import { Repository } from 'typeorm';

@Controller('events')
export class EventController {
  logger: Logger;

  constructor(
    @InjectRepository(MemberToEvent)
    private memberToEventRepository: Repository<MemberToEvent>,
    private readonly eventService: EventService,
    private readonly memberService: MemberService,
  ) {
    this.logger = new Logger(EventController.name);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe())
  @Post()
  create(@Body() createEventDto: CreateEventDto, @User() account: Account) {
    return this.eventService.create(createEventDto, account.company);
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Post('subscribe/:id')
  async subscribe(@User() account: Account, @Param('id') eventId: string) {
    let member = await this.memberService.findOneByAccount(account);
    if (!member) {
      member = await this.memberService.create(account);
    }
    return this.eventService.subscribe(member, +eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('unsubscribe/:id')
  async remove(@Param('id') id: string) {
    const event = await this.eventService.findOne(+id);
    const sign = await this.memberToEventRepository.findOne({
      where: {
        event: event,
      },
      relations: { member: true, event: true },
    });
    if (!sign) {
      throw new NotFoundException('Запись не найдена!');
    }
    this.logger.log(
      `${sign.member.email} unsubscribed from ${event.name} at ${Date()}`,
    );
    return this.eventService.unSubscribe(sign);
  }

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(+id);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe())
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(+id, updateEventDto);
  }
}
