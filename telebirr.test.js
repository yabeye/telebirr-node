// ! This test may not be completed!

const axios = require('axios');
const crypto = require('crypto');
const NodeRSA = require('node-rsa');

jest.mock('axios');
jest.mock('crypto');
jest.mock('node-rsa');

describe('validateBody', () => {
  const { validateBody } = require('./utils');
  test('returns null if parameters are valid', () => {
    const params = {
      paymentMethod: 'web',
      notifyUrl: 'https://www.example.com/yourapp-webhook',
      receiveName: 'Abebe Kebede',
      returnUrl: 'https://yourwebsite.com',
      subject: 'Test payment',
      totalAmount: 50,
    };
    const result = validateBody(params);
    expect(result).toBeNull();
  });

  test('returns error if parameters are invalid', () => {
    const params = {
      paymentMethod: 'invalid',
      notifyUrl: 'invalid-url',
      receiveName: 'a'.repeat(65),
      returnUrl: 'invalid-url',
      subject: 'a'.repeat(257),
      totalAmount: 0,
    };
    const result = validateBody(params);
    expect(result).toBeDefined();
    expect(result.message).toContain('paymentMethod');
    expect(result.message).toContain('notifyUrl');
    expect(result.message).toContain('receiveName');
    expect(result.message).toContain('returnUrl');
    expect(result.message).toContain('subject');
    expect(result.message).toContain('totalAmount');
  });
});

describe('Telebirr', () => {
  const Telebirr = require('./telebirr');
  const telebirr = new Telebirr({
    appId: 'Test APP Id',
    appKey: 'TEST APP KEY',
    shortCode: 'TEST SHORT CODE',
    publicKey: 'TEST PUBLIC KEY',
  });

  describe('makePayment', () => {
    const payload = {
      paymentMethod: 'web',
      nonce: 'a unique random string ( should be unique for each request )',
      notifyUrl: 'https://www.example.com/yourapp-webhook',
      totalAmount: 10,
      outTradeNo: 'unique identifier (order no)',
      receiveName: 'Abebe Kebede',
      returnApp: 'com.test.app',
      returnUrl: 'https://yourwebsite.com',
      subject: 'payment for',
      timeoutExpress: '120',
    };

    it('should return failed message if validation fails', async () => {
      const error = 'Invalid payload';
      const validateBodySpy = jest
        .spyOn(Telebirr.prototype, 'validateBody')
        .mockImplementation(() => error);

      const result = await telebirr.makePayment(payload);

      expect(validateBodySpy).toHaveBeenCalledWith(payload);
      expect(result).toEqual({
        success: false,
        message: 'Failed to make payment',
        error,
      });

      validateBodySpy.mockRestore();
    });

    it('should return success message if payment is successful', async () => {
      const signDataSpy = jest
        .spyOn(Telebirr.prototype, 'signData')
        .mockImplementation(() => 'testSign');
      const encryptSpy = jest
        .spyOn(Telebirr.prototype, 'encrypt')
        .mockImplementation(() => 'testEncrypt');
      axios.post.mockResolvedValue({ data: { code: 200 } });

      const result = await telebirr.makePayment(payload);

      expect(signDataSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(encryptSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual({
        success: true,
        error: null,
        response: { code: 200 },
      });

      signDataSpy.mockRestore();
      encryptSpy.mockRestore();
    });

    it('should return error message if payment is not successful', async () => {
      const signDataSpy = jest
        .spyOn(Telebirr.prototype, 'signData')
        .mockImplementation(() => 'testSign');
      const encryptSpy = jest
        .spyOn(Telebirr.prototype, 'encrypt')
        .mockImplementation(() => 'testEncrypt');
      axios.post.mockResolvedValue({ data: { code: 400 } });

      const result = await telebirr.makePayment(payload);

      expect(signDataSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(encryptSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual({
        success: false,
        error: { code: 400, message: 'Failed to make payment' },
      });

      signDataSpy.mockRestore();
      encryptSpy.mockRestore();
    });

    it('should return error if axios throws an error', async () => {
      const signDataSpy = jest
        .spyOn(Telebirr.prototype, 'signData')
        .mockImplementation(() => 'testSign');
      const encryptSpy = jest
        .spyOn(Telebirr.prototype, 'encrypt')
        .mockImplementation(() => 'testEncrypt');
      const axiosError = new Error('Network error');
      axios.post.mockRejectedValue(axiosError);

      const result = await telebirr.makePayment(payload);

      expect(signDataSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(encryptSpy).toHaveBeenCalledWith(expect.any(Object));
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual({
        success: false,
        error: axiosError,
      });

      signDataSpy.mockRestore();
      encryptSpy.mockRestore();
    });
  });

  describe('encrypt', () => {
    it('should encrypt data with public key', () => {
      const payload = { test: 'data' };
      const rsaKeyMock = { encrypt: jest.fn() };
      const nodeRSASpy = jest
        .spyOn(Telebirr.prototype, 'NodeRSA')
        .mockImplementation(() => rsaKeyMock);

      const result = telebirr.encrypt(payload);

      expect(nodeRSASpy).toHaveBeenCalledWith(expect.any(String), 'public', {
        encryptionScheme: 'pkcs1',
      });
      expect(rsaKeyMock.encrypt).toHaveBeenCalledWith(
        expect.any(Buffer),
        'base64',
        'utf8'
      );
      expect(result).toEqual('testEncrypt');

      nodeRSASpy.mockRestore();
    });
  });

  describe('signData', () => {
    it('should sign data with sha256', () => {
      const fields = { test: 'data' };
      const cryptoMock = {
        createHash: jest.fn(() => ({
          update: jest.fn(() => ({ digest: jest.fn(() => 'testDigest') })),
        })),
      };
      const cryptoSpy = jest
        .spyOn(Telebirr.prototype, 'crypto')
        .mockImplementation(() => cryptoMock);

      const result = telebirr.signData(fields);

      expect(cryptoSpy).toHaveBeenCalled();
      expect(cryptoMock.createHash).toHaveBeenCalledWith('sha256');
      expect(result).toEqual('testDigest');

      cryptoSpy.mockRestore();
    });
  });

  describe('decryptPublic', () => {
    it('should decrypt data with public key', () => {
      const dataToDecrypt = 'testData';
      const rsaKeyMock = { decryptPublic: jest.fn(() => 'testDecrypt') };
      const nodeRSASpy = jest
        .spyOn(Telebirr.prototype, 'NodeRSA')
        .mockImplementation(() => rsaKeyMock);

      const result = telebirr.decryptPublic(dataToDecrypt);

      expect(nodeRSASpy).toHaveBeenCalledWith(expect.any(String), 'public', {
        encryptionScheme: 'pkcs1',
      });
      expect(rsaKeyMock.decryptPublic).toHaveBeenCalledWith(
        dataToDecrypt,
        'utf8'
      );
      expect(result).toEqual('testDecrypt');

      nodeRSASpy.mockRestore();
    });
  });

  describe('getDecryptedCallbackNotification', () => {
    it('should decrypt and parse callback notification', () => {
      const encryptedText = 'testEncryptedText';
      const decryptPublicSpy = jest
        .spyOn(Telebirr.prototype, 'decryptPublic')
        .mockImplementation(() => '{"test":"data"}');

      const result = telebirr.getDecryptedCallbackNotification(encryptedText);

      expect(decryptPublicSpy).toHaveBeenCalledWith(encryptedText);
      expect(result).toEqual({ test: 'data' });

      decryptPublicSpy.mockRestore();
    });
  });
});
