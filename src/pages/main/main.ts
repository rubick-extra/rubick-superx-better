import { createApp } from 'vue'
import { Row, Col } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import App from './App.vue'

const app = createApp(App);
app.use(Row).use(Col);
app.mount('#app');
