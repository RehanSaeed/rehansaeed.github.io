<template>
  <aside class="thumbnail-options">
    <h2 class="thumbnail-options__title">General</h2>
    <section class="thumbnail-options__section">
      <fieldset class="thumbnail-options__fieldset">
        <label class="thumbnail-options__label">background</label>
        <input
          class="thumbnail-options__input"
          placeholder="none|light|dark|/images/hero/Code-1600x900.jpg"
          :value="background"
          @input="$emit('update:background', $event.target.value)" />
      </fieldset>
    </section>

    <h2 class="thumbnail-options__title">Title</h2>
    <ul>
      <li><em>title</em> - Title</li>
      <li><em>subtitle</em> - Subtitle</li>
      <li><em>title-font-size</em> - 5</li>
      <li><em>title-justify</em> - start, center, end</li>
      <li><em>title-align</em> - start, center, end</li>
      <li><em>title-width</em> - 300</li>
    </ul>

    <h2 class="thumbnail-options__title">Logo</h2>
    <ul>
      <li><em>logo</em></li>
      <li><em>logo-justify</em> - start, center, end</li>
      <li><em>logo-align</em> - start, center, end</li>
    </ul>

    <h2 class="thumbnail-options__title">Image 1</h2>
    <ul>
      <li><em>image1</em> - /images/hero/Code-1600x900.jpg</li>
      <li><em>image1-rotate</em> - 0-360</li>
      <li><em>image1-width</em> - 600</li>
      <li><em>image1-height</em> - 600</li>
      <li><em>image1-x</em> - 950</li>
      <li><em>image1-y</em> - 200</li>
    </ul>

    <h2 class="thumbnail-options__title">Image 2</h2>
    <ul>
      <li><em>image2</em> - /images/hero/Code-1600x900.jpg</li>
      <li><em>image2-rotate</em> - 0-360</li>
      <li><em>image2-width</em> - 600</li>
      <li><em>image2-height</em> - 600</li>
      <li><em>image2-x</em> - 950</li>
      <li><em>image2-y</em> - 200</li>
    </ul>
  </aside>
</template>

<script>
export default {
  props: {
    background: {
      required: true,
      type: String,
    },
  },
};
</script>

<style lang="scss">
.thumbnail-options__fieldset {
  display: flex;
  gap: var(--global-space-fluid-2);
}
</style>
