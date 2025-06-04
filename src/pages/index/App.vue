<template>
  <a-alert message="温馨提示" description="超级面板是系统插件，快捷键修改成功后，请重新启动 rubick 后生效." type="info" show-icon />
  <div class="container">
    <a-form :model="formState" name="basic" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" autocomplete="off"
      @finish="saveHotKey">
      <a-form-item label="超级面板快捷键设置" name="superPanelHotKey" :rules="[{ required: true, message: '请输入快捷键!' }]">
        <a-input v-model:value="formState.superPanelHotKey" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 10, span: 14 }">
        <a-button type="primary" html-type="submit">保存设置</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';

const id = 'rubick-system-super-panel-store'

const formState = reactive({
  superPanelHotKey: window.rubick.dbStorage.getItem(id) || 'Ctrl+W',
});

const saveHotKey = () => {
  message.success('保存成功');
  window.rubick.dbStorage.setItem(id, formState.superPanelHotKey);
}
</script>
<style>
* {
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  height: 100vh;
  background-image: url("@/assets/bg.png");
  background-repeat: no-repeat;
  background-size: cover;
}

.container {
  width: 600px;
  margin: 0 auto;
  padding-top: 80px;
}
</style>