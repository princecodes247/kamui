import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { createEvent, Event, EventListener, EventMetadata } from "../core/event-bus";

export function createEventEmitter(events: Event[]) {
  const emitter = new EventEmitter();

  function on<T extends any[]>(eventName: string, listener: EventListener<T>) {
    emitter.on(eventName, (...args: T) => {
      const eventMetadata: EventMetadata = {
        eventId: randomUUID(),
        timestamp: Date.now(),
        name: eventName,
      };
      listener(eventMetadata, ...args);
    });
  }

  function off<T extends any[]>(eventName: string, listener: (event: EventMetadata) => void) {
    emitter.off(eventName, listener);
  }

  function emit<T extends any[]>(eventName: string, ...args: T) {
    emitter.emit(eventName, ...args);
  }

  // Initialize event listeners
  for (const event of events) {
    event.listeners.forEach(listener => on(event.name, listener));
  }

  return {
    on,
    off,
    emit
  };
}
