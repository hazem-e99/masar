import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { StudentDashboardService } from './student-dashboard.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/StudentDashboard')
@Roles('Admin', 'Student')
export class StudentDashboardController {
  constructor(private readonly dashService: StudentDashboardService) {}

  private assertOwn(studentId: string, user: { role?: string; numericId?: number }) {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'admin') return;
    if (role === 'student' && Number(user.numericId) === Number(studentId)) return;
    throw new ForbiddenException('You can only view your own dashboard');
  }

  @Get(':studentId/stats')
  async getStats(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    this.assertOwn(studentId, user);
    return this.dashService.getStats(parseInt(studentId));
  }

  @Get(':studentId/recent-trips')
  async getRecentTrips(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    this.assertOwn(studentId, user);
    return this.dashService.getRecentTrips(parseInt(studentId));
  }

  @Get(':studentId/upcoming-trips')
  async getUpcomingTrips(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    this.assertOwn(studentId, user);
    return this.dashService.getUpcomingTrips(parseInt(studentId));
  }

  @Get(':studentId/payments')
  async getPayments(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    this.assertOwn(studentId, user);
    return this.dashService.getPayments(parseInt(studentId));
  }
}
