import { describe, it, expect, vi } from "vitest";
import { createEvent, createEventBus } from "../src/core/event-bus";

describe("EventBus", () => {
  it("should emit an event and call all listeners", () => {
    const listener = vi.fn((_data: {}) => {});
    const event = createEvent(listener);
    const bus = createEventBus({ "guild.created": event });

    bus.emit("guild.created", {});

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      {},
      {
        eventId: expect.any(String),
        name: expect.any(String),
        timestamp: expect.any(Number),
      }
    );
  });

  it("should allow removing listeners", () => {
    const listener = vi.fn((_data: { arg: string; form: boolean }) => {});
    const event = createEvent(listener);
    let bus = createEventBus({ "team.joined": event })
      .off("team.joined")
      // @ts-expect-error
      .off("team.joined");

    // @ts-expect-error
    bus.emit("team.joined", { arg: "test", form: false });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle multiple listeners for the same event", () => {
    const listener1 = vi.fn((data: { arg: boolean }) => {
      return data;
    });
    const listener2 = vi.fn((data: { arg: boolean; arg2: string }) => {
      return data;
    });

    const listener3 = vi.fn(
      (data: { arg: boolean; arg2: string; arg3?: string }) => {
        return data;
      }
    );
    const event = createEvent(listener1, listener2, listener3);
    const bus = createEventBus({ "user.login": event, "user.created": event });

    bus.emit("user.created", {
      arg: true,
      arg2: "",
      arg3: "",
    });
    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
  });

  it("should not call listeners for non-existent events", () => {
    const listener = vi.fn();
    const event = createEvent(listener);
    const bus = createEventBus({ "message.sent": event });

    //@ts-expect-error
    bus.emit("message.received", { test: "Hello" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("should allow dynamically adding listeners with on()", () => {
    const listener = vi.fn((_: { test: string }) => undefined);
    const event = createEvent(listener);
    const bus = createEventBus({}).on("notification.new", event);

    bus.emit("notification.new", { test: "New message" });

    expect(listener).toHaveBeenCalledOnce();
  });

  it("should pass correct event metadata to listeners", () => {
    const listener = vi.fn((_: { id: number; value: string }) => undefined);
    const event = createEvent(listener);
    const bus = createEventBus({ "data.updated": event });

    bus.emit("data.updated", { id: 1, value: "test" });

    expect(listener).toHaveBeenCalledWith(
      { id: 1, value: "test" },
      expect.objectContaining({
        eventId: expect.any(String),
        name: "data.updated",
        timestamp: expect.any(Number),
      })
    );
  });

  it("should handle events with multiple arguments", () => {
    const listener = vi.fn(
      (data: {
        orderId: string;
        status: "shipped" | "in_transit";
        isPaid: boolean;
      }) => {}
    );
    const event = createEvent(listener);
    const bus = createEventBus({ "order.status": event });

    const mockRes = {
      orderId: "order123",
      status: "shipped",
      isPaid: true,
    } as const;
    bus.emit("order.status", mockRes);

    expect(listener).toHaveBeenCalledWith(mockRes, expect.any(Object));
  });

  describe("getListenerCount", () => {
    it("should return correct count for initial and added listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const bus = createEventBus({ test: [listener1, listener2] });

      expect(bus.getListenerCount("test")).toBe(2);

      bus.on("test", [vi.fn()]);
      expect(bus.getListenerCount("test")).toBe(3);
    });

    it("should return 0 after removing all listeners", () => {
      const listener = vi.fn();
      const bus = createEventBus({ test: [listener] });

      expect(bus.getListenerCount("test")).toBe(1);
      bus.off("test");
      expect(bus.getListenerCount("test")).toBe(0);
    });

    // it("should work with custom adapter", () => {
    //   const adapter = new NodeEventsAdapter();
    //   const bus = createEventBus({ test: [vi.fn()] }, adapter);

    //   expect(bus.getListenerCount("test")).toBe(1);
    //   bus.off("test");
    //   expect(bus.getListenerCount("test")).toBe(0);
    // });
  });
});
