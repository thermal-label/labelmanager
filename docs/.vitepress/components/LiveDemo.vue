<template>
  <section class="live-demo">
    <h3>Live WebHID Demo</h3>
    <p>
      Preview updates instantly in any browser. Printing requires WebHID support in Chrome or Edge.
    </p>

    <div class="controls">
      <label class="control">
        <span>Text</span>
        <input v-model="text" placeholder="Label text" />
      </label>

      <label class="control">
        <span>Tape width</span>
        <select v-model.number="tapeWidth">
          <option :value="6">6 mm</option>
          <option :value="9">9 mm</option>
          <option :value="12">12 mm</option>
        </select>
      </label>

      <label class="control">
        <span>Density</span>
        <select v-model="density">
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
      </label>

      <label class="control checkbox">
        <input v-model="invert" type="checkbox" />
        <span>Invert</span>
      </label>
    </div>

    <div class="preview">
      <canvas ref="previewCanvas" />
    </div>

    <div class="actions">
      <button @click="connect" :disabled="isConnecting || isPrinting">
        {{ isConnecting ? "Connecting..." : "Connect" }}
      </button>
      <button @click="print" :disabled="isConnecting || isPrinting || !printer || !text.trim()">
        {{ isPrinting ? "Printing..." : "Print" }}
      </button>
    </div>

    <p class="status">{{ status }}</p>
  </section>
</template>

<script setup lang="ts">
import { getPixel, renderText, scaleBitmap, type LabelBitmap } from "@mbtech-nl/bitmap";
import { requestPrinter, type WebDymoPrinter } from "@thermal-label/labelmanager-web";
import { onMounted, ref, watch } from "vue";

type TapeWidth = 6 | 9 | 12;
type Density = "normal" | "high";

const PREVIEW_SCALE = 4;
const tapeToTargetHeight: Record<TapeWidth, number> = {
  6: 32,
  9: 48,
  12: 64
};

const text = ref("Hello from VitePress");
const tapeWidth = ref<TapeWidth>(12);
const density = ref<Density>("normal");
const invert = ref(false);
const status = ref("Ready to preview. Connect to print.");
const printer = ref<WebDymoPrinter | null>(null);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const isConnecting = ref(false);
const isPrinting = ref(false);

function drawPreview(): void {
  const canvas = previewCanvas.value;
  if (!canvas) {
    return;
  }

  const trimmedText = text.value.trim();
  if (!trimmedText) {
    const fallbackHeight = tapeToTargetHeight[tapeWidth.value];
    canvas.width = 1;
    canvas.height = fallbackHeight * PREVIEW_SCALE;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    return;
  }

  let bitmap: LabelBitmap;
  try {
    bitmap = renderText(trimmedText, { invert: invert.value });
  } catch {
    return;
  }

  const fitted = scaleBitmap(bitmap, tapeToTargetHeight[tapeWidth.value]);
  canvas.width = fitted.widthPx * PREVIEW_SCALE;
  canvas.height = fitted.heightPx * PREVIEW_SCALE;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.imageSmoothingEnabled = false;
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";

  for (let y = 0; y < fitted.heightPx; y += 1) {
    for (let x = 0; x < fitted.widthPx; x += 1) {
      if (getPixel(fitted, x, y) === 1) {
        context.fillRect(x * PREVIEW_SCALE, y * PREVIEW_SCALE, PREVIEW_SCALE, PREVIEW_SCALE);
      }
    }
  }
}

async function connect(): Promise<void> {
  isConnecting.value = true;
  status.value = "Waiting for printer selection...";
  try {
    printer.value = await requestPrinter();
    status.value = "Connected. Ready to print.";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "Connect failed";
  } finally {
    isConnecting.value = false;
  }
}

async function print(): Promise<void> {
  if (!printer.value) {
    return;
  }

  const trimmedText = text.value.trim();
  if (!trimmedText) {
    status.value = "Enter text before printing.";
    return;
  }

  isPrinting.value = true;
  status.value = "Sending label to printer...";
  try {
    await printer.value.printText(trimmedText, {
      density: density.value,
      invert: invert.value,
      tapeWidth: tapeWidth.value
    });
    status.value = "Label sent.";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "Print failed";
  } finally {
    isPrinting.value = false;
  }
}

onMounted(() => {
  drawPreview();
});

watch([text, tapeWidth, invert], () => {
  drawPreview();
});
</script>

<style scoped>
.live-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1rem;
}

.controls {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  margin: 1rem 0;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.control > span {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.checkbox {
  align-items: flex-start;
  flex-direction: row;
  gap: 0.5rem;
  padding-top: 1.65rem;
}

input,
select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.45rem 0.55rem;
}

.preview {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding: 0.5rem;
}

canvas {
  display: block;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.status {
  margin: 0;
}
</style>
