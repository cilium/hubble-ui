import page from 'page';

export function start() {
  page('*', (ctx, next) => {
    next();
  });

  page();
}
