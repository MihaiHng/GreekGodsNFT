//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "contracts/access/Ownable.sol";
import "contracts/security/ReentrancyGuard.sol";

contract GreekGodsNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    string public baseURI;
    string public baseExtension = ".json";
    uint256 public cost = 0.005 ether;
    uint256 public presaleCost = 0.003 ether;
    uint256 public maxSupply = 52;
    //uint256 public maxMintAmount = 1;
    uint256 public maxMintAmountPerWallet = 1;
    bool public paused = false;

    mapping(address => bool) public whitelisted;
    mapping(address => bool) public presaleWallets;
    mapping(address => uint256) public addressMintedBalance;

    event Minted(address indexed to, uint256 amount);
    event UserWhitelisted(address indexed user);
    event UserRemovedFromWhitelist(address indexed user);
    event PresaleUserAdded(address indexed user);
    event PresaleUserRemoved(address indexed user);
    event PresaleUsersAdded(address[] users);
    event CostUpdated(uint256 newCost);
    event PresaleCostUpdated(uint256 newCost);
    event MaxMintAmountPerWalletUpdated(uint256 newMaxMintAmountPerWallet);
    event BaseURISet(string newBaseURI);
    event BaseExtensionSet(string newBaseExtension);
    event Paused(bool state);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);
        //mint(msg.sender, 1);
    }

    // Internal function to return the base URI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // Public mint function
    function mint(address _to, uint256 _mintAmount) public payable {
        require(!paused, "Minting is paused");
        require(_mintAmount > 0, "You need to mint at least 1 NFT");
        //require(_mintAmount <= maxMintAmount, "Exceeded max mint amount");
        require(totalSupply() + _mintAmount <= maxSupply, "Max supply exceeded");

        uint256 ownerMintedCount = addressMintedBalance[msg.sender];
        require(ownerMintedCount + _mintAmount <= maxMintAmountPerWallet, "Exceeded max mint amount per wallet(1 mint per wallet)");

        uint256 mintValue = (msg.sender == owner() || whitelisted[msg.sender]) ? 
                                0 : (presaleWallets[msg.sender] ? presaleCost : cost) * _mintAmount;
        require(msg.value >= mintValue, "Insufficient funds");

        for (uint256 i = 1; i <= _mintAmount; ++i) {
            _safeMint(_to, totalSupply() + 1);
            addressMintedBalance[msg.sender]++;
        }

        emit Minted(_to, _mintAmount);
    }

    // Function to get all token IDs owned by an address
    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i = 0; i < ownerTokenCount; ++i) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    // Function to return the token URI
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    //only owner functions
    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
        emit CostUpdated(_newCost);

    }

    function setPresaleCost(uint256 _newCost) public onlyOwner {
        presaleCost = _newCost;
        emit PresaleCostUpdated(_newCost);
    }

    /*function setMaxMintAmount(uint256 _newMaxMintAmount) public onlyOwner {
        maxMintAmount = _newMaxMintAmount;
    }*/

    function setMaxMintAmountPerWallet(uint256 _newMaxMintAmountPerWallet) public onlyOwner {
        maxMintAmountPerWallet = _newMaxMintAmountPerWallet;
        emit MaxMintAmountPerWalletUpdated(_newMaxMintAmountPerWallet);
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURISet(_newBaseURI);
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
        emit BaseExtensionSet(_newBaseExtension);
    }

    function pause(bool _state) public onlyOwner {
        paused = _state;
        emit Paused(_state);
    }

    function whitelistUser(address _user) public onlyOwner {
        whitelisted[_user] = true;
        emit UserWhitelisted(_user);
    }

    function removeWhitelistUser(address _user) public onlyOwner {
        whitelisted[_user] = false;
        emit UserRemovedFromWhitelist(_user);
    }

    function addPresaleUser(address _user) public onlyOwner {
        presaleWallets[_user] = true;
        emit PresaleUserAdded(_user);

    }

    function add100PresaleUsers(address[100] memory _users) public onlyOwner {
        address[] memory dynamicUsers = new address[](100);
        for (uint256 i = 0; i < 100; ++i) {
            presaleWallets[_users[i]] = true;
            dynamicUsers[i] = _users[i];
        }
        emit PresaleUsersAdded(dynamicUsers);
    }

    function removePresaleUser(address _user) public onlyOwner {
        presaleWallets[_user] = false;
        emit PresaleUserRemoved(_user);
    }

    function withdraw() public payable onlyOwner nonReentrant {
        uint256 balance = address(this).balance;

        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(msg.sender).call{
            value: balance
        }("");
        require(success, "Withdrawal failed");
    }
}
