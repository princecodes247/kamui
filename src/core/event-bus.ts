import { randomUUID } from "node:crypto";
import { ArrayToSet, ExtractFromSet, MergeFunctionParameters, TupleToObject } from "./type-helpers";

export type EventMetadata = {
  eventId: string;
  timestamp: number;
  name: string;
};

export type EventListener<T> = (
  payload: T
) => void;

export type ExtendedEventListener<T> = (
  payload: T,
  metadata?: EventMetadata,
) => void;

export type EventListenerArgs<T> = T extends EventListener<infer U> ? U : never;

type EventRegistry<Key extends string | number | symbol, Listeners extends ExtendedEventListener<any>[], IsActive extends boolean> = {
  [K in Key]: {
    isActive: IsActive
    listeners: ArrayToSet<Listeners>
  }
}

type ActiveEventKeys<T extends Readonly<EventRegistry<any, any, any>>> = {
  [K in keyof T as T[K]['isActive'] extends true ? K : never]: T[K]
};

type TestReg = EventRegistry<"test", [], false>
type TestActive = ActiveEventKeys<TestReg>

export type Event<T extends Record<string, any>> = {
  listeners: EventListener<T>[];
};



export class EventCreator<T extends MergeFunctionParameters<any>> {
  private listeners: ExtendedEventListener<T>[];

  constructor(listeners: ExtendedEventListener<T>[] = []) {
    this.listeners = listeners;
  }

  public create(): ExtendedEventListener<T>[] {
    return this.listeners.map(listener =>
      (payload: T, metadata?: EventMetadata) =>
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

export function createEvent<T extends MergeFunctionParameters<any>>(
  ...listeners: ExtendedEventListener<T>[]
): ExtendedEventListener<T>[] {
  return new EventCreator(listeners).create();
}

export class EventBus<
  TEvents extends Record<string, ExtendedEventListener<any>[]>,
  K extends keyof TEvents,
  Listeners extends ExtendedEventListener<any>[]
> {

  constructor(events: TEvents, private eventRegistry: EventRegistry<keyof TEvents, Listeners, any> = {} as EventRegistry<keyof TEvents, Listeners, true>) {
    for (const key in events) {
      this.eventRegistry[key] = {
        isActive: true,
        listeners: new Set(events[key]) as ArrayToSet<Listeners>,
      }
    }
  }

  // public on<K extends keyof T>(eventName: K, listener: EventListener<T[K]>): void {
  //   if (!this.eventRegistry[eventName]) {
  //     this.eventRegistry[eventName] = new Set();
  //   }
  //   const wrappedListener = (metadata: EventMetadata, payload: T[K]) => {
  //     listener(payload);
  //   };
  //   this.eventRegistry[eventName]!.add(wrappedListener as ExtendedEventListener<T[K]>);
  // }

  public off(eventName: keyof typeof this.eventRegistry): void {
    // public off(eventName: ActiveEventKeys<Readonly<typeof this.eventRegistry>>): void {
    this.eventRegistry[eventName] = {
      isActive: false,
      listeners: new Set() as ArrayToSet<Listeners>,
    };
  }

  public emit(eventName: keyof typeof this.eventRegistry, payload: EventListenerArgs<ExtractFromSet<typeof this.eventRegistry[keyof TEvents]["listeners"]>>): void {
    const eventMetadata: EventMetadata = {
      eventId: randomUUID(),
      timestamp: Date.now(),
      name: eventName as string,
    };
    this.eventRegistry[eventName]?.listeners.forEach((listener) => {
      listener(payload, eventMetadata)
    });
    this.eventRegistry[eventName]?.listeners.values().toArray()
  }

  public getListenerCount(eventName: K): number {
    return this.eventRegistry[eventName]?.listeners.size ?? 0;
  }
}

export function createEventBus<T extends Record<string, ExtendedEventListener<any>[]>>(
  events: { [K in keyof T]: T[K] }
) {
  return new EventBus<T, keyof T, T[keyof T]>(events);
}