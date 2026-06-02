/**
 * Tiny structured logger. Real product would use pino or winston;
 * for the simulator we just want timestamped, color-tagged lines.
 */

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function fmt(level, color, msg, meta) {
  const ts = new Date().toISOString().split('T')[1].replace('Z', '');
  const tag = `${color}[${level}]${COLORS.reset}`;
  const m = meta ? ` ${COLORS.dim}${JSON.stringify(meta)}${COLORS.reset}` : '';
  return `${COLORS.dim}${ts}${COLORS.reset} ${tag} ${msg}${m}`;
}

export const log = {
  info: (msg, meta) => console.log(fmt('INFO ', COLORS.cyan, msg, meta)),
  warn: (msg, meta) => console.log(fmt('WARN ', COLORS.yellow, msg, meta)),
  error: (msg, meta) => console.log(fmt('ERROR', COLORS.red, msg, meta)),
  event: (msg, meta) => console.log(fmt('EVENT', COLORS.magenta, msg, meta)),
  state: (msg, meta) => console.log(fmt('STATE', COLORS.green, msg, meta)),
};
