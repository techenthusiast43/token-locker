import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=========================================");
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH/BOT");
  console.log("=========================================");

  // 1. Deploy TokenLocker
  console.log("Deploying TokenLocker...");
  const TokenLockerFactory = await ethers.getContractFactory("TokenLocker");
  const tokenLocker = await TokenLockerFactory.deploy();
  await tokenLocker.waitForDeployment();
  const tokenLockerAddress = await tokenLocker.getAddress();
  console.log("TokenLocker deployed to:", tokenLockerAddress);

  // 2. Deploy MockERC20 test token for testing
  console.log("Deploying MockERC20 (Test Token)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy("Test Token", "TEST", 18);
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("MockERC20 deployed to:", mockTokenAddress);

  console.log("=========================================");
  console.log("Deployment completed successfully!");
  console.log("TokenLocker:", tokenLockerAddress);
  console.log("MockERC20:  ", mockTokenAddress);
  console.log("=========================================");

  // Export contract deployment addresses for frontend
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    tokenLocker: tokenLockerAddress,
    mockToken: mockTokenAddress,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "addresses.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment addresses saved to frontend/src/contracts/addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
