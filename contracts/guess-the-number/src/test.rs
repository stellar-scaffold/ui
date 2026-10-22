#![cfg(test)]
// Tests can use Rust's standard library even though the contract is no_std.
extern crate std;

use super::*;
use soroban_sdk::{
    Address, Env, IntoVal,
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token::{StellarAssetClient, TokenClient},
};

fn init_test<'a>(env: &'a Env) -> (Address, StellarAssetClient<'a>, GuessTheNumberClient<'a>) {
    let admin = Address::generate(env);
    // Skip signature checks while preparing the test's accounts and balances.
    // Tests that check authorization supply their own mocks afterward.
    env.mock_all_auths();
    let contract_id = env.register(GuessTheNumber, (&admin,));
    let client = GuessTheNumberClient::new(env, &contract_id);
    // Create the asset outside contract invocations, after the game exists.
    let asset = xlm::register(env, &admin, &contract_id);
    let sac = StellarAssetClient::new(env, &asset.address());
    // Mint a starting balance for the admin. On testnet, use Friendbot instead.
    sac.mint(&admin, &xlm::to_stroops(10_000));
    // Clear setup's auth mocks so each test chooses what to authorize.
    env.set_auths(&[]);
    (admin, sac, client)
}

#[test]
fn constructed_correctly() {
    let env = &Env::default();
    let (admin, sac, client) = init_test(env);
    assert_eq!(client.admin(), Some(admin.clone()));
    // Deployment doesn't take funds or start a round; after-deploy calls reset.
    assert_eq!(sac.balance(&admin), xlm::to_stroops(10_000));
    assert_eq!(sac.balance(&client.address), 0);
    let alice = Address::generate(env);
    assert!(client.try_guess(&4, &alice).is_err());
}

#[test]
fn only_admin_can_reset() {
    let env = &Env::default();
    let (admin, sac, client) = init_test(env);
    let user = Address::generate(env);

    set_caller(&client, &user);
    assert!(client.try_reset().is_err());
    assert_eq!(sac.balance(&client.address), 0);
    assert_eq!(sac.balance(&admin), xlm::to_stroops(10_000));

    set_caller(&client, &admin);
    assert!(client.try_reset().is_ok());
    assert_eq!(sac.balance(&client.address), xlm::to_stroops(1));
    assert_eq!(sac.balance(&admin), xlm::to_stroops(9_999));
}

#[test]
fn only_current_admin_can_transfer_administration() {
    let env = &Env::default();
    let (admin, sac, client) = init_test(env);
    let new_admin = Address::generate(env);
    // Give the new admin enough XLM to fund a round after taking over.
    env.mock_all_auths();
    sac.mint(&new_admin, &xlm::to_stroops(1));
    env.set_auths(&[]);

    // No authorization means no change to the stored admin.
    assert!(client.try_set_admin(&new_admin).is_err());
    assert_eq!(client.admin(), Some(admin.clone()));

    let transfer = MockAuthInvoke {
        contract: &client.address,
        fn_name: "set_admin",
        args: (&new_admin,).into_val(env),
        sub_invokes: &[],
    };
    // The proposed new admin cannot authorize their own appointment.
    env.mock_auths(&[MockAuth {
        address: &new_admin,
        invoke: &transfer,
    }]);
    assert!(client.try_set_admin(&new_admin).is_err());
    assert_eq!(client.admin(), Some(admin.clone()));

    // Only the currently stored admin can authorize the transfer.
    env.mock_auths(&[MockAuth {
        address: &admin,
        invoke: &transfer,
    }]);
    client.set_admin(&new_admin);
    assert_eq!(client.admin(), Some(new_admin.clone()));
    assert!(client.try_set_admin(&new_admin).is_err());
    assert_eq!(client.admin(), Some(new_admin.clone()));

    // Reset permissions move to the new admin, who now funds the pot.
    set_caller(&client, &admin);
    assert!(client.try_reset().is_err());
    set_caller(&client, &new_admin);
    client.reset();
    assert_eq!(sac.balance(&client.address), xlm::to_stroops(1));
    assert_eq!(sac.balance(&new_admin), 0);
    assert_eq!(sac.balance(&admin), xlm::to_stroops(10_000));
}

#[test]
fn guess() {
    let env = &Env::default();
    let (_, sac, client) = init_test(env);
    // Focus this test on gameplay, without specifying every nested token auth.
    env.mock_all_auths();
    client.reset();

    let alice = Address::generate(env);
    // Give Alice enough to make a paid guess; Bob starts with no funds.
    sac.mint(&alice, &xlm::to_stroops(2));
    let bob = Address::generate(env);

    // The first round's deterministic test number is 4.
    // A wrong guess costs Alice 1 XLM, which is added to the prize pot.
    assert!(!client.guess(&3, &alice));
    assert_eq!(sac.balance(&alice), xlm::to_stroops(1));
    // Bob can't pay the fee, so the contract returns its custom transfer error.
    assert_eq!(
        client.try_guess(&3, &bob).unwrap_err(),
        Ok(Error::FailedToTransferFromGuesser)
    );

    // The winner receives the initial pot plus the previous wrong guess's fee.
    assert!(client.guess(&4, &alice));
    assert_eq!(sac.balance(&alice), xlm::to_stroops(3));
    // A second winning guess can't claim the same pot again.
    assert_eq!(
        client.try_guess(&4, &alice).unwrap_err(),
        Ok(Error::NoBalanceToTransfer)
    );
}

#[test]
fn reset_and_guess() {
    let env = &Env::default();
    let (admin, sac, client) = init_test(env);
    env.mock_all_auths();

    // Start the first round, just as scaffold.yml's after-deploy hook does.
    client.reset();
    let alice = Address::generate(env);
    assert!(client.guess(&4, &alice));
    assert_eq!(sac.balance(&client.address), 0);

    // Reset replenishes the pot after a win and chooses a new number.
    client.reset();
    assert_eq!(sac.balance(&client.address), xlm::to_stroops(1));
    assert_eq!(sac.balance(&admin), xlm::to_stroops(9_998));
    assert!(client.guess(&10, &alice));
    assert_eq!(sac.balance(&alice), xlm::to_stroops(2));
    assert_eq!(sac.balance(&client.address), 0);

    // Resetting an unclaimed round adds to the pot instead of replacing it.
    client.reset();
    client.reset();
    assert_eq!(sac.balance(&client.address), xlm::to_stroops(2));
    assert_eq!(sac.balance(&admin), xlm::to_stroops(9_996));
}

#[test]
fn reset_without_funds_does_not_change_round() {
    let env = &Env::default();
    let (admin, sac, client) = init_test(env);
    env.mock_all_auths();
    client.reset();
    // as_contract lets test code read storage in the game's contract context.
    let number = env.as_contract(&client.address, || GuessTheNumber::number(env));
    let recipient = Address::generate(env);
    let token = TokenClient::new(env, &sac.address);
    // Empty the admin's wallet so funding the next round will fail.
    token.transfer(&admin, &recipient, &token.balance(&admin));
    // A failed transfer rolls back reset: the existing pot and number survive.

    assert!(client.try_reset().is_err());
    assert_eq!(sac.balance(&client.address), xlm::to_stroops(1));
    assert_eq!(
        env.as_contract(&client.address, || GuessTheNumber::number(env)),
        number
    );
}

// Authorize reset and its nested transfer, rather than mocking every caller.
fn set_caller(client: &GuessTheNumberClient, caller: &Address) {
    let env = &client.env;
    let asset = env.as_contract(&client.address, || xlm::contract_id(env));
    env.mock_auths(&[MockAuth {
        address: caller,
        invoke: &MockAuthInvoke {
            contract: &client.address,
            fn_name: "reset",
            args: ().into_val(env),
            // The admin authorizes both reset and the token transfer it calls.
            sub_invokes: &[MockAuthInvoke {
                contract: &asset,
                fn_name: "transfer",
                args: (caller, &client.address, xlm::to_stroops(1)).into_val(env),
                sub_invokes: &[],
            }],
        },
    }]);
}
