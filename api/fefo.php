<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

switch ($method) {
    // ── Export with FEFO (Transaction + Rollback) ──
    case 'POST':
        $body   = getBody();
        $drugId = $body['drug_id']   ?? '';
        $qty    = (int)($body['qty'] ?? 0);
        $note   = $body['note']      ?? '';
        $userId = $body['user_id']   ?? 'system';

        if (!$drugId || $qty <= 0) respond(['error' => 'drug_id and qty required'], 400);

        // Check total stock
        $stmt = $db->prepare("SELECT COALESCE(SUM(qty),0) AS total FROM tblBatches WHERE drug_id=? AND qty>0 AND status!='expired'");
        $stmt->bind_param('s', $drugId);
        $stmt->execute();
        $totalQty = (int)$stmt->get_result()->fetch_assoc()['total'];
        if ($totalQty < $qty) respond(['error' => "Không đủ tồn kho. Có: $totalQty, Yêu cầu: $qty"], 400);

        // BEGIN TRANSACTION
        $db->begin_transaction();
        try {
            // Create export order
            $exportNo = 'EXP-' . date('Ymd') . '-' . substr(uniqid(), -5);
            $stmt = $db->prepare("INSERT INTO tblExportOrders (export_no, drug_id, total_qty, note, created_by, created_at) VALUES (?,?,?,?,?,NOW())");
            $stmt->bind_param('ssiis', $exportNo, $drugId, $qty, $note, $userId);
            $stmt->execute();
            $exportId = $db->insert_id;

            // FEFO: get batches sorted by expiry_date ASC
            $stmt = $db->prepare("SELECT batch_id, batch_no, qty, expiry_date FROM tblBatches WHERE drug_id=? AND qty>0 AND status!='expired' ORDER BY expiry_date ASC FOR UPDATE");
            $stmt->bind_param('s', $drugId);
            $stmt->execute();
            $batches = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            $remaining = $qty;
            foreach ($batches as $batch) {
                if ($remaining <= 0) break;
                $take = min($remaining, (int)$batch['qty']);

                // Deduct from batch
                $stmt2 = $db->prepare("UPDATE tblBatches SET qty = qty - ? WHERE batch_id=?");
                $stmt2->bind_param('ii', $take, $batch['batch_id']);
                $stmt2->execute();

                // Insert export detail
                $stmt3 = $db->prepare("INSERT INTO tblExportDetails (export_id, batch_id, batch_no, qty_taken) VALUES (?,?,?,?)");
                $stmt3->bind_param('iisi', $exportId, $batch['batch_id'], $batch['batch_no'], $take);
                $stmt3->execute();

                // Log transaction
                $stmt4 = $db->prepare("INSERT INTO tblTransactions (type, drug_id, batch_id, qty, note, created_by, created_at) VALUES ('export',?,?,?,?,?,NOW())");
                $stmt4->bind_param('siiss', $drugId, $batch['batch_id'], $take, $note, $userId);
                $stmt4->execute();

                $remaining -= $take;
            }

            $db->commit();
            respond(['success' => true, 'export_no' => $exportNo, 'total_exported' => $qty]);

        } catch (Exception $e) {
            $db->rollback(); // ROLLBACK on any error
            respond(['error' => 'Transaction failed: ' . $e->getMessage(), 'rollback' => true], 500);
        }
        break;

    // ── Get Export History ──
    case 'GET':
        $result = $db->query("
            SELECT o.*, d.drug_name FROM tblExportOrders o
            JOIN tblDrugs d ON o.drug_id = d.drug_id
            ORDER BY o.created_at DESC LIMIT 50
        ");
        $rows = [];
        while ($r = $result->fetch_assoc()) $rows[] = $r;
        respond(['data' => $rows]);
        break;
}
