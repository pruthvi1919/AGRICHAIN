# AgriChain - Supply Chain Management in Agriculture Using Blockchain

AgriChain is a blockchain-based supply chain platform that connects **farmers, distributors, and buyers** directly, removing the exploitation caused by middlemen in traditional agricultural trade. It combines Ethereum smart contracts, a full-stack JavaScript application, and a machine learning price-prediction module to make agricultural trading transparent, secure, and accessible.

## Problem It Solves

Farmers often lose a significant share of their profits to middlemen who manipulate prices and delay payments. AgriChain creates a direct, traceable chain between farmers and buyers/distributors, backed by blockchain immutability, so every transaction - from crop listing to final sale - is transparent and tamper-proof.

## Key Features

- **Role-based dashboards** for Farmers, Distributors, Buyers, and Admin
- **Blockchain-backed crop listings** - every crop listing, purchase, and resale is recorded immutably via Ethereum smart contracts
- **Crop image upload & verification** so buyers can see what they're purchasing
- **Full traceability** - track a crop's journey from farmer → distributor → buyer
- **Real-time market price dashboard** with historical price trend charts
- **ML-based crop price prediction** by state, commodity, and month
- **Multilingual UI** (English, Hindi, Kannada) so farmers can use the platform in their preferred language
- **Secure authentication** using JWT and bcrypt password hashing

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Tailwind CSS, i18next |
| Backend | Node.js, Express.js, JWT, Multer |
| Blockchain | Solidity smart contracts, Web3.js, Ganache (local test chain), MetaMask, Remix IDE |
| Database | MySQL |
| Machine Learning | Python (price prediction model, trained on historical agricultural price data) |
| Testing | Postman (API testing), Remix IDE (smart contract testing) |

## Project Structure

```
agri-supplychain/
├── frontend/          # React.js client — dashboards, multilingual UI
│   └── src/
│       ├── pages/     # Farmer, Distributor, Buyer, Admin, Home, Login, Register, Traceability, Market Prices, Price Prediction
│       ├── components/# Navbar, LanguageSwitcher
│       └── i18n/      # Translation files (en, hi, kn)
├── backend/           # Node.js + Express REST API
│   ├── server.js
│   ├── db.js          # MySQL connection
│   ├── notification.js# Email/SMS notifications
│   └── AgriChainABI.json
├── blockchain/         # Solidity smart contracts
│   └── CropTransaction.sol
└── ml/                 # Crop price prediction model
    ├── train_model.py
    ├── preprocess.py
    ├── predict.py
    └── data/
```

## System Architecture

The system follows a three-tier hybrid architecture:

1. **Frontend (React.js)** - role-specific dashboards communicate with the backend via authenticated REST API calls (JWT).
2. **Backend (Node.js + Express)** - handles authentication, crop management, image uploads, and acts as the middleware between the frontend, MySQL, and the blockchain.
3. **Dual data layer**:
   - **MySQL** stores structured, non-critical data (user profiles, crop details, market prices, images, notifications).
   - **Ethereum blockchain** (via Solidity smart contracts) immutably records crop listings, ownership transfers, and purchase transactions.

## Core Smart Contract Functions

- `listCrop(details, price)` - lists a new crop on the blockchain
- `buyCrop(cropId)` - transfers crop ownership on purchase
- `resellCrop(cropId, newPrice)` - allows a distributor to relist a purchased crop

## Getting Started

### Prerequisites
- Node.js and npm
- MySQL Server
- Python 3.x (for the ML module)
- [Ganache](https://trufflesuite.com/ganache/) (local Ethereum blockchain)
- [MetaMask](https://metamask.io/) browser extension
- [Remix IDE](https://remix.ethereum.org/) (for deploying smart contracts)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agri-supplychain
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   # create a .env file based on .env.example with your MySQL credentials and JWT secret
   node server.js
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Blockchain**
   - Start Ganache locally.
   - Open `blockchain/CropTransaction.sol` in Remix IDE, compile, and deploy to your Ganache instance.
   - Update the contract address and ABI (`AgriChainABI.json`) in the backend config.

5. **ML Price Prediction**
   ```bash
   cd ml
   python train_model.py   # trains and saves model.pkl, encoders
   ```

## Testing

- Backend API routes were tested using **Postman** (register, login, add-crop, bc-list-crop, bc-buy-crop, predict-price).
- Smart contract functions were tested in **Remix IDE** against a local **Ganache** instance.

## Future Enhancements

- Chatbot support for farmers
- Government API integrations
- Warehouse management module

## Team / Author

Developed as a final year project — Dept. of AIML, BMSIT (2025-26).


