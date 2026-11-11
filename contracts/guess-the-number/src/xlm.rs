const ONE_XLM: i128 = 10_000_000; // 1 XLM in stroops

pub const fn to_stroops(num: u64) -> i128 {
    (num as i128) * ONE_XLM
}

/// Client for the network's native XLM asset contract.
pub fn token_client<'a>(env: &soroban_sdk::Env) -> soroban_sdk::token::TokenClient<'a> {
    stellar_registry::import_contract!(env, xlm)
}

/// Ensure the native XLM asset contract exists before funding a round.
pub fn register(env: &soroban_sdk::Env) {
    if token_client(env)
        .try_balance(&env.current_contract_address())
        .is_err()
    {
        // XDR encoding of the native asset.
        env.deployer().with_stellar_asset([0u8; 4]).deploy();
    }
}
