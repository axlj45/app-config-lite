const configuration = require('../src/configuration');
const mockfs = require('mock-fs');
const expect = require('chai').expect;

describe('Configuration', () => {
  beforeEach(() => {
    mockfs({
      'src/example.json': '{ "configData":"value" }',
    });
    process.env.EXAMPLE_ENV_VAR = 'env_data';
  });

  afterEach(() => {
    mockfs.restore();
    delete process.env.EXAMPLE_ENV_VAR;
  });

  it('should fire a loaded event when a config file is loaded', () => {
    let loaded = false;
    const sut = configuration.init('test-app');
    sut.on('loaded', () => {
      loaded = true;
    });
    sut.load();
    expect(loaded).to.equal(true);
  });

  it('should provide get mechanism for retrieving settings from file', () => {
    const sut = configuration.init('test-app');
    sut.load();
    const setting = sut.get('configData');
    expect(setting).to.equal('value');
  });

  it('should provide set mechanism for setting a temporary setting', () => {
    const sut = configuration.init('test-app');
    sut.load();
    sut.set('tempSetting', {
      complex: 'data',
    });
    const setting = sut.get('tempSetting');
    expect(setting.complex).to.equal('data');
  });

  it('should support environment variables', () => {
    const sut = configuration.init('test-app');
    sut.load();
    const setting = sut.get('example.env.var');
    expect(setting).to.equal('env_data');
  });

  it('should give precedence to environment variables', () => {
    const sut = configuration.init('test-app');
    sut.load();

    const fileSetting = sut.get('configData');
    expect(fileSetting).to.equal('value');

    process.env.CONFIGDATA = 'env_data';
    const envSetting = sut.get('configData');
    delete process.env.configData;
    expect(envSetting).to.equal('env_data');
  });
});
