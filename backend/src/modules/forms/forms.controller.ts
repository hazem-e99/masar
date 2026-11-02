import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { brand } from '../../config/brand';

@Controller('api/Forms')
export class FormsController {
  @Public()
  @Get()
  async get() {
    return {
      departments: [...brand.departments],
      yearsOfStudy: ['1', '2', '3', '4', '5'],
      busStatuses: ['Active', 'Inactive', 'UnderMaintenance', 'OutOfService'],
      tripStatuses: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
      bookingStatuses: ['Confirmed', 'Cancelled', 'NoShow', 'Completed'],
      paymentMethods: ['Offline', 'Online'],
      paymentStatuses: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Expired'],
      roles: ['Admin', 'Student', 'Driver', 'Conductor', 'MovementManager'],
      notificationTypes: ['System', 'Alert', 'Announcement', 'Reminder', 'Booking'],
    };
  }
}
