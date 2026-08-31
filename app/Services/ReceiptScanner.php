<?php

namespace App\Services;

use App\Exceptions\ReceiptScanUnavailable;
use thiagoalessio\TesseractOCR\TesseractNotFoundException;
use thiagoalessio\TesseractOCR\TesseractOCR;

/**
 * Runs a receipt photo through Tesseract OCR and turns the recognised text into
 * rough line-item suggestions ({quantity, item_name, unit_price}). The output
 * is always a best guess for a human to review — never trusted as-is.
 */
class ReceiptScanner
{
    /** A peso amount: "1,234.56", "1234.56" or "1,234" (thousands grouped). */
    private const MONEY = '(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+\.\d{2})';

    /** Lines that are never an item. */
    private const NOISE = '/\b(sub[\s\-]?total|total|amount\s*due|balance\s*due|change|cash|tender|approved|visa|master(?:card)?|gcash|maya|paymaya|debit|credit|vatable|vat[\s-]?(?:able|exempt|amount)?|less\s*vat|tax|tin|invoice|o\.?\s*r\.?\s*(?:no|number)|receipt|thank\s*you|cashier|store|branch|address|contact|date|time|item\s*count|qty\b.*\bprice|no\.?\s*of\s*items)\b/i';

    /**
     * @return list<array{quantity:int, item_name:string, unit_price:string, raw:string}>
     */
    public function scan(string $imagePath): array
    {
        if (! is_file($imagePath)) {
            return [];
        }

        try {
            $ocr = new TesseractOCR($imagePath);

            if ($bin = config('services.tesseract.bin')) {
                $ocr->executable($bin);
            }

            $langs = array_filter(explode('+', (string) config('services.tesseract.langs', 'eng')));

            $text = $ocr->lang(...($langs ?: ['eng']))->psm(6)->run();
        } catch (TesseractNotFoundException) {
            throw new ReceiptScanUnavailable(
                'Tesseract OCR is not installed on this server. Install it and, if it is not on the PATH, set TESSERACT_BIN in your .env.'
            );
        } catch (\Throwable $e) {
            throw new ReceiptScanUnavailable('The receipt image could not be read: '.$e->getMessage());
        }

        return $this->parse($text);
    }

    /**
     * Pull line items out of raw OCR text. Pure function — unit-tested directly.
     *
     * @return list<array{quantity:int, item_name:string, unit_price:string, raw:string}>
     */
    public function parse(string $text): array
    {
        $rows = [];

        foreach (preg_split('/\r\n|\r|\n/', $text) ?: [] as $line) {
            $line = trim((string) preg_replace('/\s{2,}/', ' ', $line));

            if ($line === '' || preg_match(self::NOISE, $line)) {
                continue;
            }

            if (! preg_match_all('/'.self::MONEY.'/', $line, $matches) || $matches[0] === []) {
                continue;
            }

            $amounts = array_map(
                static fn (string $a): float => (float) str_replace(',', '', $a),
                $matches[0],
            );

            [$quantity, $withoutQty] = $this->extractQuantity($line);

            // Unit price: the "@ <price>" figure when the line spells it out,
            // otherwise the last money token on the line.
            if (preg_match('/@\s*'.self::MONEY.'/', $line, $at)) {
                $unit = (float) str_replace(',', '', $at[1]);
            } else {
                $unit = (float) end($amounts);
            }

            $name = (string) preg_replace('/'.self::MONEY.'/', '', $withoutQty);
            $name = trim((string) preg_replace('/\s{2,}/', ' ', $name), " \t\-–—:•*.@xX");

            if (mb_strlen($name) < 2 || $unit <= 0) {
                continue;
            }

            $rows[] = [
                'quantity' => $quantity,
                'item_name' => mb_substr($name, 0, 150),
                'unit_price' => number_format($unit, 2, '.', ''),
                'raw' => $line,
            ];

            if (count($rows) >= 50) {
                break;
            }
        }

        return $rows;
    }

    /**
     * @return array{0:int, 1:string} the quantity and the line with a leading
     *                                "2 " / "2x " / "2 @ " prefix removed
     */
    private function extractQuantity(string $line): array
    {
        if (preg_match('/^(\d{1,3})\s*(?:x|@)?\s+/i', $line, $m)) {
            return [max(1, (int) $m[1]), (string) preg_replace('/^(\d{1,3})\s*(?:x|@)?\s+/i', '', $line, 1)];
        }

        // "... x12 ..." or "... qty 3 ..." mid-line.
        if (preg_match('/\b(?:x|qty\.?)\s*(\d{1,3})\b/i', $line, $m)) {
            return [max(1, (int) $m[1]), (string) preg_replace('/\b(?:x|qty\.?)\s*\d{1,3}\b/i', '', $line, 1)];
        }

        return [1, $line];
    }
}
