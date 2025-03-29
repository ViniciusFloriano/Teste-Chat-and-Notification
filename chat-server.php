<?php
// Carrega as dependências do projeto via Composer
require 'vendor/autoload.php';

// Importa as classes necessárias do Ratchet
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\App;

/**
 * Classe ChatServer - Implementa o servidor de chat WebSocket
 * 
 * Esta classe é responsável por gerenciar as conexões dos clientes,
 * receber e distribuir mensagens, e lidar com eventos de conexão/desconexão
 */
class ChatServer implements MessageComponentInterface {
    // Armazena todos os clientes conectados
    protected $clients;

    /**
     * Construtor da classe
     * Inicializa o armazenamento de clientes
     */
    public function __construct() {
        // SplObjectStorage é eficiente para armazenar objetos (conexões)
        $this->clients = new \SplObjectStorage;
    }

    /**
     * Método chamado quando um novo cliente se conecta
     * @param ConnectionInterface $conn - Objeto de conexão do cliente
     */
    public function onOpen(ConnectionInterface $conn) {
        // Adiciona o novo cliente à lista de conexões
        $this->clients->attach($conn);
        
        // Envia o ID único da conexão para o cliente
        $conn->send(json_encode([
            "type" => "id", 
            "id" => $conn->resourceId
        ]));
    
        // Log no servidor (apenas para debug)
        echo "Nova conexão: {$conn->resourceId}\n";
    }

    /**
     * Método chamado quando uma mensagem é recebida de um cliente
     * @param ConnectionInterface $from - Cliente que enviou a mensagem
     * @param string $msg - Mensagem recebida (formato JSON)
     */
    public function onMessage(ConnectionInterface $from, $msg) {
        // Decodifica a mensagem JSON
        $data = json_decode($msg, true);
    
        // Verifica se a mensagem contém texto
        if (!isset($data["text"])) {
            return; // Ignora mensagens inválidas
        }
    
        // Prepara a resposta para broadcast
        $response = json_encode([
            "text" => $data["text"], // Texto da mensagem
            "sender" => $from->resourceId // ID do remetente
        ]);
    
        // Envia a mensagem para TODOS os clientes conectados
        foreach ($this->clients as $client) {
            $client->send($response);
        }
    
        // Log no terminal do servidor (para monitoramento)
        echo "Usuário {$from->resourceId} enviou: {$data["text"]}\n";
    }

    /**
     * Método chamado quando um cliente desconecta
     * @param ConnectionInterface $conn - Conexão que foi fechada
     */
    public function onClose(ConnectionInterface $conn) {
        // Remove o cliente da lista de conexões ativas
        $this->clients->detach($conn);
        echo "Conexão fechada ({$conn->resourceId})\n";
    }

    /**
     * Método chamado quando ocorre um erro na conexão
     * @param ConnectionInterface $conn - Conexão com erro
     * @param \Exception $e - Objeto de exceção
     */
    public function onError(ConnectionInterface $conn, \Exception $e) {
        // Exibe o erro e fecha a conexão problemática
        echo "Erro: {$e->getMessage()}\n";
        $conn->close();
    }
}

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

// Cria uma nova instância do servidor WebSocket
// Parâmetros:
// - "localhost": Domínio do servidor
// - 8080: Porta de escuta
// - "0.0.0.0": Escuta em todas as interfaces de rede
$app = new App("localhost", 8080, "0.0.0.0");

// Configura a rota '/chat' para usar nossa classe ChatServer
// O array ['*'] permite qualquer origem (CORS)
$app->route('/chat', new ChatServer, ['*']);

// Inicia o servidor WebSocket
$app->run();

?>