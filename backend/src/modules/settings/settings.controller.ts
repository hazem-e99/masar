import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../../common/decorators/public.decorator';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/Settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Authenticated()
  async get() {
    return this.settingsService.get();
  }

  @Get('maintenance-mode')
  @Public()
  async getMaintenanceMode() {
    return this.settingsService.getMaintenanceMode();
  }

  @Put()
  @Roles('Admin')
  async update(@Body() payload: any) {
    return this.settingsService.update(payload);
  }
}
