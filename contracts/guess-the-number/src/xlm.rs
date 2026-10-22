const ONE_XLM: i128 = 10_000_000; // 1 XLM in stroops

pub const fn to_stroops(num: u64) -> i128 {
    (num as i128) * ONE_XLM
}

#[cfg(not(test))]
// Resolve the real network's XLM contract; tests use a separate asset below.
stellar_registry::import_asset!("xlm");

#[cfg(test)]
pub use test_asset::*;
#[cfg(not(test))]
pub use xlm::*;

/// Ensure the native XLM asset contract exists before funding a round.
#[cfg(not(test))]
pub fn register(env: &soroban_sdk::Env) {
    if token_client(env)
        .try_balance(&env.current_contract_address())
        .is_err()
    {
        // XDR encoding of the native asset.
        env.deployer().with_stellar_asset([0u8; 4]).deploy();
    }
}

#[cfg(test)]
mod test_asset {
    const XLM_KEY: &soroban_sdk::Symbol = &soroban_sdk::symbol_short!("XLM");

    pub fn contract_id(env: &soroban_sdk::Env) -> soroban_sdk::Address {
        env.storage()
            .instance()
            .get::<_, soroban_sdk::Address>(XLM_KEY)
            .expect("XLM contract not initialized. Please deploy the XLM contract first.")
    }

    pub fn register(
        env: &soroban_sdk::Env,
        admin: &soroban_sdk::Address,
        game: &soroban_sdk::Address,
    ) -> soroban_sdk::testutils::StellarAssetContract {
        // SDK test generators must run outside contract invocations.
        // This is a mintable test asset, not native XLM.
        let sac = env.register_stellar_asset_contract_v2(admin.clone());
        // Run the storage write in the game's context so its token client can
        // find this asset when called from inside a contract method.
        env.as_contract(game, || {
            env.storage().instance().set(XLM_KEY, &sac.address());
        });
        sac
    }

    /// Create a client for the test asset stored in the game's instance.
    pub fn token_client<'a>(env: &soroban_sdk::Env) -> soroban_sdk::token::TokenClient<'a> {
        soroban_sdk::token::TokenClient::new(env, &contract_id(env))
    }
}
