const fs = require('fs');
const path = require('path');

// Test what getProductImageCandidates returns for these items
const { getProductImageCandidates, getSmartProductImage, KNOWN_DEAD_ORIGIN_URLS } = require('../src/utils/productImageHelper.ts');
