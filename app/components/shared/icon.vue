<template>
  <NuxtIcon
    :name="name"
    class="icon"
    :class="{ 'icon--inline': inline }"
    aria-hidden="true" />
</template>

<script setup lang="ts">
import { NuxtIcon } from "#components";

defineOptions({ name: "u-icon" });

defineProps<{
  name: string;
  inline?: boolean;
}>();
</script>

<style scoped>
/*!
 * Icon artwork is provided through Iconify, resized and recoloured by this site.
 * Brand names and logos remain their owners' trademarks.
 *
 * Font Awesome 5 Brands, Regular and Solid by Dave Gandy / Fonticons, Inc.
 * https://github.com/FortAwesome/Font-Awesome
 * CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
 *
 * Simple Icons by Simple Icons Contributors
 * https://github.com/simple-icons/simple-icons
 * CC0: https://creativecommons.org/publicdomain/zero/1.0/
 *
 * Feather Icons: https://github.com/feathericons/feather
 * Copyright (c) 2013-2023 Cole Bemis
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Lucide: https://github.com/lucide-icons/lucide
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * ISC License
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
.icon {
  display: block;
  inline-size: 1em;
  block-size: 1em;
}

.icon--inline {
  display: inline;
}
</style>
