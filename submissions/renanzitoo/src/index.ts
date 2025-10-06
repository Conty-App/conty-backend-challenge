import express, {Application} from 'express';
import payoutsRouter from './routes/payouts';

const app: Application = express();
app.use(express.json());

app.use('/payouts', payoutsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});