interface ConfigOptions {
  API_URL: string;
}

type Env = 'development' | 'production';

const configs: { [key in Env]: ConfigOptions } = {
  production: {
    API_URL: 'http://localhost:8081/rest/'
  },
  development: {
    API_URL: 'http://localhost:8000/rest/'
  }
};

const config = <T extends keyof ConfigOptions>(
  configKey: T
): ConfigOptions[T] => {
  const env: Env =
    process.env.NODE_ENV === 'development' ? 'development' : 'production';

  return configs[env][configKey];
};

export default config;
