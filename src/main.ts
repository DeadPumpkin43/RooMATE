import { createApp } from "vue";
import "./style.css";
import "primeicons/primeicons.css";

import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import { createPinia } from "pinia";
import { Theme } from "@primevue/themes";

var app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});
app.use(createPinia());
app.mount("#app");
