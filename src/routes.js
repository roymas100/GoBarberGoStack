import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

// import User from './app/models/User';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

// cria usuario
routes.post('/users', UserController.store);
// faz o login / cria a sessao
routes.post('/sessions', SessionController.store);

// autentifica o usuario depois do login
routes.use(authMiddleware);

// altera dados do usuario
routes.put('/users', UserController.update);

// Lista de barbeiros
routes.get('/providers', ProviderController.index);
// lista de horarios disponiveis para os barbeiros
routes.get('/providers/:providerId/available', AvailableController.index);

// usuario agenda com barbeiro
routes.post('/appointments', AppointmentController.store);
// lista de agendamentos de horarios de agendamentos em aberto
routes.get('/appointments', AppointmentController.index);
// cancelar agendamento e envia um email
routes.delete('/appointments/:id', AppointmentController.delete);

// lista de agendamentos do barbeiro
routes.get('/schedule', ScheduleController.index);

//
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
