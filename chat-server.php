<?php
require 'vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\App;

class ChatServer implements MessageComponentInterface {
    protected $clients;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        
        // Envia o próprio ID para o cliente
        $conn->send(json_encode(["type" => "id", "id" => $conn->resourceId]));
    
        echo "Nova conexão: {$conn->resourceId}\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
    
        if (!isset($data["text"])) {
            return;
        }
    
        $response = json_encode([
            "text" => $data["text"],
            "sender" => $from->resourceId // Usa o ID do cliente como identificador
        ]);
    
        foreach ($this->clients as $client) {
            $client->send($response);
        }
    
        // Exibe a mensagem no terminal (apenas para debug)
        echo "Usuário {$from->resourceId} enviou: {$data["text"]}\n";
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Conexão fechada ({$conn->resourceId})\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "Erro: {$e->getMessage()}\n";
        $conn->close();
    }
}

$app = new App("localhost", 8080, "0.0.0.0");
$app->route('/chat', new ChatServer, ['*']);
$app->run();
