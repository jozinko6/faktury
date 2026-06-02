type InvoiceTextSnapshot = {
  number: string;
  variableSymbol: string;
  supplierSnapshot: {
    legalName: string;
    ico?: string | null;
    dic?: string | null;
    icDph?: string | null;
    country: string;
  };
  customerSnapshot: {
    legalName: string;
    displayName: string;
    country: string;
  };
  itemsSnapshot: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPriceNet: string;
    vatRateCode: string;
    lineNet: string;
    lineVat: string;
    lineGross: string;
  }>;
  totalsSnapshot: {
    netTotal: string;
    vatTotal: string;
    grossTotal: string;
    remainingBalance: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(source: Record<string, unknown>, key: string) {
  const value = source[key];

  if (typeof value !== "string") {
    throw new Error(`Invoice snapshot field ${key} must be a string.`);
  }

  return value;
}

function optionalString(source: Record<string, unknown>, key: string) {
  const value = source[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Invoice snapshot field ${key} must be a string or null.`);
  }

  return value;
}

function parseSnapshot(snapshotJson: string): InvoiceTextSnapshot {
  const parsed: unknown = JSON.parse(snapshotJson);

  if (!isRecord(parsed)) {
    throw new Error("Invoice snapshot must be an object.");
  }

  const supplier = parsed.supplierSnapshot;
  const customer = parsed.customerSnapshot;
  const totals = parsed.totalsSnapshot;
  const items = parsed.itemsSnapshot;

  if (!isRecord(supplier) || !isRecord(customer) || !isRecord(totals) || !Array.isArray(items)) {
    throw new Error("Invoice snapshot has an invalid PDF render shape.");
  }

  return {
    number: requireString(parsed, "number"),
    variableSymbol: requireString(parsed, "variableSymbol"),
    supplierSnapshot: {
      legalName: requireString(supplier, "legalName"),
      ico: optionalString(supplier, "ico"),
      dic: optionalString(supplier, "dic"),
      icDph: optionalString(supplier, "icDph"),
      country: requireString(supplier, "country")
    },
    customerSnapshot: {
      legalName: requireString(customer, "legalName"),
      displayName: requireString(customer, "displayName"),
      country: requireString(customer, "country")
    },
    itemsSnapshot: items.map((item) => {
      if (!isRecord(item)) {
        throw new Error("Invoice snapshot item must be an object.");
      }

      return {
        description: requireString(item, "description"),
        quantity: requireString(item, "quantity"),
        unit: requireString(item, "unit"),
        unitPriceNet: requireString(item, "unitPriceNet"),
        vatRateCode: requireString(item, "vatRateCode"),
        lineNet: requireString(item, "lineNet"),
        lineVat: requireString(item, "lineVat"),
        lineGross: requireString(item, "lineGross")
      };
    }),
    totalsSnapshot: {
      netTotal: requireString(totals, "netTotal"),
      vatTotal: requireString(totals, "vatTotal"),
      grossTotal: requireString(totals, "grossTotal"),
      remainingBalance: requireString(totals, "remainingBalance")
    }
  };
}

export function renderInvoiceText(snapshotJson: string) {
  const snapshot = parseSnapshot(snapshotJson);
  const supplier = snapshot.supplierSnapshot;
  const customer = snapshot.customerSnapshot;
  const totals = snapshot.totalsSnapshot;
  const lines = [
    `FAKTURA ${snapshot.number}`,
    `Variabilny symbol: ${snapshot.variableSymbol}`,
    "",
    "Dodavatel",
    supplier.legalName,
    `ICO: ${supplier.ico ?? ""}`,
    `DIC: ${supplier.dic ?? ""}`,
    `IC DPH: ${supplier.icDph ?? ""}`,
    `Krajina: ${supplier.country}`,
    "",
    "Odberatel",
    customer.legalName,
    `Nazov: ${customer.displayName}`,
    `Krajina: ${customer.country}`,
    "",
    "Polozky"
  ];

  snapshot.itemsSnapshot.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.description} | ${item.quantity} ${item.unit} | MJ bez DPH ${item.unitPriceNet} EUR | DPH ${item.vatRateCode} | spolu ${item.lineGross} EUR`
    );
  });

  lines.push(
    "",
    "Sumy",
    `Zaklad dane: ${totals.netTotal} EUR`,
    `DPH: ${totals.vatTotal} EUR`,
    `Celkom: ${totals.grossTotal} EUR`,
    `Uhradit: ${totals.remainingBalance} EUR`
  );

  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInvoiceHtmlPreview(snapshotJson: string) {
  const snapshot = parseSnapshot(snapshotJson);
  const supplier = snapshot.supplierSnapshot;
  const customer = snapshot.customerSnapshot;
  const totals = snapshot.totalsSnapshot;
  const rows = snapshot.itemsSnapshot
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
          <td>${escapeHtml(item.unitPriceNet)} EUR</td>
          <td>${escapeHtml(item.vatRateCode)}</td>
          <td>${escapeHtml(item.lineGross)} EUR</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8" />
    <title>Faktura ${escapeHtml(snapshot.number)}</title>
    <style>
      body { color: #111827; font-family: Arial, sans-serif; margin: 32px; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; }
      p { margin: 4px 0; }
      table { border-collapse: collapse; margin-top: 12px; width: 100%; }
      th, td { border-bottom: 1px solid #d1d5db; padding: 8px; text-align: left; }
      th { background: #f3f4f6; font-size: 12px; text-transform: uppercase; }
      .grid { display: grid; gap: 24px; grid-template-columns: 1fr 1fr; }
      .total { font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>FAKTURA ${escapeHtml(snapshot.number)}</h1>
    <p>Variabilny symbol: ${escapeHtml(snapshot.variableSymbol)}</p>
    <section class="grid">
      <div>
        <h2>Dodavatel</h2>
        <p>${escapeHtml(supplier.legalName)}</p>
        <p>ICO: ${escapeHtml(supplier.ico ?? "")}</p>
        <p>DIC: ${escapeHtml(supplier.dic ?? "")}</p>
        <p>IC DPH: ${escapeHtml(supplier.icDph ?? "")}</p>
        <p>Krajina: ${escapeHtml(supplier.country)}</p>
      </div>
      <div>
        <h2>Odberatel</h2>
        <p>${escapeHtml(customer.legalName)}</p>
        <p>Nazov: ${escapeHtml(customer.displayName)}</p>
        <p>Krajina: ${escapeHtml(customer.country)}</p>
      </div>
    </section>
    <h2>Polozky</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Popis</th>
          <th>Mnozstvo</th>
          <th>MJ bez DPH</th>
          <th>DPH</th>
          <th>Spolu</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Sumy</h2>
    <p>Zaklad dane: ${escapeHtml(totals.netTotal)} EUR</p>
    <p>DPH: ${escapeHtml(totals.vatTotal)} EUR</p>
    <p class="total">Celkom: ${escapeHtml(totals.grossTotal)} EUR</p>
    <p class="total">Uhradit: ${escapeHtml(totals.remainingBalance)} EUR</p>
  </body>
</html>`;
}
