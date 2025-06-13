const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 配置项
const config = {
  // 监听的目录，默认为整个 src 目录
  watchDir: path.join(__dirname, '../src'),
  // 排除的目录或文件
  excludeDirs: ['.git', 'node_modules', 'dist'],
  // Vite 构建命令
  buildCommand: 'npm run build',
  // 防抖时间（毫秒）
  debounceTime: 1000,
  // 是否在启动时立即执行一次构建
  buildOnStart: true,
};

// 用于防抖的计时器
let debounceTimer = null;

// 执行构建命令
function runBuild() {
  console.log('开始执行构建...');
  
  // 执行 Vite 构建命令
  exec(config.buildCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`构建失败: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`构建警告: ${stderr}`);
      return;
    }
    console.log(`构建成功: ${stdout}`);
  });
}

// 检查路径是否应该被排除
function shouldExclude(filePath) {
  return config.excludeDirs.some(exclude => 
    filePath.includes(path.sep + exclude + path.sep) || 
    filePath.endsWith(path.sep + exclude)
  );
}

// 递归监听目录
function watchDirectory(directory) {
  try {
    fs.watch(directory, (eventType, filename) => {
      if (!filename) return;
      
      const filePath = path.join(directory, filename);
      
      // 排除特定目录和文件
      if (shouldExclude(filePath)) return;
      
      console.log(`检测到变化: ${filePath} (${eventType})`);
      
      // 防抖处理
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runBuild, config.debounceTime);
    });
    
    // 递归监听子目录
    fs.readdirSync(directory).forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !shouldExclude(filePath)) {
        watchDirectory(filePath);
      }
    });
  } catch (error) {
    console.error(`监听目录失败: ${directory}`, error);
  }
}

// 主函数
function main() {
  console.log(`开始监听目录: ${config.watchDir}`);
  
  // 立即执行一次构建
  if (config.buildOnStart) {
    runBuild();
  }
  
  // 开始监听
  watchDirectory(config.watchDir);
}

// 启动脚本
main();
