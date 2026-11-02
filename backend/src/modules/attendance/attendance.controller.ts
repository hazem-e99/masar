import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/Attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getAll(@Query('tripId') tripId?: string, @Query('studentId') studentId?: string) {
    return this.attendanceService.getAll({ tripId, studentId });
  }

  @Get(':id')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getById(@Param('id') id: string) {
    return this.attendanceService.getById(id);
  }

  @Post()
  @Roles('Admin', 'Conductor')
  async create(@Body() dto: any) {
    return this.attendanceService.create(dto);
  }

  @Patch(':id')
  @Roles('Admin', 'Conductor')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }
}
