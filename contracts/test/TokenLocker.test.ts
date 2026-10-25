import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { TokenLocker, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenLocker", function () {
  let tokenLocker: TokenLocker;
  let mockToken: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_MINT = ethers.parseEther("10000");
  const LOCK_AMOUNT = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const TokenLockerFactory = await ethers.getContractFactory("TokenLocker");
    tokenLocker = await TokenLockerFactory.deploy();
    await tokenLocker.waitForDeployment();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Give user1 some tokens
    await mockToken.transfer(user1.address, INITIAL_MINT);
    // User1 approves TokenLocker
    await mockToken.connect(user1).approve(await tokenLocker.getAddress(), ethers.MaxUint256);
  });

  describe("Lock Creation", function () {
    it("should allow a user to lock tokens successfully", async function () {
      const now = await time.latest();
      const unlockTime = now + 86400 * 30; // 30 days

      await expect(
        tokenLocker
          .connect(user1)
          .lockTokens(await mockToken.getAddress(), LOCK_AMOUNT, unlockTime, "Community Reserve")
      )
        .to.emit(tokenLocker, "TokensLocked")
        .withArgs(
          1,
          await mockToken.getAddress(),
          user1.address,
          LOCK_AMOUNT,
          unlockTime,
          "Community Reserve",
          now + 1
        );

      const lock = await tokenLocker.getLock(1);
      expect(lock.id).to.equal(1);
      expect(lock.owner).to.equal(user1.address);
      expect(lock.token).to.equal(await mockToken.getAddress());
      expect(lock.amount).to.equal(LOCK_AMOUNT);
      expect(lock.unlockTimestamp).to.equal(unlockTime);
      expect(lock.isWithdrawn).to.equal(false);
      expect(lock.title).to.equal("Community Reserve");

      expect(await tokenLocker.totalLocks()).to.equal(1);
      const userLocks = await tokenLocker.getUserLocks(user1.address);
      expect(userLocks.length).to.equal(1);
      expect(userLocks[0]).to.equal(1);
    });

    it("should revert if locking zero amount", async function () {
      const now = await time.latest();
      await expect(
        tokenLocker.connect(user1).lockTokens(await mockToken.getAddress(), 0, now + 1000, "Zero Amount")
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("should revert if unlock time is in the past", async function () {
      const now = await time.latest();
      await expect(
        tokenLocker.connect(user1).lockTokens(await mockToken.getAddress(), LOCK_AMOUNT, now - 100, "Past Time")
      ).to.be.revertedWith("Unlock time must be in the future");
    });
  });

  describe("Withdrawals", function () {
    let unlockTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      unlockTime = now + 86400 * 7; // 7 days
      await tokenLocker
        .connect(user1)
        .lockTokens(await mockToken.getAddress(), LOCK_AMOUNT, unlockTime, "7-day lock");
    });

    it("should prevent early withdrawals", async function () {
      await expect(tokenLocker.connect(user1).withdraw(1)).to.be.revertedWith(
        "Tokens are still locked"
      );
    });

    it("should prevent unauthorized users from withdrawing", async function () {
      await time.increaseTo(unlockTime + 1);
      await expect(tokenLocker.connect(user2).withdraw(1)).to.be.revertedWith(
        "Only lock owner can withdraw"
      );
    });

    it("should allow rightful owner to withdraw after expiry", async function () {
      await time.increaseTo(unlockTime + 1);

      const balBefore = await mockToken.balanceOf(user1.address);
      await expect(tokenLocker.connect(user1).withdraw(1))
        .to.emit(tokenLocker, "TokensWithdrawn")
        .withArgs(1, await mockToken.getAddress(), user1.address, LOCK_AMOUNT, unlockTime + 2);

      const balAfter = await mockToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.equal(LOCK_AMOUNT);

      const lock = await tokenLocker.getLock(1);
      expect(lock.isWithdrawn).to.equal(true);
    });

    it("should prevent double withdrawals", async function () {
      await time.increaseTo(unlockTime + 1);
      await tokenLocker.connect(user1).withdraw(1);

      await expect(tokenLocker.connect(user1).withdraw(1)).to.be.revertedWith(
        "Tokens already withdrawn"
      );
    });
  });

  describe("Extend Lock", function () {
    let unlockTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      unlockTime = now + 86400 * 10;
      await tokenLocker
        .connect(user1)
        .lockTokens(await mockToken.getAddress(), LOCK_AMOUNT, unlockTime, "Initial Lock");
    });

    it("should allow owner to extend unlock time", async function () {
      const newUnlock = unlockTime + 86400 * 20;
      await expect(tokenLocker.connect(user1).extendLock(1, newUnlock))
        .to.emit(tokenLocker, "LockExtended")
        .withArgs(1, unlockTime, newUnlock);

      const lock = await tokenLocker.getLock(1);
      expect(lock.unlockTimestamp).to.equal(newUnlock);
    });

    it("should revert if new unlock time is not greater than existing", async function () {
      await expect(
        tokenLocker.connect(user1).extendLock(1, unlockTime - 100)
      ).to.be.revertedWith("New unlock time must be after current unlock time");
    });

    it("should revert if non-owner tries to extend", async function () {
      await expect(
        tokenLocker.connect(user2).extendLock(1, unlockTime + 1000)
      ).to.be.revertedWith("Only lock owner can extend lock");
    });
  });

  describe("Transfer Ownership", function () {
    let unlockTime: number;

    beforeEach(async function () {
      const now = await time.latest();
      unlockTime = now + 86400 * 5;
      await tokenLocker
        .connect(user1)
        .lockTokens(await mockToken.getAddress(), LOCK_AMOUNT, unlockTime, "Vesting Grant");
    });

    it("should allow owner to transfer lock to another address", async function () {
      await expect(tokenLocker.connect(user1).transferLockOwnership(1, user2.address))
        .to.emit(tokenLocker, "LockOwnershipTransferred")
        .withArgs(1, user1.address, user2.address);

      const lock = await tokenLocker.getLock(1);
      expect(lock.owner).to.equal(user2.address);

      // Verify user2 now has this lock
      const user2Locks = await tokenLocker.getUserLocks(user2.address);
      expect(user2Locks).to.include(1n);

      // After expiry, user2 can withdraw and user1 cannot
      await time.increaseTo(unlockTime + 1);
      await expect(tokenLocker.connect(user1).withdraw(1)).to.be.revertedWith(
        "Only lock owner can withdraw"
      );

      const balBefore = await mockToken.balanceOf(user2.address);
      await tokenLocker.connect(user2).withdraw(1);
      const balAfter = await mockToken.balanceOf(user2.address);
      expect(balAfter - balBefore).to.equal(LOCK_AMOUNT);
    });
  });

  describe("Batch and View Queries", function () {
    it("should return batch locks correctly", async function () {
      const now = await time.latest();
      await tokenLocker.connect(user1).lockTokens(await mockToken.getAddress(), 100, now + 1000, "Lock A");
      await tokenLocker.connect(user1).lockTokens(await mockToken.getAddress(), 200, now + 2000, "Lock B");

      const batch = await tokenLocker.getLocksBatch([1n, 2n]);
      expect(batch.length).to.equal(2);
      expect(batch[0].title).to.equal("Lock A");
      expect(batch[1].title).to.equal("Lock B");
    });
  });
});
