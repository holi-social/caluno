import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { NotificationEventPayloadMap } from './notification-event-map';
import type { NotificationEvent } from './notification-events';

@Injectable()
export class TypedNotificationEmitter {
  constructor(private readonly emitter: EventEmitter2) {}

  emit<T extends NotificationEvent>(
    event: T,
    payload: NotificationEventPayloadMap[T],
  ): void {
    this.emitter.emit(event, payload);
  }
}
