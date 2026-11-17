import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './lib/request-id.js';
import './styles/tokens.css';
import './styles/base.css';
import { loadDictionary } from './lib/i18n';
import App from './App.vue';
import { router } from './router';

loadDictionary().finally(() => {
  createApp(App).use(createPinia()).use(router).mount('#app');
});
