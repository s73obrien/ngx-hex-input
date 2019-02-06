const { watch, series } = require('gulp');
const gls = require('gulp-live-server');
const childProcess = require('child_process');

function buildLib() {
  
}

function buildApp() {
  
}

function webserver() {
  const server = gls.static('./dist/ngx-hex-input-app', 4200);
  server.start();

  watch('./dist/ngx-hex-input-app/**/*', e => server.notify([e]));
}
exports = {
  webserver: webserver
};
