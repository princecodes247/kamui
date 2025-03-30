import { describe, it, expect, vi } from "vitest";
import { createEvent, createEventBus } from "../src/core/event-bus";

describe("EventBus", () => {
  it("should emit an event and call all listeners", () => {
    const listener = vi.fn();
    const event = createEvent("", [listener]);
    const bus = createEventBus({"guild.created": [listener]});

    bus.emit("guild.created", "guild123");

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      eventId: expect.any(String),
      name: expect.any(String),
      timestamp: expect.any(Number),
    }, "guild123");
  });

  it("should allow removing listeners", () => {
    const listener = (arg: string, arg2: string) => {};
    const event = createEvent([listener]);
    const bus = createEventBus({"team.joined": event});

    // bus.off("team.joined", listener);
    bus.emit("team.joined", [true, "member456"]);

    expect(listener).not.toHaveBeenCalled();
  });
});
