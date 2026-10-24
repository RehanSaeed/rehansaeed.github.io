import { mkdir, writeFile } from "node:fs/promises";

const sampleRate = 22050;
const directory = new URL("../public/sounds/v1/", import.meta.url);
const tones = {
    "toggle-on": [660, 880, 0.09],
    "toggle-off": [660, 440, 0.09],
    "dialog-open": [440, 660, 0.12],
    "dialog-close": [440, 330, 0.1],
};

await mkdir(directory, { recursive: true });
for (const [name, [from, to, duration]] of Object.entries(tones)) {
    const count = Math.round(sampleRate * duration);
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
    let phase = 0;
    for (let i = 0; i < count; i++) {
        const progress = i / (count - 1);
        phase += (2 * Math.PI * (from + (to - from) * progress)) / sampleRate;
        const envelope =
            Math.sin(Math.PI * progress) ** 2 * Math.exp(-3 * progress);
        buffer.writeInt16LE(
            Math.round(Math.sin(phase) * envelope * 16000),
            44 + i * 2,
        );
    }
    await writeFile(new URL(`${name}.wav`, directory), buffer);
}
