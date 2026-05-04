import { request, response } from 'express';
import * as bcrypt from 'bcrypt';
import AppDatasource from '../../providers/datasource.provider.js';
import jwt from 'jsonwebtoken';
import { envs } from '../../configuration/envs.js';

const repo = AppDatasource.getRepository('User');

const register = async (req = request, res = response) => {
  const { username, password } = req.body;

  const hashPassword = await bcrypt.hash(password, 12);

  const finalUser = {username, password: hashPassword}

  try {
    const newUser = await repo.save(finalUser);
    
    res.status(201).json({ok: true, result: newUser, msg: 'Created'})
  }
  catch (error) {
      res.status(400).json({ok: false, error, msg: 'Error'})
  }
};

const login = async (req = request, res = response) => {
  const { username, password } = req.body;

  try{
    const user = await repo.findOne({ where: { username } });

    if (!user) {
      res.status(404).json('User not found');
      return;
    }
    //# Acá comparamos la contraseña no hasheada con la que esta almacenada en la base de datos:
    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword) {
      res.status(401).json('Wrong password');
      return;
    }

    const payload = { id: user.id, username: user.username};

    const token = jwt.sign(payload, envs.JWT_SECRET, {
      expiresIn: '1h',
    })

    res.status(200).json({
      ok: true, 
      message: 'Login',
      metadata: {user: {...user, password: '***' }, token},
    });
  }
  catch (error){
    console.error(error);
    res.status(500).json({ok: false, error, msg: 'Server error'})
  }
};

const findAll = async (req = request, res = response) => {
  const users = await repo.find();

  console.log(req.user)

  res.status(200).json({ok: true, message: 'Approved', data: users})
}

export const userController = {
  register,
  login,
  findAll
}