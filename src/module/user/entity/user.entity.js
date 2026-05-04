import { EntitySchema } from 'typeorm';

export const userEntity = new EntitySchema({
  name: 'User', //# El nombre le damos para reconocerlo dentro del código
  tableName: 'users', //# Nombre de la tabla
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    username: {
      type: 'varchar',
      nullable: false,
    },
    password: {
      type: 'varchar',
      nullable: false,
    },
  },
});
