import * as Yup from 'yup';
import { isBefore, startOfHour, parseISO, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import mail from '../../lib/mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointment = await Appointment.findAll({
      where: {
        canceled_at: null,
      },
      limit: 20,
      offset: (page - 1) * 20,
      order: ['date'],
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    res.json(appointment);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'You must fulfil all fields correctly' });
    }

    const { provider_id, date } = req.body;

    // Checar se provider_id é provedor msm

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'The provider_id is not from a provider' });
    }

    // Checar se está agendando com ele mesmo

    if (req.userId === provider_id) {
      return res
        .status(400)
        .json({ error: 'Cannot appointment with yourself' });
    }

    // Validação de data

    const startHour = startOfHour(parseISO(date));

    if (isBefore(startHour, new Date())) {
      res.status(400).json({ error: 'Past dates is not permited' });
    }

    // Checar se ja existe algum agendamento

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date,
      },
    });

    if (checkAvailability) {
      res.status(400).json({
        error: 'It is not possible to create a appointment on this hour/date',
      });
    }

    // Criar agendamento

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    // Notify appointment provider

    const user = await User.findOne({ where: { id: req.userId } });
    const formattedDate = format(
      startHour,
      "'dia' dd 'de' MMMM', às ' H:mm'h'",
      {
        locale: pt,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You do not have permission to cancel this appointment',
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel a appointment from 2 hours early or before',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await mail.sendMail({
      to: `${appointment.provider.name} ${appointment.provider.email}`,
      subject: 'Agendamento Cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'dia' dd 'de' MMMM', às ' H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
