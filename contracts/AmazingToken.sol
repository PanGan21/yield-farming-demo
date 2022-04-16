pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AmazingToken is ERC20, Ownable {
    onstructor() ERC20("AmazingToken", "AMZ") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
