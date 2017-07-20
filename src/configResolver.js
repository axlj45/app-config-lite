const fsExt = require('./fs.extensions');
const Path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;

function getPaths(appName, configFileName) {
  let configFile = 'config.json';
  if (configFileName) {
    configFile = configFileName;
  }

  const paths = [];
  const xdgConfig = process.env.XDG_CONFIG_HOME ||
    (process.env.HOME && Path.join(process.env.HOME, '.config'));
  if (xdgConfig && fsExt.folderExists(xdgConfig)) {
    paths.push({
      path: Path.join(xdgConfig, appName, configFile),
      type: 'xdg',
    });
  }

  if (process.platform === 'win32' &&
    process.env.APPDATA &&
    fsExt.folderExists(process.env.APPDATA)) {
    paths.push({
      path: Path.resolve(Path.join(process.env.APPDATA, appName, configFile)),
      type: 'win',
    });
  }

  paths.push({
    path: Path.resolve(Path.join('.', appName, configFile)),
    type: 'def',
  });

  paths.push({
    path: Path.resolve(Path.join('.', configFile)),
    type: 'old',
  });

  return paths;
}

function createConfigFile(configPath) {
  mkdirp.sync(Path.dirname(configPath.path));

  const defaultConfig = require.resolve('./example.json');
  const createdConfig = fs.readFileSync(defaultConfig, 'utf8');

  fs.writeFileSync(configPath.path, createdConfig);

  return configPath.path;
}

class ConfigResolver extends EventEmitter {
  constructor(appName, configFile = null) {
    super();
    this.appName = appName;
    this.configFile = configFile || 'config.json';
  }

  findOrGenerateConfig() {
    let config = this.findConfig();

    if (config) return config;

    const paths = getPaths(this.appName, this.configFile);

    config = createConfigFile(paths[0]);
    this.emit('info', `Creating default config file in ${config}`);
    return config;
  }

  findConfig() {
    const paths = getPaths(this.appName, this.configFile);

    for (let i = 0; i < paths.length; i += 1) {
      if (fsExt.fileExists(paths[i].path)) return paths[i].path;
    }

    return null;
  }

  resolveConfig(configPath) {
    const path = this.getOrGenerateConfig(configPath);
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    config.self_path = path;
    return config;
  }

  getOrGenerateConfig(configPath) {
    if (configPath) {
      return Path.resolve(configPath);
    }
    return this.findOrGenerateConfig();
  }
}

module.exports = ConfigResolver;
