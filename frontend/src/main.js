import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './lib/request-id.js';
import './styles/tokens.css';
import './styles/base.css';
import App from './App.vue';
import { router } from './router';

createApp(App).use(createPinia()).use(router).mount('#app');
