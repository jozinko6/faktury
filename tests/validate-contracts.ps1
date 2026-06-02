Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-True {
    param(
        [bool] $Condition,
        [string] $Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Read-Json {
    param([string] $Path)
    return Get-Content -Raw -Encoding UTF8 $Path | ConvertFrom-Json
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$jsonFiles = Get-ChildItem -Path (Join-Path $root "domain") -Filter "*.json" -File
$jsonFiles += Get-ChildItem -Path (Join-Path $root "config") -Filter "*.json" -File
$jsonFiles += Get-ChildItem -Path (Join-Path $root "tests/fixtures") -Filter "*.json" -File

foreach ($file in $jsonFiles) {
    Read-Json $file.FullName | Out-Null
}

$core = Read-Json (Join-Path $root "config/slovakia-core.json")
Assert-True ($core.country -eq "SK") "Slovak core country must be SK."
Assert-True ($core.defaultCurrency -eq "EUR") "Slovak core default currency must be EUR."

$invoice = Read-Json (Join-Path $root "domain/invoice.schema.json")
Assert-True ("null" -in @($invoice.properties.invoice.properties.number.type)) "Invoice number must stay nullable for drafts."
Assert-True ("vatTreatmentCode" -in @($invoice.'$defs'.invoiceItem.required)) "Invoice item must require VAT treatment."
Assert-True ("remainingBalance" -in @($invoice.'$defs'.invoiceTotals.required)) "Invoice totals must include remaining balance."

$numberSeries = Read-Json (Join-Path $root "domain/number-series.schema.json")
Assert-True ($numberSeries.properties.series.properties.assignOn.const -eq "issue") "Number series must assign numbers on issue only."
Assert-True ("failed_reserved" -in @($numberSeries.properties.reservation.properties.status.enum)) "Number reservation must support failed_reserved."

$vat = Read-Json (Join-Path $root "domain/vat-report.schema.json")
Assert-True ("xml" -notin @($vat.properties.vatExport.properties.format.enum)) "VAT XML export must stay outside MVP."
Assert-True ("xlsx" -in @($vat.properties.vatExport.properties.format.enum)) "VAT export must support XLSX."
Assert-True ("csv" -in @($vat.properties.vatExport.properties.format.enum)) "VAT export must support CSV."

$banking = Read-Json (Join-Path $root "domain/banking.schema.json")
Assert-True ("importHash" -in @($banking.properties.statementImport.required)) "Bank import must require importHash."
Assert-True ("transactionHash" -in @($banking.'$defs'.bankTransaction.required)) "Bank transaction must require transactionHash."

$matching = Read-Json (Join-Path $root "domain/payment-matching.schema.json")
Assert-True ($matching.properties.matchingCandidate.properties.confidenceScore.minimum -eq 0) "Confidence score minimum must be 0."
Assert-True ($matching.properties.matchingCandidate.properties.confidenceScore.maximum -eq 100) "Confidence score maximum must be 100."
Assert-True ("paymentAllocation" -in @($matching.required)) "Payment matching must include allocations."

$export = Read-Json (Join-Path $root "domain/accountant-export.schema.json")
Assert-True ("zipHash" -in @($export.properties.exportPackage.required)) "Accountant export must require zipHash."
Assert-True ("manifestHash" -in @($export.properties.exportPackage.required)) "Accountant export must require manifestHash."

$audit = Read-Json (Join-Path $root "domain/audit-log.schema.json")
foreach ($action in @("invoice_issued", "invoice_sent", "payment_matched", "expense_approved", "accountant_export_created", "iban_changed")) {
    Assert-True ($action -in @($audit.properties.auditEntry.properties.action.enum)) "Missing audit action: $action"
}

$validation = Read-Json (Join-Path $root "domain/validation.schema.json")
foreach ($rule in @("iban_format_valid", "invoice_has_customer", "non_payer_must_not_charge_vat", "number_series_assigns_only_on_issue", "locked_period_blocks_document_change", "missing_documents_block_accountant_export")) {
    Assert-True ($rule -in @($validation.'$defs'.ruleCode.enum)) "Missing validation rule: $rule"
}

$doubleEntry = Read-Json (Join-Path $root "domain/double-entry-accounting.schema.json")
Assert-True ($doubleEntry.properties.activationStatus.properties.isPrimaryAccounting.const -eq $false) "Double-entry accounting must not be primary yet."

$organizationFixture = Read-Json (Join-Path $root "tests/fixtures/organization-profile.sample.json")
$partnerFixture = Read-Json (Join-Path $root "tests/fixtures/business-partner.sample.json")
$invoiceFixture = Read-Json (Join-Path $root "tests/fixtures/invoice-draft.sample.json")

Assert-True ($organizationFixture.organization.country -eq "SK") "Organization fixture must use SK country."
Assert-True ($organizationFixture.organization.defaultCurrency -eq "EUR") "Organization fixture must use EUR currency."
Assert-True ($organizationFixture.profile.organizationId -eq $organizationFixture.organization.id) "Organization profile fixture must reference organization."
Assert-True ($organizationFixture.taxProfile.organizationId -eq $organizationFixture.organization.id) "Tax profile fixture must reference organization."

Assert-True ($partnerFixture.partner.organizationId -eq $organizationFixture.organization.id) "Partner fixture must reference organization."
Assert-True ($partnerFixture.partner.partnerType -eq "customer") "Partner fixture must represent a customer."
Assert-True ($partnerFixture.partner.defaultCurrency -eq "EUR") "Partner fixture must use EUR currency."

Assert-True ($invoiceFixture.invoice.organizationId -eq $organizationFixture.organization.id) "Invoice fixture must reference organization."
Assert-True ($invoiceFixture.invoice.customerId -eq $partnerFixture.partner.id) "Invoice fixture must reference partner."
Assert-True ($invoiceFixture.invoice.status -eq "draft") "Invoice fixture must be a draft."
Assert-True ($null -eq $invoiceFixture.invoice.number) "Draft invoice fixture must not have an invoice number."
Assert-True ($invoiceFixture.invoice.currency -eq "EUR") "Invoice fixture must use EUR currency."
Assert-True ($invoiceFixture.issueSnapshot -eq $null) "Draft invoice fixture must not have an issue snapshot."
Assert-True ($invoiceFixture.totals.remainingBalance -eq ($invoiceFixture.totals.grossTotal - $invoiceFixture.totals.allocatedPaymentsTotal - $invoiceFixture.totals.creditNotesTotal)) "Invoice fixture remaining balance must match totals."

Write-Output "Contract validation passed"
