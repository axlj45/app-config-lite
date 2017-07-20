const fs = require('fs');

function folderExists(path) {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  } catch (err) {
    return false;
  }
}

function fileExists(path) {
  try {
    const stat = fs.statSync(path);
    return stat.isFile();
  } catch (err) {
    return false;
  }
}

module.exports = {
  folderExists,
  fileExists,
};
