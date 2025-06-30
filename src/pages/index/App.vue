<template>
  <div style="width: calc(100% - 32px); margin: 0 auto;">
    <a-alert message="温馨提示" description="超级面板是系统插件，快捷键修改成功后，请重新启动 rubick 后生效." type="info" show-icon />
    <div class="container">
      <a-form :model="formState" name="basic" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }" autocomplete="off">
        <a-form-item label="快捷键" name="superPanelHotKey">
          <a-input v-model:value="formState.superPanelHotKey" placeholder="按下快捷键后松开，即可保存" @focus="io.on(handleIO)"
            @blur="io.off(handleIO)" @keydown.backspace="deleteKeyBind" />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 10, span: 14 }">
          <a-button type="primary" html-type="submit">保存设置</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';

const id = 'rubick-system-super-panel-store'

const formState = reactive({
  cachedShortcut: window.rubick.dbStorage.getItem(id) || '',
  superPanelHotKey: window.rubick.dbStorage.getItem(id) || '',
});

const io = window.useIOEvents();

// 使用示例
const recorder = window.useIOShortcutRecorder(onChange);

// 假设这是外部提供的handleIO函数
function handleIO(eventData) {
  recorder.handleIO(eventData);
}

interface Shortcut {
  sequence: {
    type: string;
    button: number;
    isLongPress: boolean;
  }[];
  label: string;
  status: 'finished' | 'update';
}
function onChange(shortcut: Shortcut) {
  formState.superPanelHotKey = shortcut.label || formState.cachedShortcut;
  if (shortcut.status === 'finished') {
    formState.cachedShortcut = shortcut.label
    window.rubick.dbStorage.setItem(id, formState.superPanelHotKey);
    message.success('保存成功');
  }
}

function deleteKeyBind(e) {
  formState.superPanelHotKey = '';
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
  width: 50% !important;
  margin: 0 auto;
  padding-top: 80px;
}
</style>