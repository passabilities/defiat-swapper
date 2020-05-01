pragma solidity ^0.5.16;

contract TestToken {
  mapping (address => uint256) private _balances;

  mapping (address => mapping (address => uint256)) private _allowances;

  function balanceOf(address account) public view returns (uint256) {
    return _balances[account];
  }

  function transfer(address recipient, uint256 amount) public returns (bool) {
    require(msg.sender != address(0), "ERC20: transfer from the zero address");
    require(recipient != address(0), "ERC20: transfer to the zero address");

    _balances[msg.sender] = _balances[msg.sender] - amount;
    _balances[recipient] = _balances[recipient] + amount;

    return true;
  }

  function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
    transfer(recipient, amount);
    approve(sender, _allowances[sender][msg.sender] - amount);

    return true;
  }

  function approve(address spender, uint256 amount) public returns (bool) {
    require(msg.sender != address(0), "ERC20: approve from the zero address");
    require(spender != address(0), "ERC20: approve to the zero address");

    _allowances[msg.sender][spender] = amount;

    return true;
  }
}
