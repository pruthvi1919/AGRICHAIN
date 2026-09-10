

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const { Web3 } = require("web3");
const db = require("./db");
require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const { execSync } = require("child_process");
const pythonScriptPath = path.join(__dirname, "..", "ml", "predict.py");

const ALLOWED_STATES = [
  "Karnataka",
  "Maharashtra",
  "Kerala",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Punjab",
  "Uttar Pradesh",
  "Delhi"
];






const { sendEmail, sendSMS } = require("./notification");

const JWT_SECRET = "agrichain_secret";

const app = express();

function saveNotification(userId, title, message) {
  db.query(
    "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, title, message]
  );
}

function extractNumericQuantity(qty) {
  if (!qty) return null;

  const match = String(qty).match(/\d+/);
  if (!match) return null;

  const num = Number(match[0]);
  return Number.isFinite(num) && num > 0 ? num : null;
}



app.use(cors());
app.use(bodyParser.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


app.use("/uploads", express.static(uploadsDir));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\.-]/g, "");
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});


const web3 = new Web3("http://127.0.0.1:7545");

const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "AgriChainABI.json"), "utf8")
);

const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

web3.eth.getAccounts().then((a) => console.log("Ganache Accounts:", a));


const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);


app.post("/register", async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, message: "Missing fields" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });

    if (result.length > 0)
      return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, phone],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "DB insert error" });
        res.json({ success: true, message: "User registered successfully" });
      }
    );
  });
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    if (result.length === 0)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  });
});


app.post("/add-crop", upload.single("crop_image"), (req, res) => {
  try {
    const { farmer_id, crop_name, quantity, price, location } = req.body;
    let crop_image = null;

    if (req.file) {
      crop_image = req.file.filename; 
    }

    const sql = `
      INSERT INTO crops (farmer_id, crop_name, quantity, price, location, crop_image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [farmer_id, crop_name, quantity, price, location, crop_image], (err) => {
      if (err) {
        console.error("ADD CROP ERROR:", err);
        return res.status(500).json({ success: false, message: "Error adding crop" });
      }
      res.json({ success: true, message: "Crop added successfully", crop_image });
    });
  } catch (err) {
    console.error("ADD CROP EXCEPTION:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/search-crops", (req, res) => {
  const { crop_name } = req.query;

  db.query(
    "SELECT * FROM crops WHERE crop_name LIKE ?",
    [`%${crop_name}%`],
    (err, results) => {
      if (err) return res.status(500).send("Error searching crops");
      res.json(results);
    }
  );
});


app.post("/notify", async (req, res) => {
  const { email, phone, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Agri-SupplyChain Update",
      text: message,
    });

    await client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: phone,
      body: message,
    });

    res.send("Notification sent successfully");
  } catch (err) {
    console.error("Notify Error:", err);
    res.status(500).send("Failed to send notification");
  }
});


app.post("/bc-list-crop", async (req, res) => {
  try {
    let { from, name, quantity, price, farmerId, id: mysqlId } = req.body;

    // 🔹 FIX 1: Extract numeric quantity for blockchain
    const numericQuantity = extractNumericQuantity(quantity);

    if (!numericQuantity) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity format"
      });
    }

    // 🔹 FIX 2: Price → Wei (already correct)
    const priceWei = web3.utils.toWei(String(price), "ether");

    // 🔹 FIX 3: Send ONLY numbers to blockchain
    await contract.methods
      .listCrop(name, numericQuantity, priceWei)
      .send({ from, gas: 300000 });

    const bcId = Number(await contract.methods.cropCount().call());

    let rowToUpdate = mysqlId;

    if (!rowToUpdate) {
      const found = await new Promise((resolve, reject) => {
        db.query(
          `SELECT id FROM crops 
           WHERE farmer_id=? AND crop_name=? AND quantity=? AND price=? 
           AND (blockchain_crop_id IS NULL OR blockchain_crop_id = '')
           ORDER BY id DESC LIMIT 1`,
          [farmerId, name, quantity, price],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows.length ? rows[0].id : null);
          }
        );
      });
      rowToUpdate = found;
    }

    if (rowToUpdate) {
      db.query(
  `UPDATE crops 
   SET blockchain_crop_id = ?,
       current_owner = ?,
       status = 'LISTED'
   WHERE id = ?`,
  [bcId, from, rowToUpdate]
);

    } else {
      db.query(
        `INSERT INTO crops 
         (crop_name, quantity, price, farmer_id, blockchain_crop_id, sold, current_owner)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [name, quantity, price, farmerId, bcId, from]
      );
    }

    // 🔔 Notify farmer
    db.query("SELECT * FROM users WHERE id=?", [farmerId], async (err, rows) => {
      if (!err && rows.length > 0) {
        const farmer = rows[0];
        const msg =
`Your crop has been listed on Blockchain!

Crop: ${name}
Quantity: ${quantity}
Price: ${price} ETH
Blockchain Crop ID: ${bcId}

- AgriChain`;

        await sendEmail(farmer.email, "Your Crop is Now Live on Blockchain!", msg);
        if (farmer.phone) await sendSMS(farmer.phone, msg);
      }
    });

    res.json({ success: true, bcId });

  } catch (error) {
    console.error("BC LIST error:", error);
    res.status(500).json({ success: false, message: "Blockchain LIST failed" });
  }
});



app.post("/bc-buy-crop", async (req, res) => {
  try {
    const { id, from, price } = req.body;
    if (!id || !from || !price) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const valueWei = web3.utils.toWei(String(price), "ether");

    const crop = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM crops WHERE blockchain_crop_id=? LIMIT 1",
        [id],
        (err, rows) => (err ? reject(err) : resolve(rows[0] || null))
      );
    });

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    await contract.methods.buyCrop(Number(id)).send({
      from,
      value: valueWei,
      gas: 300000,
    });

    // ✅ CORRECT STATUS TRANSITION
    const newStatus =
      crop.status === "RESELL_LISTED" ? "RESOLD" : "PURCHASED";

    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE crops
         SET status = ?,
             current_owner = ?
         WHERE blockchain_crop_id = ?`,
        [newStatus, from, id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("BUY error:", err);
    res.status(500).json({ success: false, message: "BUY failed" });
  }
});




app.post("/save-wallet", (req, res) => {
  const { user_id, wallet } = req.body;

  db.query(
    "UPDATE users SET ganache_wallet=? WHERE id=?",
    [wallet, user_id],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true });
    }
  );
});


app.post("/bc-resell-crop", async (req, res) => {
  try {
    const { originalId, from, newPrice, newQuantity } = req.body;

    if (!originalId || !from || !newPrice || !newQuantity) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const numericQty = extractNumericQuantity(newQuantity);
    if (!numericQty) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    // 1️⃣ Fetch original purchased crop
    const orig = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM crops WHERE blockchain_crop_id=? LIMIT 1",
        [originalId],
        (err, rows) => (err ? reject(err) : resolve(rows[0] || null))
      );
    });

    if (!orig || orig.status !== "PURCHASED") {
      return res.status(400).json({ success: false, message: "Invalid resell state" });
    }

    // 2️⃣ List new crop on blockchain
    const priceWei = web3.utils.toWei(String(newPrice), "ether");

    await contract.methods
      .listCrop(orig.crop_name, numericQty, priceWei)
      .send({ from, gas: 300000 });

    const newBcId = Number(await contract.methods.cropCount().call());

    // 3️⃣ Archive original purchased crop
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE crops
         SET status = 'RESOLD',
             prev_owner = current_owner,
             current_owner = NULL
         WHERE blockchain_crop_id = ?`,
        [originalId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // 4️⃣ Insert new resale listing (LINKED TO ORIGINAL)
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO crops (
           crop_name,
           quantity,
           price,
           location,
           crop_image,
           farmer_id,
           blockchain_crop_id,
           parent_bc_id,
           status,
           current_owner,
           created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RESELL_LISTED', ?, NOW())`,
        [
          orig.crop_name,
          newQuantity,
          newPrice,
          orig.location,
          orig.crop_image,
          orig.farmer_id,
          newBcId,
          originalId,   // 🔗 TRACE LINK
          from
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return res.json({ success: true, newBcId });

  } catch (err) {
    console.error("RESELL error:", err);
    res.status(500).json({ success: false, message: "RESELL failed" });
  }
});







app.get("/trace/:bcId", async (req, res) => {
  try {
    const bcId = Number(req.params.bcId);
    if (!bcId) {
      return res.status(400).json({ success: false, message: "Invalid BC ID" });
    }

    /* =========================
       1️⃣ MYSQL CROP
    ========================= */
    const dbCrop = await new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, u.name AS farmer_name, u.ganache_wallet AS farmer_wallet
         FROM crops c
         LEFT JOIN users u ON c.farmer_id = u.id
         WHERE c.blockchain_crop_id = ?
         LIMIT 1`,
        [bcId],
        (err, rows) => (err ? reject(err) : resolve(rows[0] || null))
      );
    });

    if (!dbCrop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    /* =========================
       2️⃣ ON-CHAIN DATA
    ========================= */
    let onChain = null;
    try {
      const r = await contract.methods.getCrop(bcId).call();
      onChain = {
        id: Number(r[0]),
        farmer: r[1],
        name: r[2],
        quantity: Number(r[3]),
        priceEth: web3.utils.fromWei(String(r[4]), "ether"),
        currentOwner: r[5],
        sold: r[6],
      };
    } catch {}

    /* =========================
       3️⃣ BLOCKCHAIN EVENTS
    ========================= */
    const listedRaw = await contract.getPastEvents("CropListed", { fromBlock: 0, toBlock: "latest" });
    const purchasedRaw = await contract.getPastEvents("CropPurchased", { fromBlock: 0, toBlock: "latest" });

    const getTs = async (ev) => {
      const b = await web3.eth.getBlock(ev.blockNumber);
      return new Date(Number(b.timestamp) * 1000).toISOString();
    };

    const timeline = [];

    /* ---------- MYSQL RECORD ---------- */
    timeline.push({
      source: "mysql",
      stage: "RECORDED",
      role: "farmer",
      name: dbCrop.farmer_name,
      wallet: dbCrop.farmer_wallet,
      price: dbCrop.price,
      quantity: dbCrop.quantity,
      bcId,
      timestamp: dbCrop.created_at,
    });

    /* ---------- LISTED EVENTS ---------- */
    for (const ev of listedRaw) {
      if (Number(ev.returnValues.id) !== bcId) continue;

      timeline.push({
        source: "blockchain",
        stage: "LISTED",
        role: "farmer",
        name: dbCrop.farmer_name,
        wallet: ev.returnValues.farmer,
        price: web3.utils.fromWei(String(ev.returnValues.price), "ether"),
        quantity: Number(ev.returnValues.quantity),
        bcId,
        txHash: ev.transactionHash,
        blockNumber: Number(ev.blockNumber),
        timestamp: await getTs(ev),
      });
    }

    /* ---------- PURCHASE EVENTS ---------- */
    for (const ev of purchasedRaw) {
      if (Number(ev.returnValues.id) !== bcId) continue;

      timeline.push({
        source: "blockchain",
        stage: "PURCHASED",
        role: "buyer",
        wallet: ev.returnValues.buyer,
        price: web3.utils.fromWei(String(ev.returnValues.price), "ether"),
        bcId,
        txHash: ev.transactionHash,
        blockNumber: Number(ev.blockNumber),
        timestamp: await getTs(ev),
      });
    }

    /* ---------- RESELL LISTED (MYSQL) ---------- */
if (dbCrop.status === "RESELL_LISTED") {
  timeline.push({
    source: "mysql",
    stage: "RESELL_LISTED",
    role: "distributor",
    wallet: dbCrop.current_owner,
    price: dbCrop.price,
    quantity: dbCrop.quantity,
    bcId,
    timestamp: dbCrop.created_at,
  });
}

/* ---------- RESOLD (MYSQL) ---------- */
if (dbCrop.status === "RESOLD") {
  timeline.push({
    source: "mysql",
    stage: "RESOLD",
    role: "buyer",
    wallet: dbCrop.current_owner,
    price: dbCrop.price,
    bcId,
    timestamp: dbCrop.updated_at || dbCrop.created_at,
  });
}


    /* =========================
       4️⃣ SORT TIMELINE
    ========================= */
    timeline.sort((a, b) => {
      const A = a.blockNumber ?? new Date(a.timestamp).getTime();
      const B = b.blockNumber ?? new Date(b.timestamp).getTime();
      return Number(A) - Number(B);
    });

    /* =========================
       5️⃣ MAP WALLETS → USERS
    ========================= */
    const wallets = [...new Set(timeline.map(t => t.wallet).filter(Boolean))];
    const walletMap = {};

    if (wallets.length) {
      const rows = await new Promise((resolve, reject) => {
        db.query(
          `SELECT name, role, ganache_wallet FROM users
           WHERE LOWER(ganache_wallet) IN (${wallets.map(() => "?").join(",")})`,
          wallets.map(w => w.toLowerCase()),
          (e, r) => e ? reject(e) : resolve(r)
        );
      });

      rows.forEach(u => {
        walletMap[u.ganache_wallet.toLowerCase()] = u;
      });
    }

    timeline.forEach(t => {
  const u = walletMap[t.wallet?.toLowerCase()];
  if (u) {
    t.name = u.name;
    t.role = u.role;
  }
});


    /* =========================
       6️⃣ SUPPLY CHAIN FLOW
    ========================= */
    /* =========================
   6️⃣ BUILD SUPPLY CHAIN FLOW (FROM TIMELINE)
========================= */

const supplyChainFlow = [];

/* ---------- FARMER ---------- */
supplyChainFlow.push({
  role: "Farmer",
  name: dbCrop.farmer_name,
  wallet: dbCrop.farmer_wallet,
  date: dbCrop.created_at,
});

/* ---------- PURCHASE EVENTS (ORDERED) ---------- */
const purchaseEvents = timeline
  .filter(t => t.stage === "PURCHASED")
  .sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

/* ---------- DISTRIBUTOR ---------- */
const distributorPurchase = purchaseEvents.find(p => {
  const u = walletMap[p.wallet?.toLowerCase()];
  return u?.role === "distributor";
});

if (distributorPurchase) {
  supplyChainFlow.push({
    role: "Distributor",
    name: distributorPurchase.name,
    wallet: distributorPurchase.wallet,
    date: distributorPurchase.timestamp,
  });
}

/* ---------- BUYER ---------- */
const buyerPurchase = purchaseEvents
  .reverse()
  .find(p => {
    const u = walletMap[p.wallet?.toLowerCase()];
    return u?.role === "buyer";
  });

if (buyerPurchase) {
  supplyChainFlow.push({
    role: "Buyer",
    name: buyerPurchase.name,
    wallet: buyerPurchase.wallet,
    date: buyerPurchase.timestamp,
  });
}



    /* =========================
       7️⃣ RESPONSE
    ========================= */
    res.json({
      success: true,
      bcId,
      crop: dbCrop,
      onChain,
      timeline,
      supplyChainFlow,
    });

  } catch (err) {
    console.error("TRACE ERROR:", err);
    res.status(500).json({ success: false, message: "Trace failed", error: err.message });
  }
});










app.get("/api/prices", (req, res) => {
  const commodity = req.query.commodity || null;
  const state = req.query.state || null;
  const district = req.query.district || null;
  const market = req.query.market || null;

  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 50, 10);
  const offset = (page - 1) * limit;

  let where = " WHERE 1=1 ";
  const params = [];
  const placeholders = ALLOWED_STATES.map(() => "?").join(",");
where += ` AND state IN (${placeholders}) `;
params.push(...ALLOWED_STATES);

  

  if (commodity) { where += " AND commodity = ? "; params.push(commodity); }
  if (state) { where += " AND state = ? "; params.push(state); }
  if (district) { where += " AND district = ? "; params.push(district); }
  if (market) { where += " AND market = ? "; params.push(market); }

  const countSql = `SELECT COUNT(*) AS total FROM market_prices ${where}`;

  db.query(countSql, params, (errCount, countRows) => {
    if (errCount) {
      console.error("COUNT ERROR:", errCount);
      return res.status(500).json({ success: false, error: errCount });
    }

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    const dataSql = `
      SELECT id, state, district, market, commodity, variety, grade,
      min_price, modal_price, max_price, date
      FROM market_prices
      ${where}
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];

    db.query(dataSql, finalParams, (errData, rows) => {
      if (errData) {
        console.error("DATA FETCH ERROR:", errData);
        return res.status(500).json({ success: false, error: errData });
      }

      res.json({
        success: true,
        total,
        page,
        limit,
        totalPages,
        count: rows.length,
        data: rows
      });
    });
  });
});


app.get("/api/prices/trend", (req, res) => {
  const { commodity } = req.query;

  if (!commodity) {
    return res.status(400).json({
      success: false,
      message: "commodity required"
    });
  }

  const placeholders = ALLOWED_STATES.map(() => "?").join(",");

  const sql = `
    SELECT date, min_price, max_price, modal_price
    FROM market_prices
    WHERE commodity = ?
      AND state IN (${placeholders})
    ORDER BY date DESC
    LIMIT 300
    
  `;

  db.query(sql, [commodity, ...ALLOWED_STATES], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }

    // reverse to get chronological order for chart
    const ordered = rows.reverse().map(r => ({
      date: r.date,   // keep full date (frontend formats it)
      min_price: r.min_price,
      modal_price: r.modal_price,
      max_price: r.max_price
    }));

    res.json({
      success: true,
      data: ordered
    });
  });
});


app.get("/api/prices/latest", (req, res) => {
  const { commodity } = req.query;

  db.query(
    `SELECT *
     FROM market_prices
     WHERE commodity=?
     ORDER BY date DESC
     LIMIT 1`,
    [commodity],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: rows[0] });
    }
  );
});

app.get("/api/prices/commodities", (req, res) => {
  db.query(
    "SELECT DISTINCT commodity FROM market_prices ORDER BY commodity ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.json({ success: true, data: rows.map((r) => r.commodity) });
    }
  );
});

app.get("/api/prices/states", (req, res) => {
  const placeholders = ALLOWED_STATES.map(() => "?").join(",");

  const sql = `
    SELECT DISTINCT state
    FROM market_prices
    WHERE state IN (${placeholders})
    ORDER BY state ASC
  `;

  db.query(sql, ALLOWED_STATES, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: rows.map(r => r.state) });
  });
});


app.get("/api/prices/districts", (req, res) => {
  const { state } = req.query;

  // Safety check: block invalid states
  if (!state || !ALLOWED_STATES.includes(state)) {
    return res.json({
      success: true,
      data: []
    });
  }

  db.query(
    "SELECT DISTINCT district FROM market_prices WHERE state = ? ORDER BY district ASC",
    [state],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err });
      }

      res.json({
        success: true,
        data: rows.map(r => r.district)
      });
    }
  );
});


app.get("/api/prices/markets", (req, res) => {
  const { state, district } = req.query;

  if (!state || !district || !ALLOWED_STATES.includes(state)) {
    return res.json({ success: true, data: [] });
  }

  const sql = `
    SELECT DISTINCT market
    FROM market_prices
    WHERE state = ?
      AND district = ?
    ORDER BY market ASC
  `;

  db.query(sql, [state, district], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }

    res.json({
      success: true,
      data: rows.map(r => r.market)
    });
  });
});




app.post("/predict-price", (req, res) => {
  const { state, commodity, month, year } = req.body;

  if (!state || !commodity || !month || !year) {
    return res.status(400).json({
      success: false,
      message: "state, commodity, month, year are required",
    });
  }

  const pythonPath = "python"; // works after Python install
  const scriptPath = path.join(__dirname, "../ml/predict.py");

  const py = spawn(pythonPath, [
    scriptPath,
    state,
    commodity,
    month,
    year,
  ]);

  let output = "";
  let errorOutput = "";

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  py.on("close", (code) => {
    if (code !== 0 || errorOutput) {
      return res.status(500).json({
        success: false,
        message: "Prediction failed",
        error: errorOutput || "Unknown error",
      });
    }

    return res.json({
      success: true,
      predicted_price: parseFloat(output.trim()),
    });
  });
});




app.post("/compare-states", async (req, res) => {
  try {
    const { commodity, month, year } = req.body;

    const STATES = [
      "Karnataka",
      "Maharashtra",
      "Kerala",
      "Punjab",
      "Delhi",
      "Tamil Nadu",
      "Andhra Pradesh",
      
      "Uttar Pradesh",
    ];

    const results = [];

    for (const state of STATES) {
      const output = execSync(
  `python "${pythonScriptPath}" "${state}" "${commodity}" ${month} ${year}`,
  { encoding: "utf-8" }
);

      results.push({
        state,
        price: Number(output.trim()),
      });
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "State comparison failed",
    });
  }
});


function importCSV() {
  const rows = [];
  const csvFilePath = path.join(__dirname, "Agriculture_price_dataset.csv");

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      rows.push([
        row.STATE,
        row["District Name"],
        row["Market Name"],
        row.Commodity,
        row.Variety,
        row.Grade,
        parseInt(row.Min_Price) || 0,
        parseInt(row.Max_Price) || 0,
        parseInt(row.Modal_Price) || 0,
        formatDate(row["Price Date"])
      ]);
    })
    .on("end", async () => {
      console.log(`📥 Read ${rows.length} rows from CSV`);

      const batchSize = 500;
      let inserted = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);

        const sql = `
          INSERT INTO market_prices
          (state, district, market, commodity, variety, grade, min_price, max_price, modal_price, date)
          VALUES ?
        `;

        await new Promise((resolve, reject) => {
          db.query(sql, [chunk], (err) => {
            if (err) {
              console.error("❌ Batch insert error:", err);
              return reject(err);
            }
            inserted += chunk.length;
            console.log(`✅ Inserted ${inserted}/${rows.length}`);
            resolve();
          });
        });
      }

      console.log("🎉 CSV IMPORT COMPLETE!");
    });
}

function formatDate(d) {
  if (!d) return null;

  const parts = d.includes("/") ? d.split("/") : d.split("-");
  if (parts.length !== 3) return null;

  let a = parseInt(parts[0], 10);
  let b = parseInt(parts[1], 10);
  let year = parts[2];

  let day, month;

  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    month = a;
    day = b;
  } else {
    day = a;
    month = b;
  }

  day = String(day).padStart(2, "0");
  month = String(month).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);
