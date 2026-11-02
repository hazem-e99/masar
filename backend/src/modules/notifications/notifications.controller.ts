import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BroadcastNotificationDto, CreateNotificationDto } from './dto/notification.dto';

@Controller('api/Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Authenticated()
  async getAll(@CurrentUser('numericId') userId: number) {
    return this.notificationsService.getAll(userId);
  }

  @Get('unread')
  @Authenticated()
  async getUnread(@CurrentUser('numericId') userId: number) {
    return this.notificationsService.getUnread(userId);
  }

  @Get('unread-count')
  @Authenticated()
  async getUnreadCount(@CurrentUser('numericId') userId: number) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('admin/all')
  @Roles('Admin')
  async adminGetAll() {
    return this.notificationsService.adminGetAll();
  }

  @Get(':id')
  @Authenticated()
  async getById(@Param('id') id: string, @CurrentUser('numericId') userId: number) {
    return this.notificationsService.getById(parseInt(id), userId);
  }

  @Post()
  @Roles('Admin', 'MovementManager', 'Conductor')
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('broadcast')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }

  @Put(':id/mark-read')
  @Authenticated()
  async markAsRead(@Param('id') id: string, @CurrentUser('numericId') userId: number) {
    return this.notificationsService.markAsRead(parseInt(id), userId);
  }

  @Put('mark-all-read')
  @Authenticated()
  async markAllAsRead(@CurrentUser('numericId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete('clear-all')
  @Authenticated()
  async clearAll(@CurrentUser('numericId') userId: number) {
    return this.notificationsService.clearAll(userId);
  }

  @Delete('admin/:id')
  @Roles('Admin')
  async adminDelete(@Param('id') id: string) {
    return this.notificationsService.adminDelete(parseInt(id));
  }

  @Delete(':id')
  @Authenticated()
  async delete(@Param('id') id: string, @CurrentUser('numericId') userId: number) {
    return this.notificationsService.delete(parseInt(id), userId);
  }
}
