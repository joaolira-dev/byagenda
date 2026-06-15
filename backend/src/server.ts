import dotenv from 'dotenv';

dotenv.config();

const { app } = await import('./app.js');
const { env } = await import('./config/env.js');

app.listen(env.PORT, () => {
  console.log(`ByAgenda Backend running on http://localhost:${env.PORT}`);
});
