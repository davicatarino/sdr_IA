// SQL para criar tabela de histórico de conversas
// CREATE TABLE conversation_history (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   thread_id VARCHAR(255),
//   user_id VARCHAR(255),
//   role ENUM('user', 'assistant'),
//   message TEXT,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// SQL para criar tabela de reuniões
// CREATE TABLE meetings (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   thread_id VARCHAR(255),
//   user_id VARCHAR(255),
//   event_id VARCHAR(255),
//   summary VARCHAR(255),
//   start_time DATETIME,
//   end_time DATETIME,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// ); 