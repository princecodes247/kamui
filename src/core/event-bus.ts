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

  public getListeners() {
    
  }
}

export function createEvent<T>(
  ...listeners: EventListener<T>[]
): EventListener<T>[] {
  return new EventCreator(listeners).create();
}

export class EventBus<TEvents extends Record<string, EventListener<any>[]>> {
  constructor(
    events: TEvents,
    private eventRegistry: EventRegistry<keyof TEvents> = {} as EventRegistry<
      keyof TEvents
    >
  ) {
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
    this.eventRegistry[eventName]?.listeners.forEach((listener) => {
      listener(payload, eventMetadata);
    });
    this.eventRegistry[eventName]?.listeners.values().toArray();
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
      this.eventRegistry[eventName].listeners.add(listener);
    }
    return this as EventBus<Merge<TEvents, { [K in T]: U }>>;
  }

  public off<T extends keyof TEvents>(eventName: T) {
    this.eventRegistry[eventName].listeners.clear();
    return this as EventBus<Pretty<Omit<TEvents, T>>>;
  }

  public getListenerCount<T extends keyof TEvents>(eventName: T): number {
    return this.eventRegistry[eventName].listeners.size;
  }
}

export function createEventBus<
  T extends Record<string, EventListener<any>[]> = {},
>(events: T) {
  return new EventBus(events);
}
