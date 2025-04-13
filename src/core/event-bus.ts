import { randomUUID } from "node:crypto";
import { Merge, Pretty } from "./type-helpers";

export type EventMetadata = {
  eventId: string;
  timestamp: number;
  name: string;
};

export type EventListener<T> = (payload: T, metadata?: EventMetadata) => void;

export type EventListenerArgs<T> = T extends EventListener<infer U> ? U : never;

type EventRegistry<Key extends keyof any> = {
  [K in Key]: {
    isActive: boolean;
    listeners: Set<EventListener<any>>;
  };
};

export class EventCreator<T> {
  constructor(public listeners: EventListener<T>[] = []) {}

  public create(): EventListener<T>[] {
    return this.listeners.map(
      (listener) => (payload: T, metadata?: EventMetadata) =>
        listener(payload, metadata)
    );
  }

  public addListener(listener: EventListener<T>): void {
    this.listeners.push(listener);
  }

  public getListeners(): EventListener<T>[] {
    return [...this.listeners];
  }
}

export function createEvent<T>(
  ...listeners: EventListener<T>[]
): EventListener<T>[] {
  return new EventCreator(listeners).create();
}

export interface PlatformAdapter<T> {
  emit(eventName: string, payload: T, metadata: EventMetadata, eventRegistry?: EventRegistry<any>): void;
  on(eventName: string, listener: EventListener<T>, eventRegistry?: EventRegistry<any>): void;
  off(eventName: string, eventRegistry?: EventRegistry<any>): void;
  getListenerCount(eventName: string, eventRegistry?: EventRegistry<any>): number;
}

export class EventBus<TEvents extends Record<string, EventListener<any>[]>> {
  private adapter: PlatformAdapter<any>;

  constructor(
    events: TEvents,
    adapter?: PlatformAdapter<any>,
    private eventRegistry: EventRegistry<keyof TEvents> = {} as EventRegistry<keyof TEvents>
  ) {
    this.adapter = adapter || new DefaultPlatformAdapter();
    for (const key in events) {
      this.eventRegistry[key] = {
        isActive: true,
        listeners: new Set(events[key]),
      };
    }
  }

  public emit<T extends keyof TEvents>(
    eventName: T,
    payload: EventListenerArgs<TEvents[T][number]>
  ): void {
    const eventMetadata: EventMetadata = {
      eventId: randomUUID(),
      timestamp: Date.now(),
      name: eventName as string,
    };
    this.adapter.emit(eventName as string, payload, eventMetadata, this.eventRegistry);
  }

  public on<T extends string, U extends EventListener<any>[]>(
    eventName: T,
    listeners: U
  ) {
    if (!(eventName in this.eventRegistry)) {
      this.eventRegistry[eventName] = {
        isActive: true,
        listeners: new Set(),
      };
    }
    for (const listener of listeners) {
      this.adapter.on(eventName, listener, this.eventRegistry);
    }
    return this as EventBus<Merge<TEvents, { [K in T]: U }>>;
  }

  public off<T extends keyof TEvents>(eventName: T) {

    this.adapter.off(eventName as string, this.eventRegistry);
    return this as EventBus<Pretty<Omit<TEvents, T>>>;
  }

  public getListenerCount<T extends keyof TEvents>(eventName: T): number {
    return this.adapter.getListenerCount(eventName as string, this.eventRegistry);
  }
}

class DefaultPlatformAdapter implements PlatformAdapter<any> {

  emit(eventName: string, payload: any, metadata: EventMetadata, eventRegistry?: EventRegistry<any>): void {
    if (eventRegistry && eventRegistry[eventName] && eventRegistry[eventName].isActive) {
      eventRegistry[eventName]?.listeners.forEach((listener) => {
        listener(payload, metadata);
      });
    }
  }

  on(eventName: string, listener: EventListener<any>, eventRegistry?: EventRegistry<any>): void {
    if (eventRegistry && eventRegistry[eventName] && eventRegistry[eventName].isActive) {
      eventRegistry[eventName]?.listeners.add(listener);
    }
  }
  off(eventName: string, eventRegistry?: EventRegistry<any>): void {
    if (eventRegistry && eventRegistry[eventName] && eventRegistry[eventName].isActive) {
      eventRegistry[eventName]?.listeners.clear();
    }
  }
  getListenerCount(eventName: string, eventRegistry?: EventRegistry<any>): number {
    if (eventRegistry && eventRegistry[eventName] && eventRegistry[eventName].isActive) {
      return eventRegistry[eventName]?.listeners.size || 0;
    }
    return 0;
  }
}

export function createEventBus<
  T extends Record<string, EventListener<any>[]> = {},
>(events: T) {
  return new EventBus(events);
}
