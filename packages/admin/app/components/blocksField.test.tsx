import ItemForm from "@/components/itemForm";
import { createStore } from "@/lib/store/createStore";
import { editorialApi } from "@/lib/store/slices/editorialApi";
import {
  EditorialSchemaItemSchema,
  type EditorialData,
  type EditorialDataItem,
} from "@isardsat/editorial-common";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// MDXEditor doesn't run in jsdom, see test/mdxeditorMock.tsx
vi.mock("@mdxeditor/editor", () => import("../../test/mdxeditorMock"));

const pageSchema = EditorialSchemaItemSchema.parse({
  displayName: "Page",
  fields: {
    title: { type: "string", displayName: "Title" },
    content: {
      type: "blocks",
      displayName: "Content",
      blocks: {
        text: {
          displayName: "Text",
          fields: {
            heading: { type: "string", displayName: "Heading" },
            body: { type: "markdown", displayName: "Body", optional: true },
          },
        },
        quote: {
          displayName: "Quote",
          fields: {
            quote: { type: "string", displayName: "Quote text" },
            featured: { type: "boolean", displayName: "Featured" },
          },
        },
      },
    },
  },
});

const page = (content: unknown[]): EditorialDataItem => ({
  id: "home",
  isDraft: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  title: "Home",
  content,
});

const existingBlocks = [
  { _block: "text", heading: "Intro", body: "Hello **world**" },
  { _block: "quote", quote: "Be kind", featured: true },
];

const getInput = (name: string) => {
  const input = document.querySelector<HTMLInputElement>(
    `input[name="${name}"]`,
  );
  if (!input) throw new Error(`No input named "${name}"`);
  return input;
};

// Collapse toggles of the blocks, in order. The "Add block" menu button also
// has aria-expanded, but opens a popup.
const getBlockToggles = () =>
  screen
    .getAllByRole("button")
    .filter(
      (button) =>
        button.hasAttribute("aria-expanded") &&
        !button.hasAttribute("aria-haspopup"),
    );

let fetchMock: ReturnType<typeof vi.fn>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // Saving goes through fetch. Echo the request body back as the saved item.
  fetchMock = vi.fn(async (request: Request) =>
    Response.json(await request.clone().json()),
  );
  vi.stubGlobal("fetch", fetchMock);
  consoleError = vi.spyOn(console, "error");
});

afterEach(() => {
  // React reports render loops and other render errors through console.error
  expect(consoleError).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderItemForm(data: EditorialDataItem) {
  const store = createStore();
  const allData: EditorialData = { page: { home: data } };
  // Seed the API cache so nothing is fetched on render
  await store.dispatch(
    editorialApi.util.upsertQueryData("getData", undefined, allData),
  );
  await store.dispatch(
    editorialApi.util.upsertQueryData("getFiles", undefined, []),
  );

  const router = createMemoryRouter(
    [
      {
        path: "/admin/dashboard/page/home",
        element: (
          <ItemForm itemType="page" fields={pageSchema.fields} data={data} />
        ),
      },
    ],
    { initialEntries: ["/admin/dashboard/page/home"] },
  );

  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  // Markdown editors are lazy loaded
  await screen.findByRole("button", { name: "Save" });

  return { user };
}

const getSavedItem = async () => {
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const request = fetchMock.mock.calls[0][0] as Request;
  return {
    method: request.method,
    url: request.url,
    body: await request.json(),
  };
};

describe("ItemForm with a blocks field", () => {
  it("renders existing blocks", async () => {
    await renderItemForm(page(existingBlocks));

    expect(getInput("content.0.heading")).toHaveValue("Intro");
    expect(await screen.findByTestId("mdxeditor")).toHaveValue(
      "Hello **world**",
    );
    expect(getInput("content.1.quote")).toHaveValue("Be kind");
    expect(screen.getByRole("checkbox", { name: "Featured" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("adds each block type through the Add block menu and saves it", async () => {
    const { user } = await renderItemForm(page([]));
    expect(screen.getByText("No blocks yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add block" }));
    await user.click(await screen.findByRole("menuitem", { name: "Text" }));
    await user.click(screen.getByRole("button", { name: "Add block" }));
    await user.click(await screen.findByRole("menuitem", { name: "Quote" }));

    expect(getInput("content.0.heading")).toHaveValue("");
    expect(await screen.findByTestId("mdxeditor")).toHaveValue("");
    expect(getInput("content.1.quote")).toHaveValue("");
    expect(
      screen.getByRole("checkbox", { name: "Featured" }),
    ).not.toBeChecked();

    await user.type(getInput("content.0.heading"), "Welcome");
    await user.type(screen.getByTestId("mdxeditor"), "Some *text*");
    await user.type(getInput("content.1.quote"), "Stay curious");
    await user.click(screen.getByRole("checkbox", { name: "Featured" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = await getSavedItem();
    expect(saved.method).toBe("PATCH");
    expect(saved.url).toBe("http://editorial.test/api/v1/data/page/home");
    expect(saved.body.content).toEqual([
      { _block: "text", heading: "Welcome", body: "Some *text*" },
      { _block: "quote", quote: "Stay curious", featured: true },
    ]);
  });

  it("removes blocks", async () => {
    const { user } = await renderItemForm(page(existingBlocks));

    await user.click(screen.getByRole("button", { name: "Remove Text" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = await getSavedItem();
    expect(saved.body.content).toEqual([
      { _block: "quote", quote: "Be kind", featured: true },
    ]);
  });

  it("shows a plain-text summary of collapsed blocks", async () => {
    const { user } = await renderItemForm(
      page([
        { _block: "text", heading: "", body: "## Hello **world**" },
        ...existingBlocks,
      ]),
    );
    const [first, second] = getBlockToggles();

    await user.click(first);
    await user.click(second);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(first).toHaveTextContent("TextHello world");
    expect(second).toHaveTextContent("TextIntro");

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveTextContent(/^Text$/);
  });

  it("keeps blocks with validation errors open", async () => {
    const { user } = await renderItemForm(page(existingBlocks));

    await user.clear(getInput("content.0.heading"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Heading is required")).toBeInTheDocument();
    const [first] = getBlockToggles();
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks to remove blocks of unknown types before saving", async () => {
    const { user } = await renderItemForm(
      page([...existingBlocks, { _block: "video", url: "v.mp4" }]),
    );

    expect(screen.getByText('Unknown block "video"')).toBeInTheDocument();
    expect(
      screen.getByText('The block type "video" is not defined in the schema.'),
    ).toBeInTheDocument();

    await user.type(getInput("title"), "!");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Unknown block type, remove this block to save"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove video" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = await getSavedItem();
    expect(saved.body.title).toBe("Home!");
    expect(saved.body.content).toEqual(existingBlocks);
  });

  it("does not loop when a block has a markdown field", async () => {
    // Regression: spreading register(name) onto MDXEditor passed a new ref on
    // every render, which inside a field array caused "Maximum update depth
    // exceeded".
    const { user } = await renderItemForm(page(existingBlocks));
    const editor = await screen.findByTestId("mdxeditor");

    await user.type(editor, "!");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(editor).toHaveValue("Hello **world**!");
    expect(
      within(document.body).getByRole("button", { name: "Save" }),
    ).toBeEnabled();
  });
});
