import { transporter } from '../utils/transporter';
import { config } from '../config/env.config';

export const passwordResetEmail = ( link: string, email: string ): void => {
    transporter.sendMail({
        from: config.email.emailUser,
        to: email,
        subject: 'Password Reset Request',
        html: `
                <p>You requested a password reset.</p>
                <p>Click the link below. It expires in 15 minutes.</p>
                <a href="${link}">Reset my password</a>
                <p>If you didn't request this, ignore this email.</p>
            `
    });
}
