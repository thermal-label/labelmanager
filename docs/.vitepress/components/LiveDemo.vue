<template>
  <section class="live-demo">
    <h3>Live WebHID Demo</h3>
    <p>Connect a printer and send a short label directly from the browser.</p>
    <div class="row">
      <input v-model="text" placeholder="Label text" />
      <button @click="connect" :disabled="busy">Connect</button>
      <button @click="print" :disabled="busy || !printer">Print</button>
    </div>
    <p class="status">{{ status }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { requestPrinter, type WebDymoPrinter } from "@thermal-label/labelmanager-web";

const busy = ref(false);
const text = ref("Hello from VitePress");
const status = ref("Not connected");
const printer = ref<WebDymoPrinter | null>(null);

async function connect(): Promise<void> {
  busy.value = true;
  try {
    printer.value = await requestPrinter();
    status.value = "Connected";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "Connect failed";
  } finally {
    busy.value = false;
  }
}

async function print(): Promise<void> {
  if (!printer.value) {
    return;
  }
  busy.value = true;
  try {
    await printer.value.printText(text.value);
    status.value = "Label sent";
  } catch (error) {
    status.value = error instanceof Error ? error.message : "Print failed";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.live-demo {
  border: 1px solid var(--vp-c-divider);
  padding: 1rem;
  border-radius: 8px;
}
.row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
input {
  flex: 1;
  padding: 0.5rem;
}
.status {
  margin: 0;
}
</style>
