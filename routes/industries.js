const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/", async function (req, res, next) {
  try {
    const industries = await db.query(`
      SELECT * FROM industries`);
    return res.json({ industries: industries.rows });
  } catch (e) {
    next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, industry } = req.body;
    const industries = await db.query(
      `INSERT INTO industries (code, industry) 
             VALUES ($1, $2) 
             RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).json({ industry: industries.rows[0] });
  } catch (e) {
    next(e);
  }
});

router.post("/add-company-industry", async function (req, res, next) {
  try {
    const companies = await db.query(`SELECT * FROM companies`);
    const compCodes = companies.rows.map((c) => c.code);
    const { comp_code, industry_code } = req.body;

    if (!compCodes.includes(comp_code)) {
      let notFoundError = new Error(
        `There is no company with code '${comp_code}'`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }

    const industries = await db.query(
      `INSERT INTO company_industries (comp_code, industry_code) 
               VALUES ($1, $2) 
               RETURNING comp_code, industry_code`,
      [comp_code, industry_code]
    );
    return res.status(201).json({ industry: industries.rows[0] });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
