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
      <div style="display: flex; flex-direction: column; gap: 24px">
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
      </div>
      <div
        style="
          display: flex;
          align-self: flex-start;
          align-items: center;
          gap: 24px;
          padding: 20px 24px;
          border-radius: 8px;
          background: #ffffff;
          color: #242424;
        ">
        <img
          src="/images/author/Muhammad-Rehan-Saeed/Logo.svg"
          alt=""
          width="76"
          height="76"
          style="flex-shrink: 0; border-radius: 50%" />
        <div
          style="
            width: 6px;
            height: 76px;
            flex-shrink: 0;
            background: #6b17e8;
          " />
        <div
          style="
            display: flex;
            flex-direction: column;
            gap: 4px;
            line-height: 1.2;
          ">
          <div style="font-size: 40px">{{ author }}</div>
          <div style="font-size: 24px; color: #6f6f6f">RehanSaeed.com</div>
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
