import {createApp} from '../server/app.mjs';

const app = await createApp();

export default function handler(req, res) {
 const url = new URL(req.url, 'http://localhost');
 const endpoint = url.searchParams.get('__vastukala_route');
 url.searchParams.delete('__vastukala_route');
 if (url.pathname === '/api/index' && endpoint !== null) {
  url.pathname = '/api/' + endpoint;
 }
 req.url = url.pathname + url.search;
 return app(req, res);
}
