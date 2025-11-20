import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string;
  }>;
}

/**
 * Email Service using Nodemailer
 * Поддерживает SMTP и различные email провайдеры
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Проверка подключения при инициализации
    this.verifyConnection();
  }

  /**
   * Проверка подключения к SMTP серверу
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service: SMTP connection verified');
    } catch (error) {
      console.error('❌ Email service: SMTP connection failed', error);
    }
  }

  /**
   * Отправка email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Draiver'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      console.log(`📧 Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  /**
   * Отправка приветственного письма
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Добро пожаловать в Draiver!</h1>
            </div>
            <div class="content">
              <h2>Привет, ${firstName}!</h2>
              <p>Спасибо за регистрацию в Draiver - лучшем сервисе такси в Казахстане!</p>
              <p>Теперь вы можете:</p>
              <ul>
                <li>🚕 Заказывать поездки по выгодным ценам</li>
                <li>💰 Зарабатывать на поездках как водитель</li>
                <li>🎁 Получать бонусы и промокоды</li>
                <li>⭐ Накапливать баллы лояльности</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Начать использовать</a>
              <p>Если у вас есть вопросы, наша служба поддержки всегда готова помочь!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Draiver. Все права защищены.</p>
              <p>Almaty, Kazakhstan</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Добро пожаловать в Draiver! 🚗',
      html,
    });
  }

  /**
   * Отправка кода подтверждения
   */
  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box { background: #f0f0f0; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🔐 Код подтверждения</h2>
            <p>Ваш код подтверждения для Draiver:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p>Введите этот код в приложении для подтверждения вашего email.</p>
            <div class="warning">
              ⚠️ Не сообщайте этот код никому! Сотрудники Draiver никогда не попросят ваш код.
            </div>
            <p>Код действителен в течение 10 минут.</p>
            <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Код подтверждения Draiver',
      html,
    });
  }

  /**
   * Уведомление о новой поездке для водителя
   */
  async sendNewRideNotification(
    to: string,
    driverName: string,
    rideDetails: {
      pickupAddress: string;
      dropoffAddress: string;
      suggestedPrice: number;
      distance: number;
    }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .ride-card { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; }
            .price { font-size: 28px; font-weight: bold; color: #28a745; }
            .route { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🚗 Новый заказ поездки!</h2>
            <p>Привет, ${driverName}!</p>
            <p>Для вас доступен новый заказ:</p>
            <div class="ride-card">
              <div class="route">
                <p><strong>📍 Откуда:</strong> ${rideDetails.pickupAddress}</p>
                <p><strong>🎯 Куда:</strong> ${rideDetails.dropoffAddress}</p>
                <p><strong>📏 Расстояние:</strong> ${rideDetails.distance} км</p>
              </div>
              <div class="price">${rideDetails.suggestedPrice}₸</div>
              <p style="color: #666;">Предложенная цена</p>
            </div>
            <p>Зайдите в приложение чтобы сделать свое предложение!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/driver/dashboard"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
              Открыть приложение
            </a>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: '🚗 Новый заказ поездки!',
      html,
    });
  }

  /**
   * Уведомление о принятии ставки для водителя
   */
  async sendBidAcceptedNotification(
    to: string,
    driverName: string,
    rideDetails: {
      pickupAddress: string;
      dropoffAddress: string;
      price: number;
      passengerName: string;
      passengerPhone: string;
    }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { background: #d4edda; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">
              <h2>✅ Ваша ставка принята!</h2>
            </div>
            <p>Поздравляем, ${driverName}!</p>
            <p>Пассажир принял ваше предложение на сумму <strong>${rideDetails.price}₸</strong></p>
            <h3>Детали поездки:</h3>
            <ul>
              <li><strong>Пассажир:</strong> ${rideDetails.passengerName}</li>
              <li><strong>Телефон:</strong> ${rideDetails.passengerPhone}</li>
              <li><strong>Откуда:</strong> ${rideDetails.pickupAddress}</li>
              <li><strong>Куда:</strong> ${rideDetails.dropoffAddress}</li>
            </ul>
            <p>Свяжитесь с пассажиром и начните поездку!</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: '✅ Ваша ставка принята!',
      html,
    });
  }

  /**
   * Отправка квитанции о завершенной поездке
   */
  async sendRideReceipt(
    to: string,
    userName: string,
    rideDetails: {
      rideId: string;
      date: Date;
      pickupAddress: string;
      dropoffAddress: string;
      distance: number;
      duration: number;
      price: number;
      paymentMethod: string;
    }
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .receipt { background: white; border: 1px solid #ddd; border-radius: 10px; padding: 20px; }
            .total { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            td:first-child { color: #666; }
            td:last-child { font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🧾 Квитанция о поездке</h2>
            <p>Спасибо за поездку с Draiver, ${userName}!</p>
            <div class="receipt">
              <table>
                <tr>
                  <td>Номер поездки:</td>
                  <td>${rideDetails.rideId}</td>
                </tr>
                <tr>
                  <td>Дата и время:</td>
                  <td>${rideDetails.date.toLocaleString('ru-RU')}</td>
                </tr>
                <tr>
                  <td>Откуда:</td>
                  <td>${rideDetails.pickupAddress}</td>
                </tr>
                <tr>
                  <td>Куда:</td>
                  <td>${rideDetails.dropoffAddress}</td>
                </tr>
                <tr>
                  <td>Расстояние:</td>
                  <td>${rideDetails.distance.toFixed(1)} км</td>
                </tr>
                <tr>
                  <td>Длительность:</td>
                  <td>${Math.round(rideDetails.duration)} мин</td>
                </tr>
                <tr>
                  <td>Способ оплаты:</td>
                  <td>${rideDetails.paymentMethod}</td>
                </tr>
              </table>
              <div class="total">
                Итого: ${rideDetails.price}₸
              </div>
            </div>
            <p>Надеемся увидеть вас снова! 🚗</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Квитанция о поездке #${rideDetails.rideId}`,
      html,
    });
  }
}

// Singleton instance
export const emailService = new EmailService();
export default emailService;
