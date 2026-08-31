<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a receipt image cannot be run through OCR — usually because the
 * Tesseract binary is not installed or not on the PATH.
 */
class ReceiptScanUnavailable extends RuntimeException {}
