import jwt, { verify } from 'jsonwebtoken';
import { loggers } from 'winston';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '1d'; // Token expiration time(

export const generateToken = payload => {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      loggers.error('Error generating token:', error);
      throw error;
    }
  };

  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      loggers.error('Error verifying token:', error);
      throw error;
    }
  };
};
