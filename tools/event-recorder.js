const { uIOhook } = require('uiohook-napi');

/**
 * 键盘事件记录器类
 * 用于记录键盘按键事件，避免重复记录连续的相同按键状态
 */
class EventRecorder {
  constructor(maxSize = 100) {
    this.buffer = []; // 事件缓冲区
    this.maxSize = maxSize; // 缓冲区最大容量
    this.isRecording = false; // 记录状态标志
    this.keyStateMap = new Map(); // 跟踪每个按键的当前状态
    this.eventHandlers = {}; // 自定义事件处理器
    this.listenerType = ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'input'];
  }

  // 初始化默认事件处理器
  initDefaultHandlers() {
    // 键盘按下事件
    this.on('keydown', (event) => {
      // 如果按键已经处于按下状态，则不记录此事件
      if (this.keyStateMap.get(event.keycode) === 'down') {
        return;
      }

      // 更新按键状态并记录事件
      this.keyStateMap.set(event.keycode, 'down');
      this.addToBuffer({
        type: 'keydown',
        keycode: event.keycode,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        timestamp: Date.now()
      });
    });

    // 键盘释放事件
    this.on('keyup', (event) => {
      // 如果按键已经处于释放状态，则不记录此事件
      if (this.keyStateMap.get(event.keycode) === 'up') {
        return;
      }

      // 更新按键状态并记录事件
      this.keyStateMap.set(event.keycode, 'up');
      this.addToBuffer({
        type: 'keyup',
        keycode: event.keycode,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        timestamp: Date.now()
      });
    });

    // 鼠标点击事件
    this.on('mouseclick', (event) => {
      this.addToBuffer({
        type: 'mouseclick',
        x: event.x,
        y: event.y,
        button: event.button,
        clicks: event.clicks,
        timestamp: Date.now()
      });
    });

    // 鼠标滚动事件
    this.on('mousescroll', (event) => {
      this.addToBuffer({
        type: 'mousescroll',
        x: event.x,
        y: event.y,
        amount: event.amount,
        rotation: event.rotation,
        direction: event.direction,
        timestamp: Date.now()
      });
    });
  }

  // 添加事件处理器
  on(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
      if (this.listenerType.includes(eventType)) {
        // 使用 uIOhook.on 注册事件监听器
        uIOhook.on(eventType, (event) => {
          // 调用所有注册的处理器
          this.eventHandlers[eventType].forEach(h => h(event));
        });
      }
    }

    // 添加新的处理器
    this.eventHandlers[eventType].push(handler);
  }

  off(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(h => h !== handler);
      if (this.listenerType.includes(eventType)) {
        uIOhook.removeAllListeners(eventType);
      }
    }
  }

  // 添加事件到缓冲区
  addToBuffer(event) {
    this.buffer.push(event);

    // 检查缓冲区大小，超出限制则移除最早的事件
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    this.eventHandlers['change']?.forEach(h => h(this.buffer));
  }

  // 开始记录
  start() {
    if (!this.isRecording) {
      this.initDefaultHandlers();
      uIOhook.start();
      this.isRecording = true;
      this.keyStateMap.clear(); // 重置按键状态
      console.log('键盘事件记录已开始');
    }
  }

  // 停止记录
  stop() {
    if (this.isRecording) {
      uIOhook.stop();
      uIOhook.removeAllListeners();
      this.eventHandlers = {}; // 自定义事件处理器
      this.isRecording = false;
      console.log('键盘事件记录已停止');
    }
  }

  // 获取当前缓冲区内容
  getBuffer() {
    return [...this.buffer];
  }

  // 清空缓冲区
  clearBuffer() {
    this.buffer = [];
    console.log('事件缓冲区已清空');
  }

  // 设置最大缓冲区大小
  setMaxSize(size) {
    this.maxSize = size;

    // 如果当前缓冲区超过新设置的大小，裁剪它
    if (this.buffer.length > size) {
      this.buffer = this.buffer.slice(-size);
    }
  }
}

module.exports = EventRecorder;
