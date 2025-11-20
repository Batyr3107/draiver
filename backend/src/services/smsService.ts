import axios from 'axios';

/**
 * SMS Service для Казахстана
 * Использует SMSC.kz - популярный SMS провайдер в Казахстане
 */
class SMSService {
  private baseURL = 'https://smsc.kz/sys/send.php';
  private login: string;
  private password: string;
  private sender: string;

  constructor() {
    this.login = process.env.SMSC_LOGIN || '';
    this.password = process.env.SMSC_PASSWORD || '';
    this.sender = process.env.SMSC_SENDER || 'Draiver';

    if (!this.login || !this.password) {
      console.warn('⚠️ SMS Service: SMSC credentials not configured');
    } else {
      console.log('✅ SMS Service: SMSC.kz initialized');
    }
  }

  /**
   * Отправка SMS
   */
  async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!this.login || !this.password) {
      console.error('❌ SMS Service: SMSC credentials not configured');
      return false;
    }

    try {
      // Очистка номера телефона (только цифры)
      const cleanPhone = phone.replace(/\D/g, '');

      const response = await axios.get(this.baseURL, {
        params: {
          login: this.login,
          psw: this.password,
          phones: cleanPhone,
          mes: message,
          sender: this.sender,
          charset: 'utf-8',
          fmt: 3, // JSON формат ответа
        },
        timeout: 10000, // 10 секунд таймаут
      });

      if (response.data.error_code) {
        console.error(`❌ SMS sending failed: ${response.data.error}`);
        return false;
      }

      console.log(`📱 SMS sent to ${cleanPhone}: ${response.data.id}`);
      return true;
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return false;
    }
  }

  /**
   * Отправка кода подтверждения
   */
  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    const message = `Ваш код подтверждения Draiver: ${code}\n\nНе сообщайте никому этот код!\nКод действителен 10 минут.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Уведомление о новой поездке для водителя
   */
  async sendNewRideNotification(
    phone: string,
    rideDetails: {
      pickupAddress: string;
      dropoffAddress: string;
      suggestedPrice: number;
    }
  ): Promise<boolean> {
    const message = `🚗 Новый заказ Draiver!\n\nОткуда: ${rideDetails.pickupAddress}\nКуда: ${rideDetails.dropoffAddress}\nЦена: ${rideDetails.suggestedPrice}₸\n\nОткройте приложение для ответа.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Уведомление о принятии ставки
   */
  async sendBidAcceptedNotification(
    phone: string,
    passengerName: string,
    price: number
  ): Promise<boolean> {
    const message = `✅ Ваша ставка принята!\n\nПассажир: ${passengerName}\nСумма: ${price}₸\n\nСвяжитесь с пассажиром через приложение Draiver.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Уведомление пассажиру о назначении водителя
   */
  async sendDriverAssignedNotification(
    phone: string,
    driverDetails: {
      name: string;
      vehicleModel: string;
      vehicleNumber: string;
      rating: number;
    }
  ): Promise<boolean> {
    const message = `🚕 Водитель найден!\n\nВодитель: ${driverDetails.name}\nАвто: ${driverDetails.vehicleModel} (${driverDetails.vehicleNumber})\nРейтинг: ${driverDetails.rating}⭐\n\nВодитель уже в пути!`;
    return this.sendSMS(phone, message);
  }

  /**
   * Напоминание о запланированной поездке
   */
  async sendScheduledRideReminder(
    phone: string,
    rideDetails: {
      pickupAddress: string;
      scheduledTime: Date;
    }
  ): Promise<boolean> {
    const timeStr = rideDetails.scheduledTime.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `⏰ Напоминание Draiver\n\nВаша поездка запланирована на ${timeStr}\n\nОткуда: ${rideDetails.pickupAddress}\n\nБудьте готовы!`;
    return this.sendSMS(phone, message);
  }

  /**
   * Уведомление о прибытии водителя
   */
  async sendDriverArrivedNotification(
    phone: string,
    driverName: string,
    vehicleNumber: string
  ): Promise<boolean> {
    const message = `🚗 Водитель прибыл!\n\nВодитель ${driverName} ждет вас.\nАвто: ${vehicleNumber}\n\nВыходите, пожалуйста.`;
    return this.sendSMS(phone, message);
  }

  /**
   * Уведомление о завершении поездки
   */
  async sendRideCompletedNotification(
    phone: string,
    rideDetails: {
      price: number;
      distance: number;
    }
  ): Promise<boolean> {
    const message = `✅ Поездка завершена!\n\nРасстояние: ${rideDetails.distance.toFixed(1)} км\nСумма: ${rideDetails.price}₸\n\nСпасибо за использование Draiver! 🚗`;
    return this.sendSMS(phone, message);
  }

  /**
   * Промокод и бонусы
   */
  async sendPromoCodeNotification(
    phone: string,
    promoCode: string,
    discount: number
  ): Promise<boolean> {
    const message = `🎁 Бонус от Draiver!\n\nВаш промокод: ${promoCode}\nСкидка: ${discount}%\n\nИспользуйте при следующей поездке!`;
    return this.sendSMS(phone, message);
  }

  /**
   * Проверка баланса SMS (опционально)
   */
  async checkBalance(): Promise<number | null> {
    if (!this.login || !this.password) {
      return null;
    }

    try {
      const response = await axios.get('https://smsc.kz/sys/balance.php', {
        params: {
          login: this.login,
          psw: this.password,
          fmt: 3,
        },
      });

      if (response.data.balance !== undefined) {
        console.log(`💰 SMS Balance: ${response.data.balance} RUB`);
        return response.data.balance;
      }

      return null;
    } catch (error) {
      console.error('❌ Balance check failed:', error);
      return null;
    }
  }
}

// Singleton instance
export const smsService = new SMSService();
export default smsService;
