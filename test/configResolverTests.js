const ConfigResolver = require('../src/configResolver');
const mockfs = require('mock-fs');
const expect = require('chai').expect;

describe('Config Resolver', () => {
  beforeEach(() => {
    mockfs({
      '/home/xdg_home': {},
      '/home/xdg_home/.config': {},
      'src/example.json': '{ "configData":"value" }',
    });
  });

  afterEach(() => {
    mockfs.restore();
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.HOME;
  });

  it('should not find a configuration file if it doesn\'t exist', () => {
    const sut = new ConfigResolver('test-app');
    const path = sut.findConfig();
    expect(path).to.equal(null);
  });

  it('should generate file if it doesn\'t exist', () => {
    const sut = new ConfigResolver('test-app');
    const path = sut.findOrGenerateConfig();
    expect(path).to.include('test-app/config.json');
  });

  it('should resolve a config file without a file specified', () => {
    const sut = new ConfigResolver('test-app');
    const config = sut.resolveConfig();
    expect(config).not.to.equal(null);
    expect(config).not.to.equal(undefined);
    expect(config.configData).to.equal('value');
  });

  it('should resolve a config file when XDG_CONFIG_HOME is set', () => {
    process.env.XDG_CONFIG_HOME = '/home/xdg_home';
    const sut = new ConfigResolver('test-app');
    const path = sut.findOrGenerateConfig();
    expect(path).to.include('/home/xdg_home');
  });

  it('should resolve a config file when HOME is set & folder exists', () => {
    process.env.HOME = '/home/xdg_home';
    const sut = new ConfigResolver('test-app');
    const path = sut.findOrGenerateConfig();
    expect(path).to.include('/home/xdg_home/.config');
  });
});
