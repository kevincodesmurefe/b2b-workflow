import nodemailer from 'nodemailer';
import { config } from '../config/env.config';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email.emailUser,
        pass: config.email.emailPass
    }
});