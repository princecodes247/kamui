import { EventEmitter } from "node:events";
import { EventListener, EventMetadata, PlatformAdapter } from "../core/event-bus";

export class NodeEventsAdapter implements PlatformAdapter<any> {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  emit(eventName: string, payload: any, metadata: EventMetadata): void {
    this.emitter.emit(eventName, payload, metadata);
  }

  on(eventName: string, listener: EventListener<any>): void {
    this.emitter.on(eventName, listener);
  }

  off(eventName: string): void {
    this.emitter.removeAllListeners(eventName);
  }

  getListenerCount(eventName: string): number {
    return this.emitter.listenerCount(eventName);
  }
}