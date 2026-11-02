import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { User, UserDocument } from '../users/user.schema';
import { createApiResponse, ApiResponse } from '../../common/interfaces/api-response.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private getNumericId(doc: any): number {
    return parseInt((doc._id as any).toString().slice(-8), 16) % 100000;
  }

  private getTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private async toViewModel(notif: NotificationDocument): Promise<any> {
    const id = this.getNumericId(notif);
    const user = await this.findByNumericId(this.userModel, notif.userId);
    return {
      id,
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      sentAt: notif.sentAt?.toISOString(),
      isRead: notif.isRead,
      isDeleted: notif.isDeleted,
      userName: user ? `${user.firstName} ${user.lastName}` : null,
      timeAgo: notif.sentAt ? this.getTimeAgo(notif.sentAt) : null,
    };
  }

  private async findByNumericId(model: Model<any>, numericId: number): Promise<any> {
    return model.findOne({ numericId }).exec();
  }

  private async findNotifByNumericId(id: number): Promise<NotificationDocument | null> {
    return this.notifModel.findOne({ numericId: id }).exec();
  }

  async getAll(userId: number): Promise<{ success: boolean; message: string | null; data: any[] }> {
    const notifs = await this.notifModel.find({ userId, isDeleted: false }).sort({ sentAt: -1 }).exec();
    const vms = await Promise.all(notifs.map((n) => this.toViewModel(n)));
    return { success: true, message: null, data: vms };
  }

  async getUnread(userId: number): Promise<{ success: boolean; message: string | null; data: any[] }> {
    const notifs = await this.notifModel.find({ userId, isRead: false, isDeleted: false }).sort({ sentAt: -1 }).exec();
    const vms = await Promise.all(notifs.map((n) => this.toViewModel(n)));
    return { success: true, message: null, data: vms };
  }

  async getUnreadCount(userId: number): Promise<{ success: boolean; message: string | null; data: number }> {
    const count = await this.notifModel.countDocuments({ userId, isRead: false, isDeleted: false });
    return { success: true, message: null, data: count };
  }

  async getById(id: number, ownerId?: number): Promise<{ success: boolean; message: string | null; data: any }> {
    const notif = await this.findNotifByNumericId(id);
    if (!notif) throw new NotFoundException('Notification not found');
    this.assertOwner(notif, ownerId);
    const vm = await this.toViewModel(notif);
    return { success: true, message: null, data: vm };
  }

  async create(dto: any): Promise<ApiResponse<boolean>> {
    await this.notifModel.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || 'System',
      sentAt: new Date(),
    });
    return createApiResponse(true, 'Notification created');
  }

  async delete(id: number, ownerId?: number): Promise<ApiResponse<boolean>> {
    const notif = await this.findNotifByNumericId(id);
    if (!notif) throw new NotFoundException('Notification not found');
    this.assertOwner(notif, ownerId);
    await this.notifModel.findByIdAndDelete(notif._id);
    return createApiResponse(true, 'Notification deleted');
  }

  async broadcast(dto: any): Promise<ApiResponse<boolean>> {
    const userIds = dto.userIds || [];
    let targetUsers: any[];
    if (userIds.length > 0) {
      targetUsers = userIds;
    } else {
      const allUsers = await this.userModel.find().exec();
      targetUsers = allUsers.map((u) => this.getNumericId(u));
    }
    const usedNumericIds = new Set<number>();
    const notifications = targetUsers.map((uid) => {
      let _id = new Types.ObjectId();
      let numericId = parseInt(_id.toString().slice(-8), 16) % 100000;
      while (usedNumericIds.has(numericId)) {
        _id = new Types.ObjectId();
        numericId = parseInt(_id.toString().slice(-8), 16) % 100000;
      }
      usedNumericIds.add(numericId);
      return {
        _id,
        numericId,
        userId: uid,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'Announcement',
        sentAt: new Date(),
        isRead: false,
        isDeleted: false,
      };
    });
    if (notifications.length > 0) {
      await this.notifModel.insertMany(notifications);
    }
    return createApiResponse(true, 'Broadcast sent');
  }

  async markAsRead(id: number, ownerId?: number): Promise<ApiResponse<boolean>> {
    const notif = await this.findNotifByNumericId(id);
    if (!notif) throw new NotFoundException('Notification not found');
    this.assertOwner(notif, ownerId);
    await this.notifModel.findByIdAndUpdate(notif._id, { isRead: true });
    return createApiResponse(true, 'Marked as read');
  }

  async markAllAsRead(userId: number): Promise<ApiResponse<boolean>> {
    await this.notifModel.updateMany({ userId, isRead: false }, { isRead: true });
    return createApiResponse(true, 'All marked as read');
  }

  async clearAll(userId: number): Promise<ApiResponse<boolean>> {
    await this.notifModel.updateMany({ userId }, { isDeleted: true });
    return createApiResponse(true, 'All notifications cleared');
  }

  async adminGetAll(): Promise<{ success: boolean; message: string | null; data: any[] }> {
    const notifs = await this.notifModel.find().sort({ sentAt: -1 }).exec();
    const vms = await Promise.all(notifs.map((n) => this.toViewModel(n)));
    return { success: true, message: null, data: vms };
  }

  async adminDelete(id: number): Promise<ApiResponse<boolean>> {
    return this.delete(id);
  }

  private assertOwner(notif: { userId: number }, ownerId?: number) {
    if (ownerId === undefined || ownerId === null) return;
    if (Number(notif.userId) !== Number(ownerId)) {
      throw new ForbiddenException('You can only access your own notifications');
    }
  }
}
