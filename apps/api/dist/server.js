import express from 'express';
import { router } from './routes/index.js';
const app = express();
app.use('/api', router);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`API listening on ${port}`);
});
