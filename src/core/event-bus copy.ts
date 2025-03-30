import { randomUUID } from "node:crypto";

export type EventMetadata = {
  eventId: string;
  timestamp: number;
  name: string;
};

export type EventListener<T> = (
  metadata: EventMetadata,
  ...args: T extends any[] ? T : [T]
) => void;

export type Event<T> = {
  name: string;
  listeners: EventListener<T>[];
};

export function createEvent<T>(
  name: string,
  listeners: EventListener<T>[] = []
): Event<T> {
  return { name, listeners };
}
export function createEventBus<T extends Record<string, EventListener<any>[]>>(
  events: { [K in keyof T]: EventListener<T[K]>[] }
) {
  const eventRegistry: { [K in keyof T]?: Set<EventListener<T[K]>> } = {};

  for (const key in events) {
    eventRegistry[key] = new Set(events[key]);
  }

  const on = <K extends keyof T>(
    eventName: K,
    listener: EventListener<T[K]>
  ) => {
    if (!eventRegistry[eventName]) {
      eventRegistry[eventName] = new Set();
    }
    eventRegistry[eventName]!.add(listener);
  };

  const off = <K extends keyof T>(
    eventName: K,
    listener: EventListener<T[K]>
  ) => {
    eventRegistry[eventName]?.delete(listener);
  };

  const emit = <K extends keyof T>(eventName: K, ...args: T[K]) => {
    const eventMetadata: EventMetadata = {
      eventId: randomUUID(),
      timestamp: Date.now(),
      name: eventName as string,
    };
    eventRegistry[eventName]?.forEach((listener) => listener(eventMetadata, ...args));
  };

  return { on, off, emit };
}