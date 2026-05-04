import express from 'express';
import { envs } from './configuration/envs.js';
import userRouter from './module/user/user.route.js';
import passport from './configuration/passport.js';

const app = express();

app.use(express.json());

app.use(passport.initialize())

app.set('port', envs.PORT);

app.use(userRouter)

export default app;
