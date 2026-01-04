import 'reflect-metadata';
import { injectable } from 'inversify';
import { ICity, CityModel, CreateCityData } from '../models/city.entity.js';
import { ICityService } from './city.service.interface.js';

@injectable()
export class CityService implements ICityService {
  public async findByName(name: string): Promise<ICity | null> {
    const city = await CityModel.findOne({ name }).lean().exec();
    return city as ICity | null;
  }

  public async create(cityData: CreateCityData): Promise<ICity> {
    const city = new CityModel(cityData);
    const saved = await city.save();
    return saved.toObject() as ICity;
  }
}
