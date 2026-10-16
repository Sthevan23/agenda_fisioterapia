<?php

function handleAppointments(PDO $pdo, string $method, ?int $id, array $body): void
{
    switch ($method) {
        case 'GET':
            if ($id !== null) {
                getAppointment($pdo, $id);
            } else {
                listAppointments($pdo);
            }
            break;
        case 'POST':
            createAppointment($pdo, $body);
            break;
        case 'PUT':
        case 'PATCH':
            if ($id === null) {
                jsonError('ID da consulta é obrigatório', 400);
            }
            updateAppointment($pdo, $id, $body);
            break;
        case 'DELETE':
            if ($id === null) {
                jsonError('ID da consulta é obrigatório', 400);
            }
            deleteAppointmentRecord($pdo, $id);
            break;
        default:
            jsonError('Método não permitido', 405);
    }
}

function appointmentSelectSql(): string
{
    return 'SELECT a.*, p.name AS patient_name
            FROM appointments a
            INNER JOIN patients p ON p.id = a.patient_id';
}

function listAppointments(PDO $pdo): void
{
    $stmt = $pdo->query(appointmentSelectSql() . ' ORDER BY a.appointment_date DESC, a.appointment_time DESC');
    $rows = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => array_map('mapAppointment', $rows),
    ]);
}

function getAppointment(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare(appointmentSelectSql() . ' WHERE a.id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonError('Consulta não encontrada', 404);
    }

    jsonResponse(['success' => true, 'data' => mapAppointment($row)]);
}

function createAppointment(PDO $pdo, array $body): void
{
    $patientId = (int) ($body['patientId'] ?? 0);
    $date = $body['date'] ?? '';
    $time = $body['time'] ?? '';
    $type = $body['type'] ?? '';
    $value = (float) ($body['value'] ?? 0);
    $category = $body['category'] ?? '';
    $payment = $body['payment'] ?? '';
    $status = $body['status'] ?? 'confirmed';
    $observations = trim($body['observations'] ?? '') ?: null;

    validateAppointmentInput($pdo, $patientId, $date, $time, $type, $value, $category, $payment, $status);
    assertSlotFree($pdo, $date, $time, $status, null);

    $stmt = $pdo->prepare(
        'INSERT INTO appointments
        (patient_id, appointment_date, appointment_time, type, value, category, payment, status, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $patientId,
        $date,
        $time . ':00',
        $type,
        $value,
        $category,
        $payment,
        $status,
        $observations,
    ]);

    getAppointment($pdo, (int) $pdo->lastInsertId());
}

function updateAppointment(PDO $pdo, int $id, array $body): void
{
    $stmt = $pdo->prepare(appointmentSelectSql() . ' WHERE a.id = ?');
    $stmt->execute([$id]);
    $current = $stmt->fetch();

    if (!$current) {
        jsonError('Consulta não encontrada', 404);
    }

    $patientId = (int) ($body['patientId'] ?? $current['patient_id']);
    $date = $body['date'] ?? $current['appointment_date'];
    $time = $body['time'] ?? substr($current['appointment_time'], 0, 5);
    $type = $body['type'] ?? $current['type'];
    $value = isset($body['value']) ? (float) $body['value'] : (float) $current['value'];
    $category = $body['category'] ?? $current['category'];
    $payment = $body['payment'] ?? $current['payment'];
    $status = $body['status'] ?? $current['status'];
    $observations = array_key_exists('observations', $body)
        ? (trim((string) $body['observations']) ?: null)
        : $current['observations'];

    validateAppointmentInput($pdo, $patientId, $date, $time, $type, $value, $category, $payment, $status);
    assertSlotFree($pdo, $date, $time, $status, $id);

    $stmt = $pdo->prepare(
        'UPDATE appointments SET
            patient_id = ?, appointment_date = ?, appointment_time = ?, type = ?,
            value = ?, category = ?, payment = ?, status = ?, observations = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $patientId,
        $date,
        $time . (strlen($time) === 5 ? ':00' : ''),
        $type,
        $value,
        $category,
        $payment,
        $status,
        $observations,
        $id,
    ]);

    getAppointment($pdo, $id);
}

function deleteAppointmentRecord(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('SELECT id FROM appointments WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonError('Consulta não encontrada', 404);
    }

    $stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Consulta excluída']);
}

function validateAppointmentInput(
    PDO $pdo,
    int $patientId,
    string $date,
    string $time,
    string $type,
    float $value,
    string $category,
    string $payment,
    string $status
): void {
    if ($patientId <= 0) {
        jsonError('Paciente inválido', 422);
    }

    $stmt = $pdo->prepare('SELECT id FROM patients WHERE id = ?');
    $stmt->execute([$patientId]);
    if (!$stmt->fetch()) {
        jsonError('Paciente não encontrado', 422);
    }

    if ($date === '' || $time === '') {
        jsonError('Data e horário são obrigatórios', 422);
    }

    if ($type === '' || $category === '' || $payment === '') {
        jsonError('Tipo, categoria e pagamento são obrigatórios', 422);
    }

    if ($value <= 0) {
        jsonError('Valor da consulta inválido', 422);
    }

    if (!in_array($status, ['confirmed', 'finished', 'cancelled'], true)) {
        jsonError('Status inválido', 422);
    }
}

function assertSlotFree(PDO $pdo, string $date, string $time, string $status, ?int $ignoreId): void
{
    if ($status === 'cancelled') {
        return;
    }

    $clock = substr($time, 0, 5);
    $sql = "SELECT id FROM appointments
            WHERE appointment_date = ?
              AND TIME_FORMAT(appointment_time, '%H:%i') = ?
              AND status <> 'cancelled'";
    $params = [$date, $clock];

    if ($ignoreId !== null) {
        $sql .= ' AND id <> ?';
        $params[] = $ignoreId;
    }

    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->fetch()) {
        jsonError('Já existe uma consulta neste horário.', 409);
    }
}
