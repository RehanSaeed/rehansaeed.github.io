<template>
  <div
    style="
      position: relative;
      display: flex;
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #0e293a;
      color: #ffffff;
      font-family: Audiowide;
    ">
    <img
      :src="heroImage"
      alt=""
      width="1200"
      height="630"
      style="position: absolute; inset: 0; object-fit: cover" />
    <div
      style="
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(14, 41, 58, 0.55) 0%,
          rgba(14, 41, 58, 0.92) 100%
        );
      " />
    <div
      style="
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px 56px;
        width: 100%;
        height: 100%;
        border-bottom: 12px solid #ccbdff;
      ">
      <div style="display: flex; font-size: 24px; color: #ccbdff">
        RehanSaeed.com
      </div>
      <div
        :style="{
          fontSize: `${title.length > 80 ? 42 : title.length > 50 ? 48 : 56}px`,
          lineHeight: '1.25',
          maxWidth: '1088px',
        }">
        {{ title }}
      </div>
      <div style="display: flex; align-items: center; gap: 20px">
        <img
          src="/images/author/Muhammad-Rehan-Saeed/Logo.svg"
          alt=""
          width="64"
          height="64"
          style="border-radius: 50%" />
        <div style="display: flex; flex-direction: column; gap: 8px">
          <div style="font-size: 24px">{{ author }}</div>
          <div style="font-size: 16px; color: #ccbdff">
            Software Developer · Open Source
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "BlogOgImage" });
defineProps<{
  title: string;
  author: string;
  heroImage: string;
}>();
</script>
