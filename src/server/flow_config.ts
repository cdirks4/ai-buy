import { config } from "dotenv";
import * as fcl from "@onflow/fcl";
import { sansPrefix } from "@onflow/util-address";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";

config();

const ec = new EC('p256');

const FLOW_ADDRESS = "0x05804c927df2c8e7";
const MNEMONIC = [
  "bread", "home", "welcome", "alone", "tunnel",
  "fat", "omit", "text", "brand", "trophy",
  "slender", "liquid"
].join(' ');

function generateKeyPair(mnemonic: string) {
  const hash = new SHA3(256);
  hash.update(mnemonic);
  const privateKey = hash.digest('hex');
  const keyPair = ec.keyFromPrivate(privateKey);
  return {
    privateKey: privateKey,
    publicKey: keyPair.getPublic('hex')
  };
}

const keyPair = generateKeyPair(MNEMONIC);

export const flowConfig = {
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "Vision Shop Assistant",
  "app.detail.icon": "https://placekitten.com/g/200/200",
  "0xProfile": FLOW_ADDRESS,
  "flow.network": "testnet",
  "flow.address": sansPrefix(FLOW_ADDRESS),
  "flow.keyId": 0,
  "flow.privateKey": keyPair.privateKey,
};

fcl.config(flowConfig);

export const setupWallet = async () => {
  return {
    address: FLOW_ADDRESS,
    keyId: 0,
    privateKey: keyPair.privateKey,
    signingFunction: async (data) => {
      const key = ec.keyFromPrivate(keyPair.privateKey);
      const sig = key.sign(Buffer.from(data.message, 'hex'));
      const signature = Buffer.from(sig.toDER()).toString('hex');

      return {
        addr: FLOW_ADDRESS,
        keyId: 0,
        signature
      };
    },
  };
};
