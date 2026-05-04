import app from './app.js';
import AppDatasource from './providers/datasource.provider.js';
import pkg from 'signale';

const { Signale } = pkg;

import http from 'http';
import { Server } from "socket.io"

const server = http.createServer(app);
const io = new Server(server)

const main = async () => {
  const logger = new Signale({ scope: 'Main' });
  const port = app.get('port');

  try {
    // Primero conectar a la base de datos
    await AppDatasource.initialize();
    logger.success('Connected to database');

    // Solo después iniciar el servidor
    server.listen(port, () => {
      logger.success(`Server running on port ${port}`);
    });

  } catch (err) {
    logger.error(`Unable to connect to database: ${err}`);
    process.exit(1); // Salir si no puede conectar a la DB
  }
};

main();
