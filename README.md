# telebirr-js

Telebirr integration package for node

## Usage

install the package `npm i telebirr-js`

```javascript
const Telebirr = require('telebirr-js');

const telebirr = new Telebirr({
  appId: 'YOUR TELEBIRR APP ID',
  appKey: 'YOUR TELEBIRR APP KEY',
  shortCode: 'TELEBIRR SHORT CODE',
  publicKey: 'YOUR TELEBIRR PUBLIC KEY',
});

const { success, response, error } = await telebirr.makePayment({
  paymentMethod: 'web | app',
  nonce: 'a unique random string ( should be unique for each request )',
  notifyUrl: 'https://www.example.com/yourapp-webhook', // callback url for payment confirmation
  totalAmount: 4.5, // amount to charge
  outTradeNo: 'unique identifier (order no)',
  receiveName: 'Almaz Werku', // receiver's name
  returnApp: 'com.example.app', // your application package name
  returnUrl: 'https://yourwebsite.com', // redirect url after payment completion'
  subject: 'payment for ...',
  timeoutExpress: '120', // valid for 2 hours
});
```

## Handling callback notifications

- once user completes the payment, you'll receive an encrypted plaintext on the `notifyUrl` you provided.

- Make sure the endpoint accepts `plaintext` request body

- you need to decrypt the text to get the transaction details

```javascript
const {
  msisdn, // the phone number from which the payment was done
  outTradeNo, // unique identifier provided when creating the payment
  totalAmount,
  tradeDate,
  tradeNo,
  tradeStatus,
  transactionNo,
} = telebirr.getDecryptedCallbackNotification(encryptedTextFromTelebirr);
```

### Reference:

Owner: <a href="https://github.com/vernu">Vernu</a>, Repo: <a href="https://github.com/vernu/telebirrjs/">Repository</a>
