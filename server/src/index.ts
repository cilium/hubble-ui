import * as path from 'path';
import express from 'express';

const app = express();

const port = process.env.PORT || 12000;

app.use(express.static(path.resolve(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.listen(port);
