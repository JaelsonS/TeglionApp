const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

module.exports = {
  sha256File,
  sha256Buffer,
};
