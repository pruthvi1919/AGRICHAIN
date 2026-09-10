//import_prices.js

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("./db");

const filePath = path.join(__dirname, "data", "market_prices.csv");

let rows = [];

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    rows.push([
      row.crop_name,
      row.market,
      row.date,
      row.price
    ]);
  })
  .on("end", () => {
    console.log("CSV Read Success. Rows:", rows.length);

    const sql = `
      INSERT INTO market_prices (crop_name, market, date, price)
      VALUES ?
    `;

    db.query(sql, [rows], (err) => {
      if (err) throw err;
      console.log("✅ CSV Import Completed!");
      process.exit();
    });
  });
