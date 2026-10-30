import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 22050;
const directory = new URL("../public/sounds/v2/", import.meta.url);

function tone(start, duration, frequency, options = {}) {
  return {
    start,
    duration,
    frequency,
    to: frequency,
    amplitude: 1,
    decay: 5,
    partials: [[1, 1]],
    ...options,
  };
}

function noise(start, duration, options = {}) {
  return {
    start,
    duration,
    noise: true,
    cutoff: 1600,
    amplitude: 0.5,
    decay: 3,
    ...options,
  };
}

const wood = [
  [1, 1],
  [2.76, 0.3],
  [5.4, 0.08],
];
const bell = [
  [1, 1],
  [2.4, 0.35],
  [5.95, 0.12],
];
const sounds = {
  "toggle-on": {
    duration: 0.09,
    layers: [
      noise(0, 0.018, { highpass: true }),
      tone(0.008, 0.07, 1250, { partials: wood }),
    ],
  },
  "toggle-off": {
    duration: 0.095,
    layers: [
      noise(0, 0.025, { cutoff: 650 }),
      tone(0.005, 0.08, 380, { to: 180, decay: 8 }),
    ],
  },
  "dialog-open": {
    duration: 0.16,
    layers: [
      noise(0, 0.13, { reverse: true, highpass: true, amplitude: 0.3 }),
      tone(0.025, 0.1, 620, {
        to: 1450,
        partials: [
          [1, 1],
          [2, 0.15],
        ],
      }),
    ],
  },
  "dialog-close": {
    duration: 0.1,
    layers: [
      noise(0, 0.07, { cutoff: 900 }),
      tone(0, 0.09, 260, { to: 90, decay: 7 }),
    ],
  },
  "link-hover": {
    duration: 0.06,
    level: 0.08,
    layers: [
      tone(0, 0.06, 840, {
        partials: [
          [1, 1],
          [3, 0.12],
        ],
        decay: 8,
      }),
    ],
  },
  "link-activate": {
    duration: 0.075,
    layers: [
      noise(0, 0.018, { highpass: true }),
      tone(0.008, 0.055, 490, { partials: wood, decay: 9 }),
    ],
  },
  success: {
    duration: 0.18,
    layers: [
      tone(0, 0.17, 660, { partials: bell }),
      tone(0.035, 0.14, 830),
      tone(0.07, 0.11, 990),
    ],
  },
  "card-hover": {
    duration: 0.085,
    level: 0.1,
    layers: [tone(0, 0.085, 360, { partials: wood, decay: 7 })],
  },
  "card-open": {
    duration: 0.14,
    layers: [
      noise(0, 0.12, { cutoff: 2600, highpass: true, reverse: true }),
      noise(0.07, 0.06, { cutoff: 900 }),
    ],
  },
  "tag-hover": {
    duration: 0.055,
    level: 0.08,
    layers: [tone(0, 0.055, 1600, { to: 650, decay: 9 })],
  },
  "tag-select": {
    duration: 0.08,
    layers: [
      tone(0, 0.08, 280, { to: 1100, decay: 7 }),
      noise(0, 0.012, { amplitude: 0.15 }),
    ],
  },
  "page-previous": {
    duration: 0.17,
    layers: [
      noise(0, 0.15, { cutoff: 1100, reverse: true }),
      noise(0.09, 0.08, { cutoff: 3500, highpass: true }),
      tone(0.02, 0.1, 400, { to: 180, amplitude: 0.15 }),
    ],
  },
  "page-next": {
    duration: 0.19,
    layers: [
      noise(0, 0.11, { cutoff: 3500, highpass: true }),
      noise(0.06, 0.13, { cutoff: 1100, reverse: true }),
      tone(0.03, 0.13, 180, { to: 400, amplitude: 0.15 }),
    ],
  },
  "social-hover": {
    duration: 0.11,
    level: 0.08,
    layers: [tone(0, 0.11, 1320, { partials: bell, decay: 7 })],
  },
  "external-open": {
    duration: 0.125,
    layers: [tone(0, 0.08, 740, { partials: bell }), tone(0.035, 0.09, 1110)],
  },
  "anchor-jump": {
    duration: 0.065,
    layers: [
      noise(0, 0.015, { highpass: true }),
      noise(0.035, 0.025, { cutoff: 800 }),
    ],
  },
  "coffee-open": {
    duration: 0.26,
    layers: [
      tone(0, 0.1, 650, { to: 160, decay: 4 }),
      tone(0.07, 0.11, 820, { to: 210, decay: 4 }),
      tone(0.15, 0.11, 1100, { to: 280, decay: 4 }),
    ],
  },
  "share-open": {
    duration: 0.22,
    layers: [
      tone(0, 0.13, 520, { partials: bell }),
      tone(0.045, 0.13, 780, { partials: bell }),
      tone(0.09, 0.13, 1040, { partials: bell }),
    ],
  },
  "search-select": {
    duration: 0.105,
    layers: [
      tone(0, 0.105, 1760, { partials: bell }),
      noise(0, 0.014, { amplitude: 0.15 }),
    ],
  },
  "form-submit": {
    duration: 0.23,
    layers: [
      noise(0, 0.2, { highpass: true, reverse: true, amplitude: 0.3 }),
      tone(0.05, 0.18, 320, { to: 1300, amplitude: 0.5, decay: 2 }),
    ],
  },
  "update-start": {
    duration: 0.24,
    layers: [tone(0, 0.09, 330), tone(0.06, 0.1, 440), tone(0.13, 0.11, 660)],
  },
};

await mkdir(directory, { recursive: true });
for (const [name, { duration, level = 0.22, layers }] of Object.entries(
  sounds,
)) {
  const count = Math.round(sampleRate * duration);
  const samples = new Float64Array(count);
  for (const [index, layer] of layers.entries()) {
    const length = Math.round(sampleRate * layer.duration);
    const offset = Math.round(sampleRate * layer.start);
    let phase = 0;
    let filtered = 0;
    let seed = index + 1;
    const alpha = layer.noise
      ? 1 - Math.exp((-2 * Math.PI * layer.cutoff) / sampleRate)
      : 0;
    for (let i = 0; i < length && offset + i < count; i++) {
      const progress = i / (length - 1);
      let value;
      if (layer.noise) {
        // Seeded noise keeps the generated assets byte-for-byte reproducible.
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const white = seed / 0x80000000 - 1;
        filtered += alpha * (white - filtered);
        value = layer.highpass ? white - filtered : filtered;
      } else {
        phase +=
          (2 *
            Math.PI *
            (layer.frequency + (layer.to - layer.frequency) * progress)) /
          sampleRate;
        value = layer.partials.reduce(
          (sum, [ratio, amplitude]) =>
            sum + Math.sin(phase * ratio) * amplitude,
          0,
        );
      }
      const time = layer.reverse ? 1 - progress : progress;
      const envelope =
        Math.min(1, (progress * layer.duration) / 0.002) *
        Math.min(1, ((1 - progress) * layer.duration) / 0.012) *
        Math.exp(-layer.decay * time);
      samples[offset + i] += value * envelope * layer.amplitude;
    }
  }
  const peak = samples.reduce(
    (maximum, value) => Math.max(maximum, Math.abs(value)),
    0,
  );
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    buffer.writeInt16LE(
      Math.round((samples[i] / peak) * level * 32767),
      44 + i * 2,
    );
  }
  await writeFile(new URL(`${name}.wav`, directory), buffer);
}
