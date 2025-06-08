// @ts-nocheck
import path from 'path';
import fs from 'fs';

export default function moveAssets() {
  return {
    name: 'move-assets',
    async closeBundle() {
      const pwd = process.cwd();
      await new Promise((resolve) => {
        deleteFolderRecursive(path.join(pwd, './assets'), resolve);
      });
      const assetsPath = path.join(pwd, './dist/assets');
      const assetsTargetPath = path.join(pwd, './assets');
      moveFolder(assetsPath, assetsTargetPath);

      const idxFrom = path.join(pwd, './dist/src/pages/index/index.html');
      filterHtmlContent(idxFrom);
      const idxTo = path.join(pwd, './index.html');
      await moveFilePromise(idxFrom, idxTo);

      const mainFrom = path.join(pwd, './dist/src/pages/main/index.html');
      filterHtmlContent(mainFrom);
      const mainTo = path.join(pwd, './main.html');
      await moveFilePromise(mainFrom, mainTo);

      deleteFolderRecursive(path.join(pwd, './dist'), () => {});
    }
  }
}

function filterHtmlContent(filepath: string) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const regex = /\.\.\/\.\.\/\./g;
  const result = content.replace(regex, '');
  fs.writeFileSync(filepath, result);
}

function moveFolder(source: string, destination: string, callback?: (err: any) => void) {
  // 确保目标目录存在
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.rename(source, destination, (err) => {
    if (err) {
      // 如果是跨设备错误，使用复制后删除的方式
      if (err.code === 'EXDEV') {
        callback?.(err);
      }
    } else {
      callback?.(null);
    }
  });
}

function moveFilePromise(source: string, destination: string) {
  return new Promise((resolve, reject) => {
    const destDir = path.dirname(destination);
    fs.mkdir(destDir, { recursive: true }, (err) => {
      if (err) return reject(err);
      
      fs.rename(source, destination, (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });
  });
}

function deleteFolderRecursive(folderPath: string, callback: any) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      // 如果文件夹不存在，直接返回成功
      if (err.code === 'ENOENT') {
        return callback(null);
      }
      return callback(err);
    }

    let completed = 0;
    let hadError = false;

    if (files.length === 0) {
      // 空文件夹直接删除
      return fs.rmdir(folderPath, callback);
    }

    // 递归处理每个文件/文件夹
    files.forEach((file) => {
      const curPath = path.join(folderPath, file);
      
      fs.lstat(curPath, (err, stats) => {
        if (hadError) return;
        if (err) {
          hadError = true;
          return callback(err);
        }

        if (stats.isDirectory()) {
          // 递归删除子文件夹
          deleteFolderRecursive(curPath, (err: any) => {
            if (hadError) return;
            if (err) {
              hadError = true;
              return callback(err);
            }
            checkComplete();
          });
        } else {
          // 删除文件
          fs.unlink(curPath, (err) => {
            if (hadError) return;
            if (err) {
              hadError = true;
              return callback(err);
            }
            checkComplete();
          });
        }
      });
    });

    function checkComplete() {
      completed++;
      if (completed === files.length) {
        // 所有子项都已删除，删除当前文件夹
        fs.rmdir(folderPath, callback);
      }
    }
  });
}
