import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 22050;
const directory = new URL("../public/sounds/v4/", import.meta.url);

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
  "enable-sound": {
    duration: 0.18,
    level: 0.16,
    layers: [
      tone(0, 0.12, 660, { partials: bell }),
      tone(0.045, 0.13, 990, { partials: bell }),
    ],
  },
  "tag-hover": {
    duration: 0.08,
    level: 0.08,
    layers: [tone(0, 0.08, 1200, { to: 450, decay: 7 })],
  },
};

// CC0 source credits, edit details and regeneration requirements are in v4/LICENSE.txt.
const recordings = {
  "github-meow": {
    url: "https://opengameart.org/sites/default/files/cat_mewfood.wav",
    sha256: "3550f080882b52e236c8810a353756b2e0395fb7dadf0aeface0a06893cd181f",
    start: 0.04,
    duration: 0.38,
  },
  "bluesky-wings": {
    url: "https://bigsoundbank.com/UPLOAD/bwf-en/2891.wav",
    sha256: "5ec60d7de3e085642484a0aefdc75d0d7932cd3009a23395d6d1ef19a51ebd2f",
    filter: "asetrate=96000",
    start: 0.125,
    duration: 0.65,
  },
  "email-paper": {
    url: "https://bigsoundbank.com/UPLOAD/bwf-en/0785.wav",
    sha256: "d39ec62e16243b1b9ccb1f0f7f1176449900061cb0a0b48de4957d063cac7599",
    start: 0.17,
    duration: 0.66,
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
  await writeSample(name, samples, level);
}

for (const [
  name,
  { url, sha256, filter = "anull", start, duration },
] of Object.entries(recordings)) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${name}: HTTP ${response.status}`);
  }
  const original = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(original).digest("hex") !== sha256) {
    throw new Error(`The licensed source for ${name} has changed`);
  }
  // Decode before trimming so FFmpeg consumes stdin instead of closing its pipe early.
  const decoded = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      "pipe:0",
      "-af",
      filter,
      "-ac",
      "1",
      "-ar",
      String(sampleRate),
      "-f",
      "f32le",
      "pipe:1",
    ],
    { input: original, maxBuffer: 8 * 1024 * 1024 },
  );
  const offset = Math.round(start * sampleRate);
  const count = Math.round(duration * sampleRate);
  if (decoded.length < (offset + count) * 4) {
    throw new Error(`${name} is shorter than its selected recording excerpt`);
  }
  const samples = Float64Array.from({ length: count }, (_, i) => {
    const envelope =
      Math.min(1, i / (sampleRate * 0.005)) *
      Math.min(1, (count - 1 - i) / (sampleRate * 0.02));
    return decoded.readFloatLE((offset + i) * 4) * envelope;
  });
  await writeSample(name, samples, 0.08);
}

async function writeSample(name, samples, level) {
  const count = samples.length;
  const peak = samples.reduce(
    (maximum, value) => Math.max(maximum, Math.abs(value)),
    0,
  );
  if (!Number.isFinite(peak) || peak === 0) {
    throw new Error(`${name} contains no finite, nonzero audio`);
  }
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
