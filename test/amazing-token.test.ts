import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";

describe("TokenFarm", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let res: any;
  let tokenFarm: Contract;
  let amazingToken: Contract;
  let mockDai: Contract;

  const daiAmount: BigNumber = ethers.utils.parseEther("25000");

  beforeEach(async () => {
    const TokenFarm = await ethers.getContractFactory("TokenFarm");
    const AmazingToken = await ethers.getContractFactory("AmazingToken");
    const MockDai = await ethers.getContractFactory("MockERC20");
    mockDai = await MockDai.deploy("MockDai", "mDAI");

    [owner, alice, bob] = await ethers.getSigners();
    await Promise.all([
      mockDai.mint(owner.address, daiAmount),
      mockDai.mint(alice.address, daiAmount),
      mockDai.mint(bob.address, daiAmount),
    ]);
    amazingToken = await AmazingToken.deploy();
    tokenFarm = await TokenFarm.deploy(mockDai.address, amazingToken.address);
  });

  describe("Init", async () => {
    it("should initialize", async () => {
      expect(await amazingToken).to.be.ok;
      expect(await amazingToken).to.be.ok;
      expect(await mockDai).to.be.ok;
    });
  });

  describe("Stake", async () => {
    it("should accept DAI and update mapping", async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await mockDai.connect(alice).approve(tokenFarm.address, toTransfer);

      expect(await tokenFarm.isStaking(alice.address)).to.eq(false);

      expect(await tokenFarm.connect(alice).stake(toTransfer)).to.be.ok;

      expect(await tokenFarm.stakingBalance(alice.address)).to.eq(toTransfer);

      expect(await tokenFarm.isStaking(alice.address)).to.eq(true);
    });

    it("should update balance with multiple stakes", async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await mockDai.connect(alice).approve(tokenFarm.address, toTransfer);
      await tokenFarm.connect(alice).stake(toTransfer);

      await mockDai.connect(alice).approve(tokenFarm.address, toTransfer);
      await tokenFarm.connect(alice).stake(toTransfer);

      expect(await tokenFarm.stakingBalance(alice.address)).to.eq(
        ethers.utils.parseEther("200")
      );
    });

    it("should revert with not enough funds", async () => {
      let toTransfer = ethers.utils.parseEther("1000000");
      await mockDai.approve(tokenFarm.address, toTransfer);

      await expect(tokenFarm.connect(bob).stake(toTransfer)).to.be.revertedWith(
        "You cannot stake zero tokens"
      );
    });
  });

  describe("Unstake", async () => {
    beforeEach(async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await mockDai.connect(alice).approve(tokenFarm.address, toTransfer);
      await tokenFarm.connect(alice).stake(toTransfer);
    });

    it("should unstake balance from user", async () => {
      let toTransfer = ethers.utils.parseEther("100");
      await tokenFarm.connect(alice).unstake(toTransfer);

      res = await tokenFarm.stakingBalance(alice.address);
      expect(Number(res)).to.eq(0);

      expect(await tokenFarm.isStaking(alice.address)).to.eq(false);
    });
  });

  describe("WithdrawYield", async () => {
    beforeEach(async () => {
      await amazingToken.transferOwnership(tokenFarm.address);
      let toTransfer = ethers.utils.parseEther("10");
      await mockDai.connect(alice).approve(tokenFarm.address, toTransfer);
      await tokenFarm.connect(alice).stake(toTransfer);
    });

    it("should return correct yield time", async () => {
      let timeStart = await tokenFarm.startTime(alice.address);
      expect(Number(timeStart)).to.be.greaterThan(0);

      // Fast-forward time
      await time.increase(86400);

      expect(await tokenFarm.calculateYieldTime(alice.address)).to.eq(86400);
    });

    it("should mint correct token amount in total supply and user", async () => {
      await time.increase(86400);

      let _time = await tokenFarm.calculateYieldTime(alice.address);
      let formatTime = _time / 86400;
      let staked = await tokenFarm.stakingBalance(alice.address);
      let bal = staked * formatTime;
      let newBal = ethers.utils.formatEther(bal.toString());
      let expected = Number.parseFloat(newBal).toFixed(3);

      await tokenFarm.connect(alice).withdrawYield();

      res = await amazingToken.totalSupply();
      let newRes = ethers.utils.formatEther(res);
      let formatRes = Number.parseFloat(newRes).toFixed(3).toString();

      expect(expected).to.eq(formatRes);

      res = await amazingToken.balanceOf(alice.address);
      newRes = ethers.utils.formatEther(res);
      formatRes = Number.parseFloat(newRes).toFixed(3).toString();

      expect(expected).to.eq(formatRes);
    });

    it("should update yield balance when unstaked", async () => {
      await time.increase(86400);
      await tokenFarm.connect(alice).unstake(ethers.utils.parseEther("5"));

      res = await tokenFarm.amazingTokenBalance(alice.address);
      expect(Number(ethers.utils.formatEther(res))).to.be.approximately(
        10,
        0.001
      );
    });
  });
});
