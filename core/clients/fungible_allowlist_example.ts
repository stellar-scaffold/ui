import * as Client from "fungible_allowlist_example"
import { rpcUrl } from "@stellar-scaffold/ui-core"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CAETQDPGOP4YNJUKXM5KCAUQY2GEEXPQW4GCDQBY77U3RJ43XQZ5HE6V",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
