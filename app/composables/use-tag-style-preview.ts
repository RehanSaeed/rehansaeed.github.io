export const useTagStylePreview = () =>
  useState<"code-token" | "tag-shaped">(
    "tag-style-preview",
    () => "code-token",
  );
