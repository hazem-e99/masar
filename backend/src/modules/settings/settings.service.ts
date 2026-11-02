import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './setting.schema';
import { pick } from '../../common/utils/pick';
import { brand } from '../../config/brand';

const SETTING_FIELDS = ['systemName', 'logo', 'primaryColor', 'secondaryColor', 'maintenanceMode'];

@Injectable()
export class SettingsService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<SettingDocument>) {}

  async get() {
    let settings = await this.settingModel.findOne().exec();
    if (!settings) {
      settings = await this.settingModel.create({
        systemName: brand.nameEn,
        logo: '/logo2.png',
        primaryColor: '#2563EB',
        secondaryColor: '#7C3AED',
        maintenanceMode: false,
      });
    }
    return {
      systemName: settings.systemName,
      logo: settings.logo,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    };
  }

  async update(payload: any) {
    await this.settingModel.findOneAndUpdate({}, { $set: pick(payload, SETTING_FIELDS) }, { upsert: true });
    return { success: true };
  }

  async getMaintenanceMode() {
    const settings = await this.settingModel.findOne().exec();
    return { maintenanceMode: settings?.maintenanceMode || false };
  }
}
