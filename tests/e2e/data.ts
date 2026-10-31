import { z } from "zod";

export function requestUrl(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : input.toString();
}

export const cacheSchema = z.looseObject({ updated: z.number() });

export const dimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
});

const referenceSchema = z.object({ "@id": z.string() });
const schemaNode = z.looseObject({
  "@id": z.string().optional(),
  "@type": z.union([z.string(), z.array(z.string())]).optional(),
  url: z.string().optional(),
  dateModified: z.string().optional(),
  datePublished: z.string().optional(),
  mainEntityOfPage: referenceSchema.optional(),
  author: referenceSchema.optional(),
  image: z
    .union([
      z.array(
        z.looseObject({
          width: z.union([z.number(), z.string()]).optional(),
          height: z.union([z.number(), z.string()]).optional(),
        }),
      ),
      z.string(),
      z.looseObject({}),
    ])
    .optional(),
  itemListElement: z
    .array(z.looseObject({ url: z.string().optional() }))
    .optional(),
});

export const graphSchema = z.object({ "@graph": z.array(schemaNode) });

const iconSchema = z.looseObject({
  src: z.string(),
  sizes: z.string(),
  purpose: z.string().optional(),
});

export const manifestSchema = z.looseObject({
  orientation: z.string().optional(),
  prefer_related_applications: z.boolean().optional(),
  icons: z.array(iconSchema),
  screenshots: z.array(
    z.looseObject({
      src: z.string(),
      sizes: z.string(),
      type: z.string(),
      label: z.string(),
      form_factor: z.string(),
    }),
  ),
  shortcuts: z.array(
    z.looseObject({
      name: z.string(),
      url: z.string(),
      icons: z.array(iconSchema),
    }),
  ),
});

export const workflowSchema = z.object({
  on: z
    .looseObject({
      pull_request: z.object({ types: z.array(z.string()) }),
    })
    .optional(),
  jobs: z.record(
    z.string(),
    z.looseObject({
      if: z.string().optional(),
      steps: z.array(
        z.looseObject({
          name: z.string().optional(),
          id: z.string().optional(),
          with: z
            .looseObject({
              path: z.string().optional(),
              key: z.string().optional(),
              "restore-keys": z.string().optional(),
            })
            .optional(),
        }),
      ),
    }),
  ),
});
