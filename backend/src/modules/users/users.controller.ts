import {
  BadRequestException,
  Controller, ForbiddenException, Get, Post, Put, Patch, Delete,
  Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Authenticated } from '../../common/decorators/authenticated.decorator';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Controller('api/Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getAll(@Query('email') email: string | undefined, @CurrentUser('role') role: string) {
    if (email) {
      if (String(role || '').toLowerCase() !== 'admin') {
        throw new ForbiddenException('Insufficient permissions');
      }
      return this.usersService.getByEmail(email);
    }
    return this.usersService.getAll(String(role || '').toLowerCase() !== 'admin');
  }

  @Get('profile')
  @Authenticated()
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get('by-role/:role')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getByRole(@Param('role') role: string, @CurrentUser('role') actorRole: string) {
    return this.usersService.getByRole(role, String(actorRole || '').toLowerCase() !== 'admin');
  }

  @Get('students-data')
  @Roles('Admin')
  async getStudentsData() {
    return this.usersService.getStudentsData();
  }

  @Get('students-data/:id')
  @Roles('Admin')
  async getStudentDataById(@Param('id') id: string) {
    return this.usersService.getStudentDataById(id);
  }

  /** Admin-only: one row per student joined with subscription + payment info. */
  @Get('students-overview')
  @Roles('Admin')
  async getStudentsOverview() {
    return this.usersService.getStudentsOverview();
  }

  @Get(':id')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getById(@Param('id') id: string, @CurrentUser('role') actorRole: string) {
    return this.usersService.getById(id, String(actorRole || '').toLowerCase() !== 'admin');
  }

  @Post('change-password')
  @Authenticated()
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() payload: { currentPassword: string; password: string; confirmPassword: string },
  ) {
    return this.usersService.changePassword(userId, payload);
  }

  @Put('profile')
  @Authenticated()
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ) {
    return this.usersService.updateProfile(userId, payload, 'common');
  }

  @Put('driver-profile')
  @Roles('Driver')
  async updateDriverProfile(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ) {
    return this.usersService.updateProfile(userId, payload, 'driver');
  }

  @Put('movement-manager-profile')
  @Roles('MovementManager')
  async updateMovementManagerProfile(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ) {
    return this.usersService.updateProfile(userId, payload, 'movement');
  }

  @Put('admin-profile')
  @Roles('Admin')
  async updateAdminProfile(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ) {
    return this.usersService.updateProfile(userId, payload, 'admin');
  }

  @Put('student-profile')
  @Roles('Student')
  async updateStudentProfile(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ) {
    return this.usersService.updateProfile(userId, payload, 'student');
  }

  @Put('update-profile-picture')
  @Authenticated()
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException('Only JPEG, PNG, WEBP, or GIF images are allowed.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async updateProfilePicture(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }
    const fileUrl = `/uploads/${file.filename || file.originalname}`;
    return this.usersService.updateProfilePicture(userId, fileUrl);
  }

  /**
   * Permanently (hard) deletes the user document — see
   * UsersService.deleteUser, which uses Model.findByIdAndDelete. Admin-only:
   * this physically removes the account, so a normal user must never be able
   * to invoke it for themselves or anyone else.
   */
  @Delete(':id')
  @Roles('Admin')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Patch(':id')
  @Roles('Admin')
  async updateUser(@Param('id') id: string, @Body() payload: any) {
    return this.usersService.updateUser(id, payload);
  }
}
