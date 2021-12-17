
import { readFile } from 'fs/promises';
import * as fs from "fs"


const proposal_ids = [1,3,4,5,6,7,8];

var main = async () => {

    var airdrops = [];

    // Load snapshot
    var snapshot = JSON.parse(await readFile(
        new URL(`./snapshot.json`, import.meta.url)
    ))

    // load addresses who voted all the proposals
    var allVoters = JSON.parse(await readFile(
        new URL(`./votes/allvoters.json`, import.meta.url)
    ))

    // load addresses who voted at least one proposal
    var uniqueVoters = JSON.parse(await readFile(
        new URL(`./votes/unique_voters.json`, import.meta.url)
    ))

    var validators = snapshot.app_state.staking.validators

    // Validators out of first 20 positions 
    var smallValidators = validators.sort((a, b) => parseInt(a.tokens) > parseInt(b.tokens) ? -1 : 1).slice(20).map((el) => el.operator_address)

    // Loop all delegators
    var delegations = snapshot.app_state.staking.delegations;

    // console.log(delegations.filter((el) => el.delegator_address == "juno1s33zct2zhhaf60x4a90cpe9yquw99jj0zen8pt"))

    for (var delegation of delegations) {

        var curAirdrop = airdrops.find((el) => el.address == delegation.delegator_address);

        var isSmallValidator = smallValidators.indexOf(delegation.validator_address) !== -1;

        if (curAirdrop === undefined) {
            airdrops.push({
                address: delegation.delegator_address,
                delegation_amount: parseInt(delegation.shares),
                smallValidatorCount: isSmallValidator ? 1 : 0
            })
        } else 
        {
            curAirdrop.delegation_amount += parseInt(delegation.shares);

            if (isSmallValidator) {
                curAirdrop.smallValidatorCount++;
            }
        }
    }

    // Remove < 25 juno delgations
    console.log(`Unique delegators: ${airdrops.length}`)
    airdrops = airdrops.filter((el => el.delegation_amount >= 25000000));
    console.log(`Unique delegators > 25 juno: ${airdrops.length}`)

    // Loop all airdrops
    var totalSupply = 0;
    for (var airdrop of airdrops) {
        airdrop.base_airdrop = 1000000;
        airdrop.one_proposal_bonus = uniqueVoters.indexOf(airdrop.address) !== -1 ? 10000000 : 0;
        airdrop.all_proposal_bonus = allVoters.indexOf(airdrop.address) !== -1 ? 5000000 : 0;
        airdrop.small_validators_bonus = airdrop.smallValidatorCount > 0 ? 200000 : 0;
        airdrop.total_airdrop = airdrop.base_airdrop + airdrop.one_proposal_bonus + airdrop.all_proposal_bonus  + airdrop.small_validators_bonus;
        totalSupply += airdrop.total_airdrop;
    }

    console.log(airdrops.filter((el) => el.address == "juno1s33zct2zhhaf60x4a90cpe9yquw99jj0zen8pt"))

    console.log(totalSupply)

    try {
        fs.writeFileSync(`airdrop.json`, JSON.stringify(airdrops, null, 4))
    } catch (err) {
        console.error(err)
    }

    // Debug
    // var i = 1;
    // for (var val of validatorSorted) {
    //     console.log(`#${i} ${val.description.moniker}: ${(parseInt(val.tokens) / 1000000).toFixed(2)} JUNO`)
    //     i++;
    // }
} 

main();