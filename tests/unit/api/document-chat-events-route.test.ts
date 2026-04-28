import { afterEach, vi } from "vitest";

const requireApiSessionMock = vi.hoisted(() => vi.fn());
const getDocumentForUserMock = vi.hoisted(() => vi.fn());
const subscribeToDocumentChatEventsMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth/session", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/lib/services/documents/repository", () => ({
  getDocumentForUser: getDocumentForUserMock,
}));

vi.mock("@/lib/services/documents/chat", () => ({
  subscribeToDocumentChatEvents: subscribeToDocumentChatEventsMock,
}));

import { GET } from "@/app/api/documents/[id]/chat/events/route";

describe("GET /api/documents/[id]/chat/events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cleans up once when an aborted SSE stream is already canceled", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const abortController = new AbortController();
    let resolveSubscriptionClose: (() => void) | undefined;
    const closeSubscriptionMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubscriptionClose = resolve;
        }),
    );

    requireApiSessionMock.mockResolvedValue({
      user: {
        id: 7,
        email: "chat@example.com",
        role: "user",
      },
    });
    getDocumentForUserMock.mockResolvedValue({
      id: 11,
      ownerId: 7,
    });
    subscribeToDocumentChatEventsMock.mockResolvedValue({
      close: closeSubscriptionMock,
    });

    const response = await GET(
      new Request("http://localhost/api/documents/11/chat/events", {
        signal: abortController.signal,
      }),
      { params: Promise.resolve({ id: "11" }) },
    );

    expect(response.status).toBe(200);
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("Expected SSE response body.");
    }

    const connected = await reader.read();

    expect(new TextDecoder().decode(connected.value)).toContain(
      "event: chat.connected",
    );

    abortController.abort();
    await vi.waitFor(() => expect(closeSubscriptionMock).toHaveBeenCalledTimes(1));

    await reader.cancel();
    resolveSubscriptionClose?.();
    await vi.waitFor(() => expect(consoleErrorSpy).not.toHaveBeenCalled());

    expect(closeSubscriptionMock).toHaveBeenCalledTimes(1);
  });
});
