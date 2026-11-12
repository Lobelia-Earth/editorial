import ItemForm from "@/components/itemForm";
import { RENEW_INTERVAL } from "@/hooks/use-item-lock";
import { createStore } from "@/lib/store/createStore";
import { editorialApi } from "@/lib/store/slices/editorialApi";
import {
  EditorialSchemaItemSchema,
  type EditorialDataItem,
} from "@isardsat/editorial-common";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lockOf, stubApi } from "../../test/apiMock";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const pageSchema = EditorialSchemaItemSchema.parse({
  displayName: "Page",
  fields: {
    title: { type: "string", displayName: "Title" },
  },
});

const home: EditorialDataItem = {
  id: "home",
  isDraft: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  title: "Home",
};

const bob = { id: "bob", name: "Bob" };

const getTitle = () =>
  document.querySelector<HTMLInputElement>('input[name="title"]')!;

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error");
});

afterEach(() => {
  // React reports render loops and other render errors through console.error
  expect(consoleError).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderItemForm({ isNew = false } = {}) {
  const store = createStore();
  await store.dispatch(
    editorialApi.util.upsertQueryData("getData", undefined, {
      page: { home },
    }),
  );

  const router = createMemoryRouter(
    [
      {
        path: "/admin/dashboard/page/home",
        element: (
          <ItemForm
            itemType="page"
            fields={pageSchema.fields}
            data={isNew ? undefined : home}
            isNew={isNew}
          />
        ),
      },
      { path: "*", element: <p>Elsewhere</p> },
    ],
    { initialEntries: ["/admin/dashboard/page/home"] },
  );

  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  await screen.findByRole("button", { name: /Save/ });

  return { user, router };
}

describe("ItemForm locking", () => {
  it("locks the item at the first change and saves with the same session", async () => {
    const api = stubApi(home);
    const { user } = await renderItemForm();
    await waitFor(() =>
      expect(api.lockRequests()).toEqual(["GET /api/v1/locks/page/home"]),
    );

    await user.type(getTitle(), "!");
    await waitFor(() =>
      expect(api.lockRequests()).toContain("POST /api/v1/locks/page/home"),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(api.writes()).toHaveLength(1));
    const [lock] = api.fetchMock.mock.calls
      .map(([request]) => request)
      .filter((request) => request.method === "POST");
    const [save] = api.writes();
    expect(save.headers.get("Editorial-Session")).toMatch(/^[0-9a-f]{32}$/);
    expect(save.headers.get("Editorial-Session")).toBe(
      lock.headers.get("Editorial-Session"),
    );
  });

  it("shows who is editing and keeps the form read-only", async () => {
    stubApi(home, (request) =>
      request.method === "GET" && request.url.includes("/locks/")
        ? Response.json(lockOf(bob))
        : undefined,
    );
    await renderItemForm();

    expect(
      await screen.findByText("Bob is editing this item"),
    ).toBeInTheDocument();
    expect(getTitle().closest("form")).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("discards the first change when someone else locked the item first", async () => {
    const api = stubApi(home, (request) =>
      request.method === "POST" && request.url.includes("/locks/")
        ? Response.json({ error: "Locked", lock: lockOf(bob) }, { status: 423 })
        : undefined,
    );
    const { user } = await renderItemForm();

    await user.type(getTitle(), "!");

    expect(
      await screen.findByText("Bob is editing this item"),
    ).toBeInTheDocument();
    expect(getTitle()).toHaveValue("Home");
    expect(api.writes()).toHaveLength(0);
  });

  it("reloads when someone saved since the form was loaded", async () => {
    const api = stubApi(home, (request) =>
      request.method === "GET" && request.url.includes("/data/page/home")
        ? Response.json({ ...home, updatedAt: "2026-01-01T09:00:00.000Z" })
        : undefined,
    );
    const { user } = await renderItemForm();

    await user.type(getTitle(), "!");

    await waitFor(() =>
      expect(api.lockRequests()).toContain("DELETE /api/v1/locks/page/home"),
    );
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining("Someone else saved this item"),
    );
  });

  it("can't save after another tab took the lock", async () => {
    const api = stubApi(home, (request) =>
      request.method === "PATCH"
        ? Response.json({ error: "Locked", lock: lockOf(bob) }, { status: 423 })
        : undefined,
    );
    const { user } = await renderItemForm();

    await user.type(getTitle(), "!");
    await waitFor(() =>
      expect(api.lockRequests()).toContain("POST /api/v1/locks/page/home"),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Your changes can't be saved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bob started editing this item/),
    ).toBeInTheDocument();
    // The text stays, so it can be copied
    expect(getTitle()).toHaveValue("Home!");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("notices a save made while this tab was inactive", async () => {
    let saved = false;
    const api = stubApi(home, (request) => {
      const { pathname } = new URL(request.url);
      // After the lock expired, it is taken again with a new lockedAt
      if (request.method === "POST" && pathname.includes("/locks/") && saved) {
        return Response.json(
          lockOf({ id: "me", name: "Me" }, "2026-01-01T11:00:00.000Z"),
        );
      }
      if (request.method === "GET" && pathname === "/api/v1/data/page/home") {
        return Response.json(
          saved ? { ...home, updatedAt: "2026-01-01T10:30:00.000Z" } : home,
        );
      }
    });
    const { user } = await renderItemForm();
    await user.type(getTitle(), "!");
    await waitFor(() =>
      expect(api.lockRequests()).toContain("POST /api/v1/locks/page/home"),
    );

    // Someone saves while this tab is inactive, then it is used again
    saved = true;
    const now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now + RENEW_INTERVAL + 1);
    await user.type(getTitle(), "?");

    expect(
      await screen.findByText("Your changes can't be saved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Someone else saved this item while you were inactive/),
    ).toBeInTheDocument();
    expect(getTitle()).toHaveValue("Home!?");
  });

  it("releases the lock when leaving the page", async () => {
    const api = stubApi(home);
    const { user, router } = await renderItemForm();
    await user.type(getTitle(), "!");
    await waitFor(() =>
      expect(api.lockRequests()).toContain("POST /api/v1/locks/page/home"),
    );
    // The lock is held once it is checked against the current item
    await waitFor(() =>
      expect(
        api.fetchMock.mock.calls.some(([request]) =>
          request.url.endsWith("/data/page/home?preview=true"),
        ),
      ).toBe(true),
    );

    router.navigate("/admin/dashboard/page");
    await user.click(await screen.findByRole("button", { name: "Leave Page" }));

    await waitFor(() =>
      expect(api.lockRequests()).toContain("DELETE /api/v1/locks/page/home"),
    );
  });

  it("doesn't lock new items", async () => {
    const api = stubApi(home);
    const { user } = await renderItemForm({ isNew: true });

    await user.type(getTitle(), "New");

    expect(api.lockRequests()).toEqual([]);
  });
});
