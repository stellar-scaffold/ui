import * as Client from 'guess_the_number';
import { rpcUrl } from './util';

export default new Client.Client({
  networkPassphrase: 'Standalone Network ; February 2017',
  contractId: 'CAKMBRBFI3SGC73F7TTG6NBDZH6DJVOTXSGKUWSHMYJVGWCTX55MZ7TC',
  rpcUrl,
  allowHttp: true,
  publicKey: undefined,
});
