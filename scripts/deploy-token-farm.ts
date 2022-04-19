import { ethers } from "hardhat";

const main = async () => {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with ${deployer.address}`);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockDai = await MockERC20.deploy("MockDai", "mDAI");
  console.log(`MockDai address: ${mockDai.address}`);

  const AmazingToken = await ethers.getContractFactory("AmazingToken");
  const amazingToken = await AmazingToken.deploy();
  console.log(`AmazingToken address: ${amazingToken.address}`);

  const TokenFarm = await ethers.getContractFactory("TokenFarm");
  const tokenFarm = await TokenFarm.deploy(
    mockDai.address,
    amazingToken.address
  );

  console.log(`TokenFarm address: ${tokenFarm.address}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
