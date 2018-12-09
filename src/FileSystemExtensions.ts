import fs = require('fs');

function folderExists(path: string): boolean {
    try {
        const stat = fs.statSync(path);
        return stat.isDirectory();
    } catch (err) {
        return false;
    }
}

function fileExists(path: string): boolean {
    try {
        const stat = fs.statSync(path);
        return stat.isFile();
    } catch (err) {
        return false;
    }
}

export { folderExists, fileExists };