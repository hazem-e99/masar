import 'dotenv/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { corsOriginCallback } from '../../config/cors';

@WebSocketGateway({
  cors: {
    origin: corsOriginCallback,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/tracking',
})
export class BusTrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BusTrackingGateway');

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use((client, next) => {
      const header = client.handshake.headers?.authorization;
      const headerToken = typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : undefined;
      const token = client.handshake.auth?.token || headerToken;
      if (!token || typeof token !== 'string') {
        next(new Error('Unauthorized'));
        return;
      }
      try {
        client.data.user = this.jwtService.verify(token);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
    this.logger.log('Bus Tracking WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    if (!client.data?.user) {
      client.disconnect(true);
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitLocationUpdate(payload: {
    busId: number;
    latitude: number;
    longitude: number;
    speed: number;
    driverId: string;
    timestamp: string;
  }) {
    this.server.emit('bus-location-update', payload);
  }

  emitTrackingStopped(payload: { busId: number; driverId: string }) {
    this.server.emit('bus-tracking-stopped', payload);
  }
}
