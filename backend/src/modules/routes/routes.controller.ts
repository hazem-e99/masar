import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/Routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @Roles('Admin', 'MovementManager', 'Driver', 'Conductor')
  async getAll() {
    return this.routesService.getAll();
  }

  @Get(':id')
  @Roles('Admin', 'MovementManager', 'Driver', 'Conductor')
  async getById(@Param('id') id: string) {
    return this.routesService.getById(parseInt(id));
  }

  @Post()
  @Roles('Admin', 'MovementManager')
  async create(@Body() dto: any) {
    return this.routesService.create(dto);
  }

  @Put(':id')
  @Roles('Admin', 'MovementManager')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.routesService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @Roles('Admin', 'MovementManager')
  async delete(@Param('id') id: string) {
    return this.routesService.delete(parseInt(id));
  }
}
