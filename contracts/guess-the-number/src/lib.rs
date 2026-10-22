#![no_std]
use soroban_sdk::{
    Address, BytesN, ContractExecutable, Env, Symbol, contract, contractimpl, symbol_short,
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
    /// Set the admin. Call reset after deployment to fund and start the game.
    pub fn __constructor(env: &Env, admin: Address) {
        // Require the chosen admin to authorize setting up the game.
        admin.require_auth();
        // Remember the admin so later calls can check who is allowed to reset.
        env.storage().instance().set(ADMIN_KEY, &admin);
    }

    /// Add 1 XLM to the pot and choose a new number. Only callable by admin.
    pub fn reset(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        // Only the admin can reset the game and authorize spending their XLM.
        admin.require_auth();
        // Ensure the XLM contract exists on the network. Unit tests create
        // their own asset in test setup, outside contract invocations.
        #[cfg(not(test))]
        xlm::register(env);
        // Seed the pot with 1 XLM from the admin for players to win.
        xlm::token_client(env).transfer(
            &admin,
            env.current_contract_address(),
            &xlm::to_stroops(1),
        );
        // Store a new number between 1 and 10 for this round.
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

    /// Upgrade the contract to new wasm. Only callable by admin.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer()
            .update_current_contract(ContractExecutable::Wasm(new_wasm_hash));
    }

    /// readonly function to get the current number
    /// `pub(crate)` makes it accessible in the same crate, but not outside of it
    pub(crate) fn number(env: &Env) -> u64 {
        env.storage()
            .instance()
            .get(THE_NUMBER)
            .expect("game not started; call reset first")
    }

    /// Get current admin
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(ADMIN_KEY)
    }
    /// Transfer administration to a new address. Only callable by the current admin.
    pub fn set_admin(env: &Env, new_admin: Address) {
        // Check the stored admin's authorization before replacing their address.
        Self::require_admin(env);
        env.storage().instance().set(ADMIN_KEY, &new_admin);
    }

    /// Private helper function to require auth from the admin
    fn require_admin(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        admin.require_auth();
    }
}

mod test;
