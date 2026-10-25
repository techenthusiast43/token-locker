// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenLocker
 * @notice Trustless, non-custodial smart contract for locking ERC-20 tokens for a specified duration on BOT Chain.
 * @dev Tokens cannot be withdrawn until unlockTimestamp has passed. No admin backdoors or secret withdrawal mechanisms.
 */
contract TokenLocker is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Lock {
        uint256 id;
        address token;
        address owner;
        uint256 amount;
        uint256 unlockTimestamp;
        uint256 createdAt;
        bool isWithdrawn;
        string title;
    }

    uint256 public lockCount;
    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) private userLocks;
    mapping(address => uint256[]) private tokenLocks;

    // Events
    event TokensLocked(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 unlockTimestamp,
        string title,
        uint256 createdAt
    );

    event TokensWithdrawn(
        uint256 indexed lockId,
        address indexed token,
        address indexed owner,
        uint256 amount,
        uint256 withdrawnAt
    );

    event LockExtended(
        uint256 indexed lockId,
        uint256 oldUnlockTimestamp,
        uint256 newUnlockTimestamp
    );

    event LockOwnershipTransferred(
        uint256 indexed lockId,
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @notice Locks a specified amount of ERC-20 tokens until unlockTimestamp.
     * @param token Address of the ERC-20 token to lock.
     * @param amount Number of tokens to lock.
     * @param unlockTimestamp Unix timestamp after which tokens can be withdrawn.
     * @param title Optional human-readable description or title for the lock.
     * @return lockId The unique ID of the created lock.
     */
    function lockTokens(
        address token,
        uint256 amount,
        uint256 unlockTimestamp,
        string calldata title
    ) external nonReentrant returns (uint256 lockId) {
        require(token != address(0), "Token address cannot be zero");
        require(amount > 0, "Amount must be greater than zero");
        require(unlockTimestamp > block.timestamp, "Unlock time must be in the future");

        // Safely measure tokens received to support fee-on-transfer / deflationary tokens
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 receivedAmount = IERC20(token).balanceOf(address(this)) - balanceBefore;
        require(receivedAmount > 0, "No tokens received");

        lockCount++;
        lockId = lockCount;

        locks[lockId] = Lock({
            id: lockId,
            token: token,
            owner: msg.sender,
            amount: receivedAmount,
            unlockTimestamp: unlockTimestamp,
            createdAt: block.timestamp,
            isWithdrawn: false,
            title: title
        });

        userLocks[msg.sender].push(lockId);
        tokenLocks[token].push(lockId);

        emit TokensLocked(
            lockId,
            token,
            msg.sender,
            receivedAmount,
            unlockTimestamp,
            title,
            block.timestamp
        );
    }

    /**
     * @notice Withdraws locked tokens once the unlock period has elapsed.
     * @param lockId The unique identifier of the lock.
     */
    function withdraw(uint256 lockId) external nonReentrant {
        require(lockId > 0 && lockId <= lockCount, "Invalid lock ID");
        Lock storage lock = locks[lockId];

        require(msg.sender == lock.owner, "Only lock owner can withdraw");
        require(!lock.isWithdrawn, "Tokens already withdrawn");
        require(block.timestamp >= lock.unlockTimestamp, "Tokens are still locked");

        // Checks-Effects-Interactions
        lock.isWithdrawn = true;

        IERC20(lock.token).safeTransfer(lock.owner, lock.amount);

        emit TokensWithdrawn(
            lockId,
            lock.token,
            lock.owner,
            lock.amount,
            block.timestamp
        );
    }

    /**
     * @notice Allows the lock owner to extend the unlock timestamp.
     * @dev Unlock time can only ever be increased, never reduced.
     * @param lockId The unique identifier of the lock.
     * @param newUnlockTimestamp The new unlock timestamp (must be strictly greater than current unlockTimestamp).
     */
    function extendLock(uint256 lockId, uint256 newUnlockTimestamp) external nonReentrant {
        require(lockId > 0 && lockId <= lockCount, "Invalid lock ID");
        Lock storage lock = locks[lockId];

        require(msg.sender == lock.owner, "Only lock owner can extend lock");
        require(!lock.isWithdrawn, "Tokens already withdrawn");
        require(
            newUnlockTimestamp > lock.unlockTimestamp,
            "New unlock time must be after current unlock time"
        );

        uint256 oldUnlockTimestamp = lock.unlockTimestamp;
        lock.unlockTimestamp = newUnlockTimestamp;

        emit LockExtended(lockId, oldUnlockTimestamp, newUnlockTimestamp);
    }

    /**
     * @notice Allows the lock owner to transfer ownership of a lock to a new address.
     * @param lockId The unique identifier of the lock.
     * @param newOwner The new recipient / owner of the lock.
     */
    function transferLockOwnership(uint256 lockId, address newOwner) external nonReentrant {
        require(lockId > 0 && lockId <= lockCount, "Invalid lock ID");
        Lock storage lock = locks[lockId];

        require(msg.sender == lock.owner, "Only lock owner can transfer lock");
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != lock.owner, "New owner must be different from current owner");
        require(!lock.isWithdrawn, "Tokens already withdrawn");

        address previousOwner = lock.owner;
        lock.owner = newOwner;
        userLocks[newOwner].push(lockId);

        emit LockOwnershipTransferred(lockId, previousOwner, newOwner);
    }

    /**
     * @notice Returns lock details for a given lock ID.
     */
    function getLock(uint256 lockId) external view returns (Lock memory) {
        require(lockId > 0 && lockId <= lockCount, "Invalid lock ID");
        return locks[lockId];
    }

    /**
     * @notice Returns all lock IDs owned by a specific address.
     */
    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    /**
     * @notice Returns all lock IDs created for a specific token.
     */
    function getTokenLocks(address token) external view returns (uint256[] memory) {
        return tokenLocks[token];
    }

    /**
     * @notice Fetches multiple locks in a single batch query for optimal frontend performance.
     */
    function getLocksBatch(uint256[] calldata lockIds) external view returns (Lock[] memory) {
        uint256 length = lockIds.length;
        Lock[] memory batch = new Lock[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 id = lockIds[i];
            if (id > 0 && id <= lockCount) {
                batch[i] = locks[id];
            }
        }
        return batch;
    }

    /**
     * @notice Returns the total number of locks created.
     */
    function totalLocks() external view returns (uint256) {
        return lockCount;
    }
}
