import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class NotificationsService {
  private log = new Logger('Notifications');
  constructor(private prisma: PrismaService) {}

  /** Stores an in-app notification and best-effort sends an Expo push. */
  async notify(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const n = await this.prisma.notification.create({ data: { userId, title, body, data: (data ?? undefined) as never } });
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    if (user?.pushToken?.startsWith('ExponentPushToken')) {
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ to: user.pushToken, title, body, data, sound: 'default' }),
      }).catch((e) => this.log.warn(`push failed: ${e}`));
    }
    return n;
  }
}
