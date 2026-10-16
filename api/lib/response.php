<?php

function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): void
{
    jsonResponse(['success' => false, 'error' => $message], $status);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonError('JSON inválido', 400);
    }

    return $data;
}

function mapPatient(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'age' => $row['age'] !== null ? (int) $row['age'] : null,
        'gender' => $row['gender'],
    ];
}

function mapAppointment(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'patientId' => (int) $row['patient_id'],
        'patient' => $row['patient_name'] ?? null,
        'date' => $row['appointment_date'],
        'time' => substr($row['appointment_time'], 0, 5),
        'type' => $row['type'],
        'value' => (float) $row['value'],
        'category' => $row['category'],
        'payment' => $row['payment'],
        'status' => $row['status'],
        'observations' => $row['observations'],
    ];
}
