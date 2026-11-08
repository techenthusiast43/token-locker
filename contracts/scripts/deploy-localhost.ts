import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=========================================");
  console.log("🛠️ LOCALHOST HARDHAT DEPLOYMENT (Chain ID: 31337)");
  console.log("=========================================");
  console.log("Deployer account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance: ", ethers.formatEther(balance), "ETH");
  console.log("=========================================");

  // 1. Deploy TokenLocker
  console.log("Deploying TokenLocker locally...");
  const TokenLockerFactory = await ethers.getContractFactory("TokenLocker");
  const tokenLocker = await TokenLockerFactory.deploy();
  await tokenLocker.waitForDeployment();
  const tokenLockerAddress = await tokenLocker.getAddress();
  console.log("✅ TokenLocker deployed to:", tokenLockerAddress);

  // 2. Deploy MockERC20 test token
  console.log("Deploying MockERC20 (Local Test Token)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy("Local Test Token", "TEST", 18);
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("✅ MockERC20 deployed to: ", mockTokenAddress);

  console.log("=========================================");
  console.log("🎉 Localhost deployment successful!");
  console.log("TokenLocker Address:", tokenLockerAddress);
  console.log("Test Token Address: ", mockTokenAddress);
  console.log("=========================================");

  // Read existing addresses file to preserve Mainnet addresses
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

  // Preserve Mainnet as root/primary, add localhost config
  const updatedInfo = {
    network: "botChainMainnet",
    chainId: 677,
    tokenLocker: existingData.tokenLocker || "0xcA7110690a29728998034f833eAFa5341D98bD5f",
    deployedAt: existingData.deployedAt || new Date().toISOString(),
    rpc: "https://rpc.botchain.ai",
    explorer: "https://scan.botchain.ai",
    localhost: {
      chainId: 31337,
      tokenLocker: tokenLockerAddress,
      mockToken: mockTokenAddress,
      deployedAt: new Date().toISOString(),
      rpc: "http://127.0.0.1:8545",
    },
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(addressesFilePath, JSON.stringify(updatedInfo, null, 2));
  console.log("Saved local deployment info to frontend/src/contracts/addresses.json (Mainnet preserved!)");
}

main().catch((error) => {
  console.error("Local deployment error:", error);
  process.exitCode = 1;
});

