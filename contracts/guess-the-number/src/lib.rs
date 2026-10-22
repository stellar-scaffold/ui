#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, BytesN, ContractExecutable, Env, Symbol,
};

mod error;
mod xlm;

use error::Error;

#[contract]
pub struct GuessTheNumber;

const THE_NUMBER: &Symbol = &symbol_short!("n");
pub const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");

#[contractimpl]
impl GuessTheNumber {
    /// Constructor to initialize the contract with an admin and a random number
    #[cfg(not(test))]
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        xlm::register(env, &admin);
        Self::initialize(env, admin);
    }

    // SDK test generators must run outside contract invocations.
    #[cfg(test)]
    pub fn __constructor(env: &Env, admin: Address, asset: Address) {
        admin.require_auth();
        xlm::set_contract_id(env, &asset);
        Self::initialize(env, admin);
    }

    fn initialize(env: &Env, admin: Address) {
        // Send the contract an amount of XLM to play with
        xlm::token_client(env).transfer(
            &admin,
            env.current_contract_address(),
            &xlm::to_stroops(1),
        );
        // Set the admin in storage
        Self::set_admin(env, admin);
        // Set a random number between 1 and 10
        Self::reset_number(env);
    }

    /// Update the number. Only callable by admin.
    pub fn reset(env: &Env) {
        Self::require_admin(env);
        Self::reset_number(env);
    }

    // Private function to reset the number to a new random value
    // which doesn't require auth from the admin
    fn reset_number(env: &Env) {
        let new_number: u64 = env.prng().gen_range(1..=10);
        env.storage().instance().set(THE_NUMBER, &new_number);
    }

    /// Guess a number between 1 and 10
    pub fn guess(env: &Env, a_number: u64, guesser: Address) -> Result<bool, Error> {
        let xlm_client = xlm::token_client(env);
        let contract_address = env.current_contract_address();
        let guessed_it = a_number == Self::number(env);
        if guessed_it {
            let balance = xlm_client.balance(&contract_address);
            if balance == 0 {
                return Err(Error::NoBalanceToTransfer);
            }
            // Methods `try_*` will return an error if the method fails
            // `.map_err` lets us convert the error to our custom Error type
            let _ = xlm_client
                .try_transfer(&contract_address, &guesser, &balance)
                .map_err(|_| Error::FailedToTransferToGuesser)?;
        } else {
            guesser.require_auth();
            let _ = xlm_client
                .try_transfer(&guesser, &contract_address, &xlm::to_stroops(1))
                .map_err(|_| Error::FailedToTransferFromGuesser)?;
        }
        Ok(guessed_it)
    }

    /// Admin can add more funds to the contract
    pub fn add_funds(env: &Env, amount: i128) {
        Self::require_admin(env);
        let contract_address = env.current_contract_address();
        // unwrap here is safe because the admin was set in the constructor
        let admin = Self::admin(env).unwrap();
        xlm::token_client(env).transfer(&admin, &contract_address, &amount);
    }

    /// Upgrade the contract to new wasm. Only callable by admin.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer().update_current_contract(ContractExecutable::Wasm(new_wasm_hash));
    }

    /// readonly function to get the current number
    /// `pub(crate)` makes it accessible in the same crate, but not outside of it
    pub(crate) fn number(env: &Env) -> u64 {
        // We can unwrap because the number is set in the constructor
        // and then only reset by the admin
        unsafe { env.storage().instance().get(THE_NUMBER).unwrap_unchecked() }
    }

    /// Get current admin
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(ADMIN_KEY)
    }

    /// Set a new admin. Only callable by admin.
    pub fn set_admin(env: &Env, admin: Address) {
        // Check if admin is already set
        if env.storage().instance().has(ADMIN_KEY) {
            panic!("admin already set");
        }
        env.storage().instance().set(ADMIN_KEY, &admin);
    }

    /// Private helper function to require auth from the admin
    fn require_admin(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        admin.require_auth();
    }
}

mod test;
