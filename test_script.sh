#!/bin/bash
node -e "
const { verifyBinaries } = require('./server/binManager');
console.log('Testing...');
"
