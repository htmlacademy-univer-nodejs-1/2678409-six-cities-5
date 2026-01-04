import { ICity, CreateCityData } from '../models/city.entity.js';

export interface ICityService {
  findByName(name: string): Promise<ICity | null>;
  create(cityData: CreateCityData): Promise<ICity>;
}
