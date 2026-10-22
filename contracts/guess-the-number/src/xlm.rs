#[cfg(test)]
mod xlm {
    const XLM_KEY: &soroban_sdk::Symbol = &soroban_sdk::symbol_short!("XLM");

    pub fn contract_id(env: &soroban_sdk::Env) -> soroban_sdk::Address {
        env.storage()
            .instance()
            .get::<_, soroban_sdk::Address>(XLM_KEY)
            .expect("XLM contract not initialized. Please deploy the XLM contract first.")
    }

    pub fn set_contract_id(env: &soroban_sdk::Env, asset: &soroban_sdk::Address) {
        env.storage().instance().set(XLM_KEY, asset);
    }

    #[allow(unused)]
    pub fn stellar_asset_client<'a>(
        env: &soroban_sdk::Env,
    ) -> soroban_sdk::token::StellarAssetClient<'a> {
        soroban_sdk::token::StellarAssetClient::new(&env, &contract_id(env))
    }
    /// Create a Stellar Asset Client for the asset which provides an admin interface
    pub fn token_client<'a>(env: &soroban_sdk::Env) -> soroban_sdk::token::TokenClient<'a> {
        soroban_sdk::token::TokenClient::new(&env, &contract_id(env))
    }
}
const ONE_XLM: i128 = 1_000_000_0; // 1 XLM in stroops;

pub const fn to_stroops(num: u64) -> i128 {
    (num as i128) * ONE_XLM
}

#[cfg(not(test))]
stellar_registry::import_asset!("xlm");

#[allow(unused)]
pub const SERIALIZED_ASSET: [u8; 4] = [0, 0, 0, 0];

pub use xlm::*;
mod register {
    
    #[allow(unused)]
    #[cfg(not(test))]
    pub fn register(env: &soroban_sdk::Env, admin: &soroban_sdk::Address) {
        let balance = super::token_client(env).try_balance(&env.current_contract_address());
        if balance.is_err()  {
            env.deployer().with_stellar_asset(super::SERIALIZED_ASSET).deploy();
        }
    }
}

#[allow(unused_imports)]
pub use register::*;