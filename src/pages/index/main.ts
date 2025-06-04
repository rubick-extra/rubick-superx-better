import { createApp } from 'vue'
import { Form, Input, Button, Alert } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue'

const app = createApp(App);
app.use(Form).use(Input).use(Button).use(Alert);
app.mount('#app');