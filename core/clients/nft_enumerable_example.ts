import * as Client from "nft_enumerable_example"
import { rpcUrl } from "@stellar-scaffold/ui-core"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CCFUXTTWNQBPVGLBOYWWVLM5CN77BUUTG6IOV2D3XILYOFQRBGZPS2QX",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
