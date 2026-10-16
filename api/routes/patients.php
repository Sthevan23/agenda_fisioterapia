<?php

function handlePatients(PDO $pdo, string $method, ?int $id, array $body): void
{
    switch ($method) {
        case 'GET':
            if ($id !== null) {
                getPatient($pdo, $id);
            } else {
                listPatients($pdo);
            }
            break;
        case 'POST':
            createPatient($pdo, $body);
            break;
        case 'PUT':
            if ($id === null) {
                jsonError('ID do paciente é obrigatório', 400);
            }
            updatePatient($pdo, $id, $body);
            break;
        case 'DELETE':
            if ($id === null) {
                jsonError('ID do paciente é obrigatório', 400);
            }
            deletePatientRecord($pdo, $id);
            break;
        default:
            jsonError('Método não permitido', 405);
    }
}

function listPatients(PDO $pdo): void
{
    $stmt = $pdo->query('SELECT * FROM patients ORDER BY name ASC');
    $rows = $stmt->fetchAll();
    jsonResponse([
        'success' => true,
        'data' => array_map('mapPatient', $rows),
    ]);
}

function getPatient(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('SELECT * FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonError('Paciente não encontrado', 404);
    }

    jsonResponse(['success' => true, 'data' => mapPatient($row)]);
}

function createPatient(PDO $pdo, array $body): void
{
    $name = trim($body['name'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $age = isset($body['age']) && $body['age'] !== '' ? (int) $body['age'] : null;
    $gender = $body['gender'] ?? 'masculino';

    if ($name === '' || $phone === '') {
        jsonError('Nome e telefone são obrigatórios', 422);
    }

    if (!in_array($gender, ['masculino', 'feminino'], true)) {
        jsonError('Gênero inválido', 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO patients (name, phone, age, gender) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$name, $phone, $age, $gender]);

    getPatient($pdo, (int) $pdo->lastInsertId());
}

function updatePatient(PDO $pdo, int $id, array $body): void
{
    $stmt = $pdo->prepare('SELECT id FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonError('Paciente não encontrado', 404);
    }

    $name = trim($body['name'] ?? '');
    $phone = trim($body['phone'] ?? '');
    $age = isset($body['age']) && $body['age'] !== '' && $body['age'] !== null ? (int) $body['age'] : null;
    $gender = $body['gender'] ?? 'masculino';

    if ($name === '' || $phone === '') {
        jsonError('Nome e telefone são obrigatórios', 422);
    }

    if (!in_array($gender, ['masculino', 'feminino'], true)) {
        jsonError('Gênero inválido', 422);
    }

    $stmt = $pdo->prepare(
        'UPDATE patients SET name = ?, phone = ?, age = ?, gender = ? WHERE id = ?'
    );
    $stmt->execute([$name, $phone, $age, $gender, $id]);

    getPatient($pdo, $id);
}

function deletePatientRecord(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('SELECT id FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonError('Paciente não encontrado', 404);
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM appointments WHERE patient_id = ?');
    $stmt->execute([$id]);
    if ((int) $stmt->fetchColumn() > 0) {
        jsonError('Paciente possui consultas vinculadas. Exclua as consultas primeiro.', 409);
    }

    $stmt = $pdo->prepare('DELETE FROM patients WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Paciente removido']);
}
