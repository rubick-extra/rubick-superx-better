<template>
  <div class="main" id="app">
    <div class="top-menu">
      <div @click="showMainWindow" class="logo">
        <img src="@/assets/logo.png" />
      </div>
      <div class="menu">
        <SettingOutlined @click="openSettings" />
        <PushpinOutlined title="钉住" @click="triggerPin" :style="{color: pin ? '#ff4ea4' : ''}" />
      </div>
    </div>
    <div class="translate-content" v-if="translate || loading">
      <div class="spinner" v-if="loading">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
      <div v-else>
        <div class="ellpise source">{{translate.src}} {{translate.basic && `[${translate.basic.phonetic}]`}}</div>
        <div class="translate-target" v-if="translate.basic">
          <div class="ellpise" :key="index" v-for="(item, index) in translate.basic.explains">
            {{item}}
          </div>
        </div>
        <div class="translate-target" v-else>
          <div class="ellpise" :key="index" v-for="(item, index) in translate.translation">
            {{item}}
          </div>
        </div>
      </div>
    </div>
    <div class="plugins-content" v-if="!!matchPlugins.length">
      <div class="plugin-title">匹配插件</div>
      <a-row>
        <template :key="index" v-for="(plugin, index) in matchPlugins">
          <a-col @click="() => commonClick(plugin)" class="plugin-item" :span="8">
            <img width="30" :src="plugin.logo" />
            <div>{{plugin.name}}</div>
          </a-col>
        </template>
      </a-row>
    </div>
    <div class="plugins-content" v-if="!!userPlugins.length">
      <div class="plugin-title">固定插件</div>
      <a-row>
        <template :key="index" v-for="(plugin, index) in userPlugins">
          <a-col @click="() => commonClick(plugin)" class="plugin-item" :span="8">
            <img width="30" :src="plugin.logo" />
            <div>{{plugin.pluginName}}</div>
          </a-col>
        </template>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { PushpinOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { ref, reactive, toRefs, watch } from 'vue';
import {formatReg, db, openSettings, showMainWindow, finders, getFinderPath, ipcSendSync} from './utils';
import link from '@/assets/link.png?url';
import newIcon from '@/assets/new.png?url';
import terminal from '@/assets/terminal.png?url';

const { ipcRenderer, clipboard } = window.require('electron');
const path = window.require('path');
const { spawn } = window.require('child_process');
const os = window.require('os');

const pin = ref(false);
const state = reactive({
  translate: null,
  commonPlugins: [
    {
      color: '#efeed6',
      type: 'default',
      name: '终端打开',
      logo: terminal,
      click: () => {
        if (os.type() === 'Windows_NT') {
          spawn(`start cmd.exe /k "cd /d ${state.fileUrl}"`, [], { shell: true });
        } else {
          spawn('open', [ '-a', 'Terminal', state.fileUrl ]);
        }
      }
    },
    {
      color: '#efeed6',
      type: 'default',
      name: '新建文件',
      logo: newIcon,
      click: () => {
        ipcRenderer.send('create-file', {
          title: "请选择要保存的文件名",
          buttonLabel: "保存",
          defaultPath: state.fileUrl.replace('file://', ''),
          showsTagField: false,
          nameFieldLabel: '',
        });
      }
    },
    {
      color: '#efeed6',
      type: 'default',
      name: '复制路径',
      logo: link,
      click: () => {
        clipboard.writeText(state.fileUrl.replace('file://', ''))
      }
    },
  ],
  selected: [
    {
      type: 'default',
      name: '复制当前路径',
      logo: link,
      click: () => {
        clipboard.writeText(state.fileUrl.replace('file://', ''))
      }
    }
  ],
  userPlugins: [],
  matchPlugins: [],
  loading: false,
  fileUrl: '',
});

const triggerPin = () => {
  pin.value = !pin.value;
  ipcRenderer.send('trigger-pin', pin.value);
}

ipcRenderer.on('trigger-super-panel', async (e, args) => {
  state.matchPlugins = [];
  const ext = path.extname(args.fileUrl || '');
  state.fileUrl = args.fileUrl;
  state.translate = null;
  if (args.fileUrl === null) {
    // 在桌面上
    state.matchPlugins = state.commonPlugins;
    state.fileUrl = ipcSendSync('getPath', { name: 'desktop' });
  } else if (!args.fileUrl && args.text) {
    // 剪切板只有文本时，显示翻译
    const word = args.text;
    translateStr(word);
    (args.optionPlugin || []).forEach(plugin => {
      plugin.features.forEach(fe => {
        fe.cmds.forEach(cmd => {
          if (cmd.type === 'regex' && formatReg(cmd.match).test(word)) {
            state.matchPlugins.push({
              type: 'ext',
              name: cmd.label,
              logo: plugin.logo,
              click: () => {
                window.openPlugin({
                  cmd: cmd,
                  plugin: plugin,
                  feature: fe,
                  data: word
                })
              }
            });
          }
          if (cmd.type === 'over') {
            state.matchPlugins.push({
              type: 'ext',
              name: cmd.label,
              logo: plugin.logo,
              click: () => {
                window.openPlugin({
                  cmd: cmd,
                  plugin: plugin,
                  feature: fe,
                  data: word
                })
              }
            });
          }
        });
      });
    });
  } else if (finders.includes(args.fileUrl.split('/').pop()) || finders.includes(args.fileUrl.split('\\').pop())) {
    // 在文件夹中, 目前仅支持macos。
    state.matchPlugins = state.commonPlugins;
    getFinderPath((url) => state.fileUrl = url);
  } else {
    // 有文件选择
    state.matchPlugins = [...state.selected];
    state.fileUrl = args.fileUrl;
    // 检测上传
    (args.optionPlugin || []).forEach(plugin => {
      plugin.features.forEach(fe => {
        fe.cmds.forEach(cmd => {
          // 如果是图片，则唤起图片选项
          const regImg = /\.(png|jpg|gif|jpeg|webp)$/;
          if (cmd.type === 'img' && regImg.test(ext)) {
            state.matchPlugins.unshift({
              type: 'ext',
              name: cmd.label,
              logo: plugin.logo,
              click: () => {
                const base64 = ipcRenderer.sendSync("get-file-base64", state.fileUrl.replace('file://', ''));
                window.openPlugin({
                  cmd: cmd,
                  plugin: plugin,
                  feature: fe,
                  data: base64
                })
              }
            })
          }
          // 如果是文件，且符合文件正则类型
          if (cmd.type === 'file' && formatReg(cmd.match).test(ext)) {
            state.matchPlugins.unshift({
              type: 'ext',
              name: cmd.label,
              logo: plugin.logo,
              click: () => {
                window.openPlugin({
                  cmd: cmd,
                  plugin: plugin,
                  feature: fe,
                  data: {
                    isFile: true,
                    isDirectory: false,
                    name: path.basename(args.fileUrl),
                    path: args.fileUrl
                  }
                });
              }
            })
          }
        })
      });
    });
  }
});

const translateStr = (msg) => {
  state.loading = true;
  window.translator.translate(msg).then(res => {
    state.translate = {
      ...JSON.parse(res),
      src: msg,
    }
  }).catch(() => {
    state.translate = null
  }).finally(() => {
    state.loading = false;
  })
}

const commonClick = (item, fileUrl) => {
  ipcRenderer.send('superPanel-hidden')
  item.click(fileUrl);
}

const getUserPlugins = () => {
  let commonPlugins = db.get('super-panel-user-plugins');
  if (!commonPlugins) return;
  commonPlugins.data = commonPlugins.data.map((plugin) => {
    return {
      ...plugin,
      click: () => {
        window.openPlugin({
          cmd: plugin.cmd,
          plugin: plugin,
          feature: plugin.ext
        });
      }
    }
  });
  state.userPlugins = commonPlugins.data;
}

getUserPlugins();

const { translate, loading, matchPlugins, userPlugins } = toRefs(state);

watch([matchPlugins, translate], () => {
  getUserPlugins();
  setTimeout(() => {
    ipcRenderer.send('superPanel-setSize', parseInt(getComputedStyle(document.getElementById('app')).height))
  }, 50);
});

</script>

<style>
* {
  margin: 0;
  padding: 0;
}
::-webkit-scrollbar {
  display: none;
}
.top-menu {
  padding: 0 10px;
  width: 100%;
  height: 46px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  width: 26px;
  height: 26px;
  border-radius: 100%;
  background: #574778;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo img {
  width: 20px;
}

.menu {
  color: #999;
  width: 46px;
  display: flex;
  justify-content: space-between;
  font-size: 18px;
}

.translate-content {
  padding: 4px 10px;
  font-size: 12px;
  color: #ff4ea4;
  box-sizing: border-box;
  background: #f5f5f5;
}

.source {
  margin-bottom: 4px;
}

.translate-target {
  color: #574778;
}

.ellpise {
  overflow:hidden;
  text-overflow:ellipsis;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
}

.plugin-item {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 12px;
}

.plugin-item img {
  padding-bottom: 6px;
}

.plugin-item div {
  width: 80px;
  overflow:hidden;
  text-overflow:ellipsis;
  text-align: center;
  display:-webkit-box;
  -webkit-line-clamp:1;
  -webkit-box-orient:vertical;
}

.plugin-title {
  font-size: 12px;
  width: 100%;
  padding: 4px 10px;
  background-color: #fff1f0;
  color: #574778;
}

.spinner > div {
  width: 10px;
  height: 10px;
  background-color: #ddd;
  
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: bouncedelay 1.4s infinite ease-in-out;
  animation: bouncedelay 1.4s infinite ease-in-out;
  /* Prevent first frame from flickering when animation starts */
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
}

.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}

.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0.0) }
  40% { -webkit-transform: scale(1.0) }
}

@keyframes bouncedelay {
  0%, 80%, 100% {
    transform: scale(0.0);
    -webkit-transform: scale(0.0);
  } 40% {
      transform: scale(1.0);
      -webkit-transform: scale(1.0);
    }
}
</style>
