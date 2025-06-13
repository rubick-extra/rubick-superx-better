import { createApp } from 'vue'
import { Form, Input, Button, Alert, Modal } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue'
import 'uno.css'


const app = createApp(App);
app.use(Form).use(Input).use(Button).use(Alert).use(Modal);
app.mount('#app');