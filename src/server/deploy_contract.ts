import * as fcl from '@onflow/fcl';
import { readFileSync } from 'fs';
import { join } from 'path';
import { setupWallet } from './flow_config';

async function deployContract() {
    const wallet = await setupWallet();
    
    // Read contract code
    const contractCode = readFileSync(
        join(process.cwd(), 'src/contracts/PersonBounty.cdc'),
        'utf8'
    );

    try {
        const txId = await fcl.mutate({
            cadence: `
                transaction(code: String) {
                    prepare(signer: AuthAccount) {
                        signer.contracts.add(
                            name: "PersonBounty",
                            code: code.decodeHex()
                        )
                    }
                }
            `,
            args: (arg, t) => [arg(contractCode, t.String)],
            proposer: wallet,
            payer: wallet,
            authorizations: [wallet],
            limit: 1000
        });

        console.log('Contract deployment transaction:', txId);
        
        const tx = await fcl.tx(txId).onceSealed();
        console.log('Contract deployed successfully:', tx);
        
        return tx;
    } catch (error) {
        console.error('Failed to deploy contract:', error);
        throw error;
    }
}

deployContract().catch(console.error);