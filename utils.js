const Joi = require('joi');

exports.TELEBIRR_H5_URL =
  'https://app.ethiomobilemoney.et:2121/ammapi/payment/service-openup/toTradeWebPay';
exports.TELEBIRR_IN_APP_URL =
  'https://app.ethiomobilemoney.et:2121/ammapi/payment/service-openup/toTradeMobilePay';

exports.APP = 'app';
exports.WEB = 'web';

exports.RETURN_APP = 'com.example.app';
exports.TIMEOUT_EXPRESS = `${24 * 60}`; // 1 day

exports.FAILED_MESSAGE = 'Failed to make payment';

exports.validateBody = (params) => {
  const schema = Joi.object({
    paymentMethod: Joi.string().valid(exports.APP, exports.WEB),
    notifyUrl: Joi.string().uri(),
    receiveName: Joi.string().max(64),
    returnUrl: Joi.string().uri(),
    subject: Joi.string().max(256),
    totalAmount: Joi.number().min(1).max(100000).required(),
  });
  const { error } = schema.validate(params, {
    abortEarly: true,
    errors: {
      wrap: {
        label: false,
      },
    },
  });
  return !error ? null : error.details[0];
};
