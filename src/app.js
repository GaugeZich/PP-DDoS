import express from 'express';
import { envs } from './configuration/envs.js';
import userRouter from './module/user/user.route.js';
import passport from './configuration/passport.js';
import deceptionLayerMiddleware, {  getSecurityStats, clearIPRecord } from '../src/middlewares/deception-layer.middleware.js';

const app = express();

app.use(express.json());


app.use(deceptionLayerMiddleware);

app.use(passport.initialize());

app.set('port', envs.PORT);

// Rutas de administración para ver estadísticas
app.get('/api/security/stats', getSecurityStats);
app.delete('/api/security/clear-ip/:ip', clearIPRecord);

// Tus rutas normales
app.use(userRouter);

export default app;