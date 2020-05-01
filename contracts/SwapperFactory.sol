pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "./lib/TotlePrimary.sol";
import "./Swapper.sol";

contract SwapperFactory {
  address public admin;
  address public swapperLibrary;

  event SwapPerformed(
    address indexed user
  );

  modifier onlyAdmin() {
    require(msg.sender == admin, 'Only the admin address can call this function.');
    _;
  }

  constructor(address _swapperLibrary) public {
    admin = msg.sender;
    swapperLibrary = _swapperLibrary;
  }

  function performSwap(
    address payable user,
    address srcToken,
    address dstToken,
    string memory uniqueId,
    TotlePrimary primary,
    TotlePrimaryUtils.SwapCollection memory swapCollection
  ) public onlyAdmin() {
    performSwapWithCommission(user, srcToken, dstToken, 0, address(0), uniqueId, primary, swapCollection);
  }

  function performSwapWithCommission(
    address payable user,
    address srcToken,
    address dstToken,
    uint commissionAmount,
    address payable commissionDestination,
    string memory uniqueId,
    TotlePrimary primary,
    TotlePrimaryUtils.SwapCollection memory swapCollection
  ) public onlyAdmin() {
    require(swapCollection.swaps.length == 1, 'Must only be 1 swap');
    require(swapCollection.swaps[0].trades[0].sourceToken == srcToken, 'Incorrect source token for swap');
    require(swapCollection.swaps[0].redirectAddress == user, 'User address does not match swap redirect address');

    Swapper swapper = createClone(user, srcToken, dstToken, uniqueId);

    require(swapper.getBalance(srcToken) > 0, 'Swapper balance empty');
    if (commissionAmount > 0) {
      require(swapCollection.swaps[0].sourceAmount + commissionAmount == swapper.getBalance(srcToken), 'Token balance does not match swap amount with commission');
      swapper.claim(commissionDestination, srcToken, commissionAmount);
    } else {
      require(swapCollection.swaps[0].sourceAmount == swapper.getBalance(srcToken), 'Token balance does not match swap amount');
    }

    if (srcToken != address(0)) {
      address tokenTransferProxy = 0x74758AcFcE059f503a7E6B0fC2c8737600f9F2c4;
      swapper.approve(srcToken, tokenTransferProxy);
    }

    swapper.swap(primary, swapCollection);
    swapper.destroy(user);

    emit SwapPerformed(user);
  }

  function claimBalance(
    address payable user,
    address srcToken,
    address dstToken,
    string memory uniqueId,
    address token
  ) public onlyAdmin() {
    Swapper swapper = createClone(user, srcToken, dstToken, uniqueId);
    swapper.claim(user, token, swapper.getBalance(token));
    swapper.destroy(user);
  }

  function createClone(
    address user,
    address srcToken,
    address dstToken,
    string memory uniqueId
  ) private onlyAdmin() returns (Swapper) {
    bytes32 salt = computeCloneSalt(user, srcToken, dstToken, uniqueId);
    bytes memory bytecode = getCloneBytecode();

    address payable cloneAddress = computeAddress(salt);
    if (!isContract(cloneAddress)) {
      assembly {
        cloneAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
      }
    }

    return Swapper(cloneAddress);
  }

  function getCloneBytecode() public view returns (bytes memory) {
    bytes20 targetBytes = bytes20(swapperLibrary);

    bytes memory bytecode = new bytes(0x37);
    assembly {
      mstore(add(bytecode, 0x20), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(bytecode, 0x34), targetBytes)
      mstore(add(bytecode, 0x48), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
    }

    return bytecode;
  }

  function isContract(address _address) public view returns (bool) {
    uint32 size;
    assembly {
      size := extcodesize(_address)
    }
    return (size > 0);
  }

  function computeCloneSalt(address user, address srcToken, address dstToken, string memory uniqueId) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(user, srcToken, dstToken, uniqueId));
  }

  function computeAddress(bytes32 salt) public view returns (address payable) {
    bytes32 data = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(getCloneBytecode())));
    return address(bytes20(data << 96));
  }
}
