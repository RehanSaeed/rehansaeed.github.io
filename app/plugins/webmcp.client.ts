import type { BlogModelContext, registerBlogTools } from "~/framework/webmcp";

let dispose: (() => void) | undefined;

export default defineNuxtPlugin(() => {
  const page: Document & { readonly modelContext?: BlogModelContext } =
    document;
  if (typeof page.modelContext?.registerTool !== "function") {
    return;
  }
  const router = useRouter();
  const siteUrl = useAppConfig().site.url;
  let disposed = false;
  let registration: ReturnType<typeof registerBlogTools>;
  dispose = () => {
    disposed = true;
    registration?.dispose();
  };
  void Promise.all([import("~/framework/webmcp"), import("~/framework/search")])
    .then(([{ registerBlogTools }, { siteSearch }]) => {
      if (disposed) {
        return;
      }
      registration = registerBlogTools(page, {
        search: siteSearch,
        siteUrl,
        routePath: () => router.currentRoute.value.path,
      });
      return registration?.ready;
    })
    .catch((error: unknown) => {
      console.error("Unable to register blog WebMCP tools", error);
    });
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => dispose?.());
}
