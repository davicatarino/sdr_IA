import express from 'express';
import agendaController from './agenda-controller.js';

const app = express();
app.use(express.json());
app.use('/agenda', agendaController);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`MCP Server rodando na porta ${PORT}`);
}); 