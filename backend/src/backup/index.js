module.exports = {
  ...require('./config'),
  ...require('./naming'),
  ...require('./checksum'),
  ...require('./manifest'),
  ...require('./lock'),
  ...require('./retention'),
  ...require('./redact'),
  runBackup: require('./run').runBackup,
};
