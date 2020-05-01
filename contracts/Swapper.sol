pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "./SwapperFactory.sol";
import "./lib/TotlePrimary.sol";
import "./lib/ERC20.sol";

contract Swapper {
  function swap(
    TotlePrimary primary,
    TotlePrimaryUtils.SwapCollection calldata swapCollection
  ) external {
    primary.performSwapCollection.value(address(this).balance)(swapCollection);
  }

  function approve(address token, address spender) public {
    safeApprove(token, spender, getBalance(token));
  }

  function safeApprove(address _tokenAddress, address _spender, uint256 _value) internal returns (bool success) {
    (success,) = _tokenAddress.call(abi.encodeWithSignature("approve(address,uint256)", _spender, _value));
    require(success, "Approve failed");

    return fetchReturnData();
  }

  function fetchReturnData() internal pure returns (bool success) {
    assembly {
      switch returndatasize()
      case 0 {
        success := 1
      }
      case 32 {
        returndatacopy(0, 0, 32)
        success := mload(0)
      }
      default {
        revert(0, 0)
      }
    }
  }

  function getBalance(address token) public view returns (uint256) {
    return token == address(0)
      ? address(this).balance
      : ERC20(token).balanceOf(address(this));
  }

  function claim(address payable user, address token, uint amount) public {
    require(amount > 0, 'Claim amount must be positive');

    if (token == address(0)) {
      user.transfer(amount);
    } else {
      safeTransfer(token, user, amount);
    }
  }

  function safeTransfer(address _tokenAddress, address _to, uint256 _value) internal returns (bool success) {
    (success,) = _tokenAddress.call(abi.encodeWithSignature("transfer(address,uint256)", _to, _value));
    require(success, "Transfer failed");

    return fetchReturnData();
  }

  function destroy(address payable user) external {
    selfdestruct(user);
  }

  function() external payable {

  }
}