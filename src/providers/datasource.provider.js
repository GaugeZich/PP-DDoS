import { DataSource } from 'typeorm';
import { envs } from '../configuration/envs.js';
import { userEntity } from '../module/user/entity/user.entity.js';

const AppDatasource = new DataSource({
  type: 'mysql',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USER,
  password: envs.DB_PASS,
  database: envs.DATABASE,
  synchronize: envs.NODE_ENV !== 'production',
  logging: false,
  entities: [userEntity],
});

export default AppDatasource;