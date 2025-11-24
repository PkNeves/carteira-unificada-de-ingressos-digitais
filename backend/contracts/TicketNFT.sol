// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    enum Rarity {
        Common,      // 0 - 85%
        Rare,        // 1 - 10%
        Epic,        // 2 - 4%
        Legendary    // 3 - 1%
    }

    struct TicketInfo {
        uint256 id;              // hash do UUID do ticket
        string externalId;       // código externo do ticket
        string name;             // nome do ticket
        string description;      // descrição do ticket
        Rarity rarity;           // raridade calculada na mintagem
        string bannerUrl;        // URL do banner
        uint256 startDate;       // timestamp Unix do início
        uint256 amount;          // quantidade
        string seat;             // assento (opcional)
        string sector;           // setor (opcional)
        uint256 eventId;         // hash do UUID do evento
        string eventName;        // nome do evento
        uint256 createdAt;       // timestamp Unix de criação
    }

    mapping(uint256 => TicketInfo) public ticketInfo;
    mapping(uint256 => bool) public eventExists;

    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 indexed eventId,
        string externalId,
        Rarity rarity
    );

    event TicketTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    constructor(address initialOwner) ERC721("TicketNFT", "TKT") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    /**
     * Calcula a raridade do ticket baseado em probabilidades:
     * Common: 85% (0-84)
     * Rare: 10% (85-94)
     * Epic: 4% (95-98)
     * Legendary: 1% (99)
     */
    function _calculateRarity(address to, uint256 tokenId) private view returns (Rarity) {
        // Usa block.prevrandao (disponível após merge do Ethereum)
        // Combina múltiplas fontes de aleatoriedade para garantir imprevisibilidade
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            block.prevrandao,
            blockhash(block.number - 1),
            to,
            tokenId
        ))) % 100;
        
        if (random < 85) return Rarity.Common;      // 0-84 (85%)
        if (random < 95) return Rarity.Rare;        // 85-94 (10%)
        if (random < 99) return Rarity.Epic;        // 95-98 (4%)
        return Rarity.Legendary;                    // 99 (1%)
    }

    function mintTicket(
        address to,
        uint256 id,
        string memory externalId,
        string memory name,
        string memory description,
        string memory bannerUrl,
        uint256 startDate,
        uint256 amount,
        string memory seat,
        string memory sector,
        uint256 eventId,
        string memory eventName,
        uint256 createdAt,
        string memory metadataURI
    ) public returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 newTokenId = _nextTokenId;
        _nextTokenId++;

        // Calcula raridade usando o tokenId que será atribuído
        Rarity calculatedRarity = _calculateRarity(to, newTokenId);

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        ticketInfo[newTokenId] = TicketInfo({
            id: id,
            externalId: externalId,
            name: name,
            description: description,
            rarity: calculatedRarity,
            bannerUrl: bannerUrl,
            startDate: startDate,
            amount: amount,
            seat: seat,
            sector: sector,
            eventId: eventId,
            eventName: eventName,
            createdAt: createdAt
        });

        emit TicketMinted(newTokenId, to, eventId, externalId, calculatedRarity);
        
        return newTokenId;
    }

    function getTicketInfo(uint256 tokenId) public view returns (TicketInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return ticketInfo[tokenId];
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address previousOwner = super._update(to, tokenId, auth);
        
        if (previousOwner != address(0) && to != address(0)) {
            emit TicketTransferred(tokenId, previousOwner, to);
        }
        
        return previousOwner;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

