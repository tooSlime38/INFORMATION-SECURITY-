import type { TokenPayload } from './index.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
