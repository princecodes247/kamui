# Kamui

A powerful, type-safe event bus system for TypeScript applications with advanced event handling capabilities.

## Features

- 🔒 **Type-safe Event Handling**: Fully typed event system that catches type errors at compile time
- 🚀 **High Performance**: Efficient event dispatching with Set-based listener management
- 🎯 **Event Metadata**: Automatic tracking of event IDs, timestamps, and names
- 🔄 **Flexible Architecture**: Support for both EventBus and EventEmitter patterns
- 🛠 **Extensible Design**: Easy to extend and adapt to different use cases

## Installation

```bash
npm install kamui
# or
yarn add kamui
# or
pnpm add kamui
```

## Usage

### Basic Event Bus Usage

```typescript
import { createEventBus, ExtendedEventListener } from 'kamui';

// Define your event types
type UserEvents = {
  'user:created': ExtendedEventListener<{ id: string; name: string }>[];
  'user:updated': ExtendedEventListener<{ id: string; changes: Record<string, any> }>[];
};

// Create event bus instance
const eventBus = createEventBus<UserEvents>({
  'user:created': [],
  'user:updated': []
});

// Emit an event
eventBus.emit('user:created', { 
  id: '123', 
  name: 'John Doe' 
});
```

### Using Event Creator

```typescript
import { createEvent } from 'kamui';

type UserCreatedPayload = { id: string; name: string };

const userCreatedListeners = createEvent<UserCreatedPayload>(
  (payload, metadata) => {
    console.log(`User created: ${payload.name} at ${metadata?.timestamp}`);
  }
);
```

### Event Emitter Adapter

```typescript
import { createEventEmitter } from 'kamui';

const events = [
  {
    name: 'userCreated',
    listeners: [(metadata, payload) => console.log(payload)]
  }
];

const emitter = createEventEmitter(events);
emitter.emit('userCreated', { id: '123', name: 'John Doe' });
```

## API Reference

### EventBus

- `createEventBus<T>(events)`: Creates a new event bus instance
- `emit(eventName, payload)`: Emits an event with the given name and payload
- `getListenerCount(eventName)`: Returns the number of listeners for an event

### EventCreator

- `createEvent<T>(...listeners)`: Creates a new event with the given listeners
- `addListener(listener)`: Adds a new listener to an event
- `getListeners()`: Returns all listeners for an event

### Event Types

- `EventMetadata`: Contains event metadata (id, timestamp, name)
- `EventListener<T>`: Basic event listener type
- `ExtendedEventListener<T>`: Event listener with metadata support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT