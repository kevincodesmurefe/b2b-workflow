import app from './app';
import dotenv from 'dotenv';
dotenv.config();

const PORT =  process.env.PORT ?? 6789; 
app.listen(PORT, (): void => { console.log(`listening on port ${PORT}`); });