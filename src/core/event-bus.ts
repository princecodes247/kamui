import { randomUUID } from "node:crypto";

export type EventMetadata = {
  eventId: string;
  timestamp: number;
  name: string;
};

export type MergeListenerArgs<T extends any[]> = T[number] extends (...args: any[]) => any
  ? Parameters<T[number]>
  : T extends (infer U)[] ? U : never;

export type EventListener<T> = (
  ...args: T extends any[] ? T : [T]
) => void;

export type EventListenerArgs<T> = T extends EventListener<infer U> 
  ? U extends [EventMetadata, ...infer Rest] 
    ? Rest 
    : U 
  : never;

// Helper type to extract parameter names and types as an object
export type FunctionArgsAsObject<T extends (...args: any[]) => any> = 
  T extends (...args: infer P) => any 
    ? P extends [EventMetadata, ...infer Rest]
      ? Rest extends [infer First]
        ? First // If only one argument is left, return it directly
        : Rest extends Record<string, any>[]
        ? Rest[0] // If it's an object already, return it directly
        : { [K in keyof Rest]: Rest[K] } // Map positional arguments to an object
      : {}
    : never;

// Main type that extracts argument names properly
export type EventListenerArgsAsObject<T> = 
  T extends EventListener<infer U> 
    ? U extends [...infer Params] 
      ? Params extends [EventMetadata, ...infer Rest] 
        ? FunctionArgsAsObject<(...args: Rest) => void> 
        : never
      : never
    : never;
export type ExtendedEventListener<T> = (
    metadata: EventMetadata,
  ...args: T extends any[] ? T : [T]
  ) => void;

export type Event<T> = {
  listeners: EventListener<T>[];
};

export function createEvent<T>(
  listeners: EventListener<T>[] = []
): ExtendedEventListener<T>[] {
  const res = (metadata: EventMetadata, ...args: T extends any[] ? T : [T]) => {
    listeners.forEach(listener => listener(...args));
  };
  return [res]
}
export function createEventBus<T extends Record<string, ExtendedEventListener<any>[]>>(
  events: { [K in keyof T]: T[K] }
) {
  const eventRegistry: { [K in keyof T]?: Set<ExtendedEventListener<T[K]>> } = {};

  for (const key in events) {
    eventRegistry[key] = new Set(Object.values(events));
  }

  const on = <K extends keyof T>(
    eventName: K,
    listener: EventListener<T[K]>
  ) => {
    if (!eventRegistry[eventName]) {
      eventRegistry[eventName] = new Set();
    }
    const wrappedListener = (metadata: EventMetadata,...args: T[K]) => {
      listener(...args);
    };
    eventRegistry[eventName]!.add(wrappedListener as ExtendedEventListener<T[K]>);
  };

  const off = <K extends keyof T>(
    eventName: K,
    listener: ExtendedEventListener<T[K]>
  ) => {
    eventRegistry[eventName]?.delete(listener);
  };

  const emit = <K extends keyof T>(eventName: K, args: EventListenerArgsAsObject<T[K][number]>) => {
    const eventMetadata: EventMetadata = {
      eventId: randomUUID(),
      timestamp: Date.now(),
      name: eventName as string,
    };
    eventRegistry[eventName]?.forEach((listener) => listener(eventMetadata, ...args));
  };

  return { on, off, emit };
}