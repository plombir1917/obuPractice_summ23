import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/company/entities/company.entity';
import { Member } from 'src/member/entities/member.entity';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/events.entity';
import { MemberToEvent } from './entities/memberToEvent.entity';

@Injectable()
export class EventService {
  logger: Logger;
  constructor(
    @InjectRepository(Event) private eventRepository: Repository<Event>,
    @InjectRepository(Member) private memberRepository: Repository<Member>,
    @InjectRepository(MemberToEvent)
    private memberToEventRepository: Repository<MemberToEvent>,
  ) {
    this.logger = new Logger(EventService.name);
  }
  async create(createEventDto: CreateEventDto, company: Company) {
    const newEvent = this.eventRepository.create({
      ...createEventDto,
      company,
    });
    return this.eventRepository.save(newEvent);
  }

  async subscribe(member: Member, eventId: number) {
    const event = await this.findOne(eventId);
    const eventDate = event.date;
    const equalDate = new Date();
    if (eventDate.getTime() < equalDate.getTime()) {
      throw new BadRequestException('Мероприятие прошло');
    }
    const newSign = this.memberToEventRepository.create({
      member,
      event,
    });
    const existSign = await this.memberToEventRepository.findOneBy(newSign);
    if (existSign) {
      throw new BadRequestException('Такая запись уже существует');
    }
    this.logger.log(`${member.email} subscribed on ${event.name} at ${Date()}`);
    return this.memberToEventRepository.save(newSign);
  }

  async unSubscribe(sign: MemberToEvent) {
    const id = sign.id;
    const deletedSign = await this.memberToEventRepository.delete({
      id,
    });
    if (!deletedSign.affected) {
      throw new NotFoundException('Запись не найдена!');
    }
    return sign;
  }

  async findAll() {
    const events = await this.eventRepository.find();
    if (!events.length) {
      throw new NotFoundException('Мероприятие не найдено!');
    }
    return events;
  }

  async findOne(id: number) {
    const event = await this.eventRepository.findOneBy({ id });
    if (!event) {
      throw new NotFoundException('Мероприятие не найдено!');
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (!event) {
      throw new NotFoundException('Мероприятие не найдено!');
    }
    return this.eventRepository.save({ ...event, ...updateEventDto });
  }

  async remove(id: number) {
    const event = await this.findOne(id);
    if (!event) {
      throw new NotFoundException('Мероприятие не найдено!');
    }
    return this.eventRepository.remove(event);
  }
}
