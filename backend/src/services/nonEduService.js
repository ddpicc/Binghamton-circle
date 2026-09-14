const crypto = require('crypto');
const { Op } = require('sequelize');
const { EmailVerificationToken, NonEduEmailRequest } = require('../models');

const TOKEN_TYPE = 'non_edu_onboarding';
const DEFAULT_EXPIRATION_HOURS = parseInt(process.env.NON_EDU_TOKEN_EXPIRATION_HOURS || '24', 10);

const generateRawToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createVerificationToken = async ({ requestId, email, userId = null, transaction }) => {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000);

  await EmailVerificationToken.create({
    request_id: requestId,
    user_id: userId,
    email,
    token_hash: tokenHash,
    type: TOKEN_TYPE,
    expires_at: expiresAt
  }, { transaction });

  return { rawToken, expiresAt };
};

const findValidToken = async (rawToken) => {
  const tokenHash = hashToken(rawToken);

  return EmailVerificationToken.findOne({
    where: {
      token_hash: tokenHash,
      type: TOKEN_TYPE,
      used_at: null,
      expires_at: {
        [Op.gt]: new Date()
      }
    },
    include: [
      {
        model: NonEduEmailRequest,
        as: 'request'
      }
    ]
  });
};

const markTokenUsed = async (tokenInstance, transaction) => {
  if (!tokenInstance) return;
  tokenInstance.used_at = new Date();
  await tokenInstance.save({ transaction });
};

const invalidateTokensForRequest = async (requestId, transaction) => {
  await EmailVerificationToken.update(
    { used_at: new Date() },
    {
      where: {
        request_id: requestId,
        used_at: null
      },
      transaction
    }
  );
};

module.exports = {
  TOKEN_TYPE,
  DEFAULT_EXPIRATION_HOURS,
  generateRawToken,
  hashToken,
  createVerificationToken,
  findValidToken,
  markTokenUsed,
  invalidateTokensForRequest
};
