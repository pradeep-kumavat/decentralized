import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import { PlusCircle, CreditCard, Send, Tag, User, Wallet } from 'lucide-react';

function App() {
  const CONTRACT_ADDRESS = "0xf711dee5c44d04473ce3414de9d1813ed9e1588d";    //my contract address
  const ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getItemsByOwner",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "itemCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isSold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ownedItems",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "purchaseItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "transferItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Listen for account changes in MetaMask
        window.ethereum.on("accountsChanged", async (accounts) => {
          setAccount(accounts[0]);
          const signer = provider.getSigner();
          setSigner(signer);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          setContract(contract);
          loadItems(contract);
          loadOwnedItems(contract, accounts[0]);
        });

        try {
          const accounts = await provider.send("eth_requestAccounts", []);
          setAccount(accounts[0]);

          const signer = provider.getSigner();
          setSigner(signer);

          const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
          setContract(contract);

          await loadItems(contract);
          await loadOwnedItems(contract, accounts[0]);
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.log("Please install MetaMask!");
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadItems = async (contract) => {
    try {
      const itemCount = await contract.itemCount();
      let items = [];
      for (let i = 1; i <= itemCount; i++) {
        const item = await contract.items(i);
        items.push(item);
      }
      setItems(items);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadOwnedItems = async (contract, owner) => {
    try {
      const ownedItemIds = await contract.getItemsByOwner(owner);
      let ownedItems = [];
      for (let i = 0; i < ownedItemIds.length; i++) {
        const item = await contract.items(ownedItemIds[i]);
        ownedItems.push(item);
      }
      setOwnedItems(ownedItems);
    } catch (error) {
      console.error("Error loading owned items:", error);
    }
  };

  const listItem = async (name, price) => {
    if (!name || !price) {
      alert("Please provide both name and price");
      return;
    }
    
    try {
      const tx = await contract.listItem(name, ethers.utils.parseEther(price));
      await tx.wait();
      document.getElementById("itemName").value = "";
      document.getElementById("itemPrice").value = "";
      loadItems(contract);
    } catch (error) {
      console.error("Error listing item:", error);
    }
  };

  const purchaseItem = async (id, price) => {
    try {
      const tx = await contract.purchaseItem(id, { value: ethers.utils.parseEther(price) });
      await tx.wait();
      loadItems(contract);
      loadOwnedItems(contract, account);
    } catch (error) {
      console.error("Error purchasing item:", error);
    }
  };

  const transferItem = async (id, toAddress) => {
    if (!toAddress) {
      alert("Please provide a valid address");
      return;
    }
    
    try {
      const tx = await contract.transferItem(id, toAddress);
      await tx.wait();
      document.getElementById(`transferAddress${id}`).value = "";
      loadItems(contract);
      loadOwnedItems(contract, account);
    } catch (error) {
      console.error("Error transferring item:", error);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Decentralized Marketplace </h1>
        {account && (
          <div className="wallet-info">
            <Wallet size={16} />
            <span>{formatAddress(account)}</span>
          </div>
        )}
      </header>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Connecting to wallet...</p>
        </div>
      ) : (
        <>
          <div className="card list-item-card">
            <div className="card-header">
              <PlusCircle size={20} />
              <h2>List New Item</h2>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label htmlFor="itemName">Item Name</label>
                <input id="itemName" placeholder="What are you selling?" className="input-field" />
              </div>
              <div className="form-group">
                <label htmlFor="itemPrice">Price (ETH)</label>
                <input id="itemPrice" placeholder="0.00" className="input-field" />
              </div>
              <button className="button primary-button" onClick={() => listItem(
                document.getElementById("itemName").value,
                document.getElementById("itemPrice").value
              )}>
                <Tag size={16} />
                <span>List Item</span>
              </button>
            </div>
          </div>

          <section className="marketplace-section">
            <div className="section-header">
              <Tag size={20} />
              <h2>Items for Sale</h2>
            </div>
            
            {items.length === 0 ? (
              <div className="empty-state">No items available for sale</div>
            ) : (
              <div className="items-grid">
                {items.map((item) => (
                  <div key={item.id} className="card item-card">
                    <div className="item-image">
                      <span>{item.name.charAt(0)}</span>
                    </div>
                    <div className="card-content">
                      <h3>{item.name}</h3>
                      <div className="item-details">
                        <span className="item-price">{ethers.utils.formatEther(item.price)} ETH</span>
                        <span className="item-owner">
                          <User size={14} />
                          {formatAddress(item.owner)}
                        </span>
                      </div>
                      
                      {!item.isSold && item.owner.toLowerCase() !== account.toLowerCase() && (
                        <button className="button primary-button full-width" 
                          onClick={() => purchaseItem(item.id, ethers.utils.formatEther(item.price))}>
                          <CreditCard size={16} />
                          <span>Purchase</span>
                        </button>
                      )}
                      
                      {item.isSold && (
                        <div className="sold-badge">Sold</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="owned-items-section">
            <div className="section-header">
              <User size={20} />
              <h2>Your Items</h2>
            </div>
            
            {ownedItems.length === 0 ? (
              <div className="empty-state">You don't own any items yet</div>
            ) : (
              <div className="items-grid">
                {ownedItems.map((item) => (
                  <div key={item.id} className="card item-card">
                    <div className="item-image">
                      <span>{item.name.charAt(0)}</span>
                    </div>
                    <div className="card-content">
                      <h3>{item.name}</h3>
                      <div className="item-details">
                        <span className="item-price">{ethers.utils.formatEther(item.price)} ETH</span>
                        <span className="item-owner">Owned by you</span>
                      </div>
                      
                      <div className="transfer-form">
                        <label htmlFor={`transferAddress${item.id}`}>Transfer to Address</label>
                        <div className="transfer-input-group">
                          <input 
                            id={`transferAddress${item.id}`} 
                            placeholder="0x..." 
                            className="input-field" 
                          />
                          <button className="button secondary-button" 
                            onClick={() => transferItem(item.id, document.getElementById(`transferAddress${item.id}`).value)}>
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="app-footer">
        <p>© 2025 NFT Marketplace - Powered by Ethereum</p>
      </footer>
    </div>
  );
}

export default App;