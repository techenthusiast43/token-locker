import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("=========================================");
  console.log("🚀 BOT CHAIN MAINNET DEPLOYMENT");
  console.log("=========================================");
  console.log("Network Name:    ", network.name);
  console.log("Chain ID:        ", chainId);
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  const formattedBalance = ethers.formatEther(balance);
  console.log("Account Balance: ", formattedBalance, "BOT");
  console.log("=========================================");

  if (chainId !== 677) {
    console.warn(`⚠️ Warning: Expected Chain ID 677 for BOT Chain Mainnet, but connected to ${chainId}.`);
  }

  if (balance === 0n) {
    console.error("\n❌ INSUFFICIENT FUNDS ERROR:");
    console.error(`The deployer wallet ${deployer.address} has 0 BOT on Mainnet.`);
    console.error("Please send a small amount of native BOT (e.g. 0.1 - 0.5 BOT) to this address to pay for deployment gas.");
    console.error("RPC URL: https://rpc.botchain.ai");
    console.error("Explorer: https://scan.botchain.ai/address/" + deployer.address);
    process.exit(1);
  }

  console.log("\n📦 Deploying TokenLocker smart contract (Mainnet)...");
  const TokenLockerFactory = await ethers.getContractFactory("TokenLocker");
  const tokenLocker = await TokenLockerFactory.deploy();
  await tokenLocker.waitForDeployment();

  const tokenLockerAddress = await tokenLocker.getAddress();
  const deploymentTx = tokenLocker.deploymentTransaction();

  console.log("\n=========================================");
  console.log("🎉 MAINNET DEPLOYMENT SUCCESSFUL!");
  console.log("TokenLocker Address:", tokenLockerAddress);
  if (deploymentTx) {
    console.log("Transaction Hash:   ", deploymentTx.hash);
    console.log("Explorer URL:       ", `https://scan.botchain.ai/tx/${deploymentTx.hash}`);
  }
  console.log("=========================================");

  // Read existing addresses file to preserve testnet configuration if present
  const outputDir = path.join(__dirname, "../../frontend/src/contracts");
  const addressesFilePath = path.join(outputDir, "addresses.json");

  let existingData: any = {};
  if (fs.existsSync(addressesFilePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(addressesFilePath, "utf8"));
    } catch {
      existingData = {};
    }
  }

  const deploymentInfo = {
    network: "botChainMainnet",
    chainId: 677,
    tokenLocker: tokenLockerAddress,
    mockToken: "", // No mock tokens on mainnet
    deployedAt: new Date().toISOString(),
    testnet: {
      chainId: 968,
      tokenLocker: existingData.testnet?.tokenLocker || existingData.tokenLocker || "0x5Ed2E76ef698cAdf1905C5FD8de89a4dA786ae52",
      mockToken: existingData.testnet?.mockToken || existingData.mockToken || "0xBb6987f6981B31BE9e76829A6eBCa743634b8094",
    },
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(addressesFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Mainnet deployment details saved to frontend/src/contracts/addresses.json");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

