import Decimal from 'decimal.js';

export interface InventoryBalance {
  offerId: string;
  onHand: Decimal;
  averageUnitCost: Decimal;
  lastVerifiedAt: Date | null;
  version: number;
}

export interface SaleCostSnapshot {
  saleLineId: string;
  variantId: string;
  quantity: Decimal;
  unitPrice: Decimal;
  unitCostSnapshot: Decimal;
  returnedQuantity: Decimal;
}

export interface DocumentPostingResult {
  success: boolean;
  documentId: string;
  error?: string;
  conflict?: boolean;
}

/**
 * Calculates new weighted average cost on receipt
 * newAverage = (oldQty * oldAverage + receivedQty * receivedCost) / (oldQty + receivedQty)
 */
export function calculateWeightedAverageCost(
  currentOnHand: Decimal,
  currentAverageCost: Decimal,
  receivedQuantity: Decimal,
  receivedUnitCost: Decimal
): Decimal {
  const totalQty = currentOnHand.plus(receivedQuantity);
  if (totalQty.isZero()) {
    return new Decimal(0);
  }

  const currentTotalValuation = currentOnHand.times(currentAverageCost);
  const receivedTotalValuation = receivedQuantity.times(receivedUnitCost);
  const newAverage = currentTotalValuation.plus(receivedTotalValuation).dividedBy(totalQty);

  // Round to 2 decimal places for currency
  return newAverage.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Escapes CSV values to protect against formula injection in Excel/Sheets
 * If field starts with =, +, -, @, prefix with a single quote
 */
export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Calculates financial metrics strictly from posted operations:
 * Net Sales = posted sales - discounts - posted sales refunds
 * COGS = sale cost snapshots - reversed return costs
 * Gross Profit = Net Sales - COGS
 * Operating Result = Gross Profit - Operating Expenses - Stock Write-offs
 */
export function calculateFinancialSummary(params: {
  postedSalesGross: Decimal;
  discounts: Decimal;
  postedRefunds: Decimal;
  cogsSnapshots: Decimal;
  reversedReturnCogs: Decimal;
  operatingExpenses: Decimal;
  stockLosses: Decimal;
}) {
  const netSales = params.postedSalesGross.minus(params.discounts).minus(params.postedRefunds);
  const netCogs = params.cogsSnapshots.minus(params.reversedReturnCogs);
  const grossProfit = netSales.minus(netCogs);
  const operatingResult = grossProfit.minus(params.operatingExpenses).minus(params.stockLosses);

  return {
    netSales: netSales.toFixed(2),
    cogs: netCogs.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    operatingExpenses: params.operatingExpenses.toFixed(2),
    operatingResult: operatingResult.toFixed(2)
  };
}
