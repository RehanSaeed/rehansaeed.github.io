// Dependency-free so nuxt.config.ts can import it.

/** URL prefix for co-located post images. */
export const contentImagesBaseURL = "/content-images";

/**
 * A public root (relative to rootDir) holding only the copied post images, under contentImagesBaseURL.
 * Registered in @nuxt/image's `dirs` so IPX can resize them. Never point this at .data itself, which
 * holds the content database.
 */
export const contentPublicDir = ".data/content-public";
