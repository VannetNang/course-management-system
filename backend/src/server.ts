import app from './app';
import config from './config/config';

const server = app.listen(config.port, () => {
  console.log(`Server running on port http://localhost:${config.port}`);
});

export default server;
