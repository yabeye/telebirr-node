const axios = require('axios');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');

const {
  TELEBIRR_H5_URL,
  TELEBIRR_IN_APP_URL,
  WEB,
  RETURN_APP,
  TIMEOUT_EXPRESS,
  FAILED_MESSAGE,
  validateBody,
} = require('./utils');

class Telebirr {
  constructor({ appId, appKey, shortCode, publicKey }) {
    this.appId = appId;
    this.appKey = appKey;
    this.shortCode = shortCode;
    this.publicKey = publicKey;
  }

  async makePayment({
    paymentMethod = WEB,
    returnApp = RETURN_APP,
    timeoutExpress = TIMEOUT_EXPRESS,
    nonce,
    notifyUrl,
    totalAmount,
    outTradeNo,
    receiveName,
    returnUrl,
    subject,
  }) {
    // Validation with Joi before making requests, to make sure we are sending a proper payload.
    // Example: errors. invalid url and totalAmount = 0 etc...
    const error = validateBody({
      paymentMethod,
      notifyUrl,
      receiveName,
      subject,
      returnUrl,
      totalAmount,
    });
    if (error) {
      return {
        success: false,
        message: FAILED_MESSAGE,
        error: error,
      };
    }

    const params = {
      appId: this.appId,
      appKey: this.appKey,
      nonce,
      notifyUrl,
      outTradeNo,
      receiveName,
      returnApp,
      returnUrl,
      shortCode: this.shortCode,
      subject,
      timeoutExpress,
      timestamp: new Date().getTime(),
      totalAmount,
    };
    const url = paymentMethod == WEB ? TELEBIRR_H5_URL : TELEBIRR_IN_APP_URL;

    try {
      const payload = {
        appid: this.appId,
        sign: this.signData(params),
        ussd: this.encrypt(params),
      };
      const { data } = await axios.post(url, payload);
      const isPaymentSuccessful = data.code == 200;

      return {
        success: isPaymentSuccessful,
        response: data,
        error: isPaymentSuccessful
          ? null
          : {
              code: data.code,
              message: FAILED_MESSAGE,
            },
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  encrypt(payload) {
    const rsaKey = new NodeRSA(
      `-----BEGIN PUBLIC KEY-----\n${this.publicKey}\n-----END PUBLIC KEY-----`,
      'public',
      {
        encryptionScheme: 'pkcs1',
      }
    );
    const dataToEncrypt = Buffer.from(JSON.stringify(payload));
    return rsaKey.encrypt(dataToEncrypt, 'base64', 'utf8');
  }

  signData(fields) {
    const encodedFields = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join('&');

    return crypto.createHash('sha256').update(encodedFields).digest('hex');
  }

  decryptPublic(dataToDecrypt) {
    const rsaKey = new NodeRSA(
      `-----BEGIN PUBLIC KEY-----\n${this.publicKey}\n-----END PUBLIC KEY-----`,
      'public',
      {
        encryptionScheme: 'pkcs1',
      }
    );
    return rsaKey.decryptPublic(dataToDecrypt, 'utf8');
  }

  getDecryptedCallbackNotification(encryptedText) {
    const decryptedText = this.decryptPublic(encryptedText);
    return JSON.parse(decryptedText);
  }
}

module.exports = Telebirr;
