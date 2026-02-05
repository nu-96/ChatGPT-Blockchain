// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Payment {
    address payable public owner;

    event PaymentReceived(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    constructor() {
        owner = payable(msg.sender);
    }

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // Function to accept plain Ether transactions
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Explicit payment function with metadata (optional)
    function pay() public payable {
        require(msg.value > 0, "Must send some Ether");
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Function to withdraw all funds to the owner's wallet
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
        emit Withdrawal(owner, balance);
    }

    // Helper to check contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
