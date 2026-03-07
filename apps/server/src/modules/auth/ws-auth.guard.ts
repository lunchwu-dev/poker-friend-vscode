import { Socket } from 'socket.io';
import { AuthService, JwtPayload } from './auth.service';

export interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

export function createWsAuthMiddleware(authService: AuthService) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    (socket as AuthenticatedSocket).user = payload;
    next();
  };
}
