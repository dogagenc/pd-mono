import {
  GlobalAcceptMimesMiddleware,
  GlobalErrorHandlerMiddleware,
  ServerLoader,
  ServerSettings
} from '@tsed/common';
import '@tsed/mongoose';
import '@tsed/swagger';
import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as cors from 'cors';

@ServerSettings({
  rootDir: __dirname,
  acceptMimes: ['application/json'],
  port: process.env.PORT || 8000,
  httpsPort: false,
  passport: {},
  mongoose: {
    url:
      process.env.mongoose_url ||
      'mongodb://127.0.0.1:27017/example-mongoose-test'
  },
  swagger: {
    path: '/api-docs'
  },
  debug: false
})
export class Server extends ServerLoader {
  $beforeRoutesInit(): void | Promise<null> {
    this.use(GlobalAcceptMimesMiddleware)
      .use(cors())
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(bodyParser.json())
      .use(
        bodyParser.urlencoded({
          extended: true
        })
      )
      .use(GlobalErrorHandlerMiddleware);

    return null;
  }
}
