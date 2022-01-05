const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

function checkData(results, req) {
  if (results.rows.length === 0) {
    let notFoundError = new Error(
      `There is no invoice with id '${req.params.id}'`
    );
    notFoundError.status = 404;
    throw notFoundError;
  }
}

router.get("/", async function (req, res, next) {
  try {
    const invoices = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: invoices.rows });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const invoices = await db.query(`SELECT * FROM invoices WHERE id = $1`, [
      req.params.id,
    ]);
    checkData(invoices, req);
    const compCode = invoices.rows[0].comp_code;
    const companyResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [
      compCode,
    ]);
    const { id, amt, paid, add_date, paid_date } = invoices.rows[0];
    const company = companyResults.rows[0]
    return res.json({ invoice: {id, amt, paid, add_date, paid_date, company} });
  } catch (e) {
    next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt, paid, add_date } = req.body;
    const invoices = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid, add_date) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt, paid, add_date]
    );
    return res.status(201).json({ invoice: invoices.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { amt } = req.body;
    const invoices = await db.query(
      `UPDATE invoices
        SET amt= $1
        WHERE id = $2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, req.params.id]
    );
    checkData(invoices, req);
    return res.json({ invoice: invoices.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const invoices = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    checkData(invoices, req);
    return res.json({ status: "deleted" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
