import { TokenPayload } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
