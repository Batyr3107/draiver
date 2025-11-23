# Third-Party Integrations Documentation

Руководство по интеграции внешних сервисов для Draiver.

## 🏦 Kaspi.kz Payment Integration

### Статус: TODO (Skeleton Ready)

**Файл**: `src/services/paymentService.ts`

### Требования

1. **Kaspi.kz Merchant Account**
   - Зарегистрироваться как мерчант: https://kaspi.kz/merchant
   - Получить credentials:
     - Merchant ID
     - API Key
     - Secret Key

2. **Environment Variables**
   ```env
   # .env
   KASPI_MERCHANT_ID=your-merchant-id
   KASPI_API_KEY=your-api-key
   KASPI_SECRET_KEY=your-secret-key
   ```

### Implementation Steps

#### 1. Install Dependencies
```bash
cd backend
npm install axios crypto
```

#### 2. Complete Payment Service

Открыть `src/services/paymentService.ts` и реализовать:

```typescript
import crypto from 'crypto';
import axios from 'axios';

const KASPI_API_URL = 'https://api.kaspi.kz/payments';

// Generate HMAC signature
function generateSignature(data: any, secret: string): string {
  const sortedData = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('&');

  return crypto
    .createHmac('sha256', secret)
    .update(sortedData)
    .digest('hex');
}

// Initialize payment
export async function initializePayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const signature = generateSignature(request, process.env.KASPI_SECRET_KEY!);

  const response = await axios.post(
    `${KASPI_API_URL}/init`,
    request,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Id': process.env.KASPI_MERCHANT_ID,
        'X-Signature': signature,
      },
    }
  );

  return {
    transactionId: response.data.transaction_id,
    paymentUrl: response.data.payment_url,
    status: 'pending',
  };
}
```

#### 3. Add Payment Endpoints

Create `src/controllers/paymentController.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { initializePayment, checkPaymentStatus } from '../services/paymentService';
import prisma from '../config/database';

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rideId } = req.body;
    const userId = req.user?.id;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const payment = await initializePayment({
      amount: ride.finalPrice,
      currency: 'KZT',
      orderId: ride.id,
      description: `Поездка ${ride.pickupAddress} → ${ride.dropoffAddress}`,
      returnUrl: `${process.env.FRONTEND_URL}/rides/${ride.id}/success`,
      failureUrl: `${process.env.FRONTEND_URL}/rides/${ride.id}/failure`,
    });

    res.json(payment);
  } catch (error) {
    next(error);
  }
};
```

#### 4. Add Routes

In `src/routes/paymentRoutes.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPayment, handleWebhook } from '../controllers/paymentController';

const router = Router();

router.post('/create', authenticate, createPayment);
router.post('/webhook', handleWebhook);

export default router;
```

#### 5. Update Prisma Schema

Add to `schema.prisma`:

```prisma
model Ride {
  // ... existing fields
  paymentStatus    String?  // 'pending' | 'success' | 'failed'
  transactionId    String?  @unique
  paidAt           DateTime?
}
```

#### 6. Test Integration

```bash
# Create payment
curl -X POST http://localhost:5000/api/payment/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rideId": "ride-id"}'

# Check status
curl -X GET http://localhost:5000/api/payment/status/transaction-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Kaspi.kz API Documentation

- Official Docs: https://kaspi.kz/merchantapi/
- Sandbox Environment: https://sandbox-api.kaspi.kz
- Test Cards: https://kaspi.kz/merchantapi/test-cards

---

## 📱 Firebase Cloud Messaging (Push Notifications)

### Статус: TODO (Skeleton Ready)

**Файл**: `src/services/pushNotificationService.ts`

### Требования

1. **Firebase Project**
   - Создать проект: https://console.firebase.google.com
   - Enable Cloud Messaging
   - Generate Service Account Key:
     - Project Settings → Service Accounts → Generate New Private Key

2. **Environment Variables**
   ```env
   # .env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   ```

### Implementation Steps

#### 1. Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

#### 2. Initialize Firebase

In `src/server.ts`:

```typescript
import { initializeFirebase } from './services/pushNotificationService';

// Initialize Firebase on startup
initializeFirebase();
```

#### 3. Complete Push Notification Service

Uncomment code in `src/services/pushNotificationService.ts`:

```typescript
import admin from 'firebase-admin';

export function initializeFirebase(): void {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    console.warn('Firebase credentials not configured. Push notifications disabled.');
    return;
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  console.log('✅ Firebase Cloud Messaging initialized');
}
```

#### 4. Update Prisma Schema

Add device tokens to User model:

```prisma
model User {
  // ... existing fields
  deviceTokens  String[]  @default([])
}
```

Run migration:
```bash
npx prisma migrate dev --name add-device-tokens
```

#### 5. Add Device Token Registration

Create `src/controllers/deviceController.ts`:

```typescript
import { Request, Response } from 'express';
import { registerDeviceToken } from '../services/pushNotificationService';

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user?.id!;

    await registerDeviceToken(userId, deviceToken);

    res.json({ success: true, message: 'Device registered' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register device' });
  }
};
```

#### 6. Integrate with Ride Events

In `src/controllers/rideController.ts`:

```typescript
import {
  notifyRideAccepted,
  notifyDriverArrived,
  notifyRideCompleted,
} from '../services/pushNotificationService';

// When ride is accepted
export const acceptRide = async (req, res, next) => {
  // ... existing logic

  // Send notification
  await notifyRideAccepted(ride.passengerId, driver.firstName);

  // ...
};

// When driver arrives
export const arrivedAtPickup = async (req, res, next) => {
  // ... existing logic

  await notifyDriverArrived(ride.passengerId);

  // ...
};

// When ride completes
export const completeRide = async (req, res, next) => {
  // ... existing logic

  await notifyRideCompleted(ride.passengerId, ride.finalPrice);

  // ...
};
```

#### 7. Frontend Integration (React Native / Flutter)

**React Native Example**:

```typescript
import messaging from '@react-native-firebase/messaging';

// Request permission
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Get device token
async function getDeviceToken() {
  const token = await messaging().getToken();

  // Register with backend
  await fetch('/api/device/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceToken: token }),
  });
}

// Handle foreground messages
messaging().onMessage(async (remoteMessage) => {
  Alert.alert('New message!', remoteMessage.notification?.body);
});

// Handle background messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
});
```

#### 8. Test Push Notifications

```bash
# Test sending notification
curl -X POST http://localhost:5000/api/test/push \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "title": "Test Notification",
    "body": "This is a test push notification"
  }'
```

### Firebase Documentation

- Firebase Console: https://console.firebase.google.com
- FCM Docs: https://firebase.google.com/docs/cloud-messaging
- Admin SDK: https://firebase.google.com/docs/admin/setup
- Testing: https://firebase.google.com/docs/cloud-messaging/js/send-multiple

---

## 🧪 Testing Integrations

### Payment Testing

**Test Cards** (Kaspi.kz sandbox):
- Success: `4405 6395 0000 0001`
- Failure: `4405 6395 0000 0002`
- 3D Secure: `4405 6395 0000 0003`

**Test Scenarios**:
1. ✅ Successful payment flow
2. ❌ Failed payment (insufficient funds)
3. 🔒 3D Secure authentication
4. 🔄 Payment status checking
5. 💰 Partial refund
6. 💸 Full refund

### Push Notification Testing

**Test Scenarios**:
1. 📲 Device token registration
2. 📨 Send to single user
3. 📢 Send to multiple users
4. 🎯 Topic-based notifications
5. 🖼️ Notifications with images
6. 📊 Tracking delivery/open rates

---

## 🚦 Production Checklist

### Before Going Live

#### Payment Integration
- [ ] Kaspi.kz merchant account verified
- [ ] Production credentials added to .env
- [ ] Webhook URL configured in Kaspi.kz dashboard
- [ ] SSL certificate installed for webhook endpoint
- [ ] Payment flow tested end-to-end
- [ ] Refund process tested
- [ ] Error handling implemented
- [ ] Transaction logging enabled

#### Push Notifications
- [ ] Firebase project created
- [ ] Service account key generated
- [ ] Production credentials added to .env
- [ ] Device token registration tested
- [ ] Notification delivery tested on iOS
- [ ] Notification delivery tested on Android
- [ ] Topic subscriptions configured
- [ ] Notification click handling implemented
- [ ] Badge and sound configured

---

## 🔧 Troubleshooting

### Payment Issues

**Problem**: Payment initialization fails
- Check Kaspi.kz credentials in .env
- Verify merchant account is active
- Check API endpoint URL
- Verify signature generation

**Problem**: Webhook not receiving callbacks
- Check webhook URL is publicly accessible
- Verify SSL certificate is valid
- Check signature verification logic
- Review Kaspi.kz webhook logs

### Push Notification Issues

**Problem**: Notifications not delivering
- Verify Firebase credentials
- Check device token is valid
- Verify Firebase project settings
- Check notification payload format

**Problem**: iOS notifications not working
- APNs certificate configured in Firebase
- Check iOS app capabilities (Push Notifications enabled)
- Verify production/sandbox environment

---

## 📚 Additional Resources

### Kaspi.kz
- API Documentation: https://kaspi.kz/merchantapi/
- Integration Guide: https://kaspi.kz/merchantapi/integration
- Support: merchant@kaspi.kz

### Firebase
- FCM Documentation: https://firebase.google.com/docs/cloud-messaging
- Admin SDK Reference: https://firebase.google.com/docs/reference/admin
- Community Support: https://stackoverflow.com/questions/tagged/firebase-cloud-messaging

### Best Practices
- Always validate webhook signatures
- Implement idempotent payment processing
- Handle FCM token refresh
- Log all payment transactions
- Implement retry logic for failed notifications
- Monitor notification delivery rates
- Secure all API credentials
