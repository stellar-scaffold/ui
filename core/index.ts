// @stellar-scaffold/ui-core — shared, framework-agnostic layer for the UI monorepo.
// One authored copy, imported by every template (and the generated Contract
// Clients in core/clients). Framework-specific code (providers, stores, UI
// components) stays in each template.

export * from "./env" // rpcUrl, networkPassphrase, stellarNetwork, horizonUrl, network, labPrefix
export * from "./format" // shortAddress, formatNetworkName, networkStatus, NetworkState
export * from "./friendbot" // getFriendbotUrl
export * from "./subscription" // subscribeToEvents
export * from "./wallet" // connectWallet, disconnectWallet, fetchBalances, wallet, MappedBalances
export { default as storage } from "./storage"
