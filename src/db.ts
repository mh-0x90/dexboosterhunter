import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { config } from "./config";
import { boostAmounts, TokenResponseType, updatedDetailedTokenType } from "./types";

// Tokens
export async function createTokensTable(database: any): Promise<boolean> {
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        chainId TEXT NOT NULL,
        tokenAddress TEXT NOT NULL UNIQUE,
        icon TEXT,
        header TEXT,
        openGraph TEXT,
        description TEXT,
        totalAmount INTEGER,
        amount INTEGER,
        links TEXT,
        created INTEGER, 
        boosted INTEGER,
        pairsAvailable INTEGER,
        dexPair TEXT,
        currentPrice INTEGER,
        liquidity INTEGER,
        marketCap INTEGER,
        pairCreatedAt INTEGER,
        tokenName TEXT,
        tokenSymbol TEXT
      );
    `);
    return true;
  } catch (error: any) {
    console.error("Error creating TokenData table:", error);
    return false;
  }
}
export async function selectAllTokens() {
  const db = await open({
    filename: config.settings.db_name_tracker,
    driver: sqlite3.Database,
  });

  // Create Table if not exists
  const tokensTableExist = await createTokensTable(db);
  if (!tokensTableExist) {
    await db.close();
  }

  // Proceed with returning tokens
  if (tokensTableExist) {
    const tokens = await db.all("SELECT * FROM tokens");
    await db.close();
    return tokens;
  }
}
export async function upsertTokenBoost(token: updatedDetailedTokenType): Promise<boolean> {
  const db = await open({
    filename: config.settings.db_name_tracker,
    driver: sqlite3.Database,
  });

  // Create Table if not exists
  const tokensTableExist = await createTokensTable(db);
  if (!tokensTableExist) {
    await db.close();
    return false;
  }

  // Proceed with adding/updating token record
  if (tokensTableExist) {
    const {
      chainId,
      description,
      dexPair,
      header,
      icon,
      links,
      openGraph,
      tokenAddress,
      tokenName,
      tokenSymbol,
      url,
      amount,
      currentPrice,
      liquidity,
      marketCap,
      pairCreatedAt,
      pairsAvailable,
      totalAmount,
    } = token;

    // Delete token to make room for new one
    await db.run(`DELETE FROM tokens WHERE tokenAddress = ?`, [tokenAddress]);

    // Create timestamp for token profile creation
    const recordAdded = Date.now();

    // Get links lenght
    const linksLenght = links ? links.length : 0;

    const result = await db.run(
      `INSERT INTO tokens (url, chainId, tokenAddress, icon, header, openGraph, description, totalAmount, amount, links, created, boosted, pairsAvailable, dexPair, currentPrice, liquidity, marketCap, pairCreatedAt, tokenName, tokenSymbol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        url,
        chainId,
        tokenAddress,
        icon,
        header,
        openGraph,
        description,
        totalAmount,
        amount,
        linksLenght,
        recordAdded,
        recordAdded,
        pairsAvailable,
        dexPair,
        currentPrice,
        liquidity,
        marketCap,
        pairCreatedAt,
        tokenName,
        tokenSymbol,
      ]
    );

    // Return false if no record was added
    if (typeof result.changes === "number" && result.changes < 1) return false;

    // Close Database
    await db.close();

    return true;
  }

  // Return false if tokensTableExist does not satisfy
  return false;
}
export async function selectTokenPresent(token: string): Promise<boolean> {
  const db = await open({
    filename: config.settings.db_name_tracker,
    driver: sqlite3.Database,
  });

  // Create Table if not exists
  const tokensTableExist = await createTokensTable(db);
  if (!tokensTableExist) {
    await db.close();
    return false;
  }

  // Return result
  if (tokensTableExist) {
    // Check if this token
    const tokenExists = await db.get(`SELECT id FROM tokens WHERE tokenAddress = ?`, [token]);

    // Close Database
    await db.close();

    if (tokenExists) return true;
  }

  // Return false token does not exist
  return false;
}
export async function selectTokenBoostAmounts(token: string): Promise<false | boostAmounts> {
  const db = await open({
    filename: config.settings.db_name_tracker,
    driver: sqlite3.Database,
  });

  // Create Table if not exists
  const tokensTableExist = await createTokensTable(db);
  if (!tokensTableExist) {
    await db.close();
    return false;
  }

  // Return result
  if (tokensTableExist) {
    // Check if this token
    const tokenAmounts = await db.get(`SELECT amount, totalAmount FROM tokens WHERE tokenAddress = ?`, [token]);

    // Close Database
    await db.close();

    // Return amounts
    if (tokenAmounts) {
      const amount = tokenAmounts.amount ? tokenAmounts.amount : 0;
      const amountTotal = tokenAmounts.totalAmount ? tokenAmounts.totalAmount : 0;
      return { amount: amount, amountTotal: amountTotal };
    }
  }

  // Return false token does not exist
  return false;
}
