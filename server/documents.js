const fs = require('node:fs');
const path = require('node:path');
const { cloud } = require('./runtime');
const local = (key) => path.join(__dirname, '..', 'data', 'documents', path.basename(key));
module.exports = {
  put(key, content) {
    if (cloud()) return require('./postgres.cjs').call('blob', { method: 'put', key, content: content.toString('base64') });
    fs.mkdirSync(path.dirname(local(key)), { recursive: true });
    fs.writeFileSync(local(key), content);
  },
  get(key) {
    if (cloud()) {
      const content = require('./postgres.cjs').call('blob', { method: 'get', key });
      return content ? Buffer.from(content, 'base64') : null;
    }
    return fs.existsSync(local(key)) ? fs.readFileSync(local(key)) : null;
  },
  remove(key) {
    if (cloud()) return require('./postgres.cjs').call('blob', { method: 'delete', key });
    fs.rmSync(local(key), { force: true });
  },
};
