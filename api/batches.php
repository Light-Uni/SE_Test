<?php
require_once __DIR__ . '/config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

$db = getDB();

switch ($action) {
    // ── GET FEFO Queue ──
    case 'fefo':
        $drugId = $_GET['drug_id'] ?? '';
        if (!$drugId) respond(['error' => 'drug_id required'], 400);
        $stmt = $db->prepare("
            SELECT b.*, l.location_name, l.zone, l.condition_temp
            FROM tblBatches b
            LEFT JOIN tblLocations l ON b.location_id = l.location_id
            WHERE b.drug_id = ? AND b.qty > 0 AND b.status != 'expired'
            ORDER BY b.expiry_date ASC
        ");
        $stmt->bind_param('s', $drugId);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) $rows[] = $row;
        respond(['data' => $rows]);
        break;

    // ── CHECK THRESHOLD ──
    case 'threshold':
        $result = $db->query("
            SELECT d.drug_id, d.drug_name, d.min_stock, COALESCE(SUM(b.qty),0) AS current_qty
            FROM tblDrugs d
            LEFT JOIN tblBatches b ON d.drug_id = b.drug_id AND b.qty > 0
            GROUP BY d.drug_id
            HAVING current_qty < d.min_stock
        ");
        $rows = [];
        while ($row = $result->fetch_assoc()) $rows[] = $row;
        respond(['alerts' => $rows, 'count' => count($rows)]);
        break;

    // ── LIST ALL BATCHES ──
    case 'list':
    default:
        $where = "1=1";
        $params = [];
        $types = '';
        if (!empty($_GET['drug_id']))   { $where .= " AND b.drug_id=?";   $params[]=$_GET['drug_id'];   $types.='s'; }
        if (!empty($_GET['status']))    { $where .= " AND b.status=?";    $params[]=$_GET['status'];    $types.='s'; }
        if (!empty($_GET['zone']))      { $where .= " AND l.zone LIKE ?"; $params[]='%'.$_GET['zone'].'%'; $types.='s'; }

        $sql = "SELECT b.*, d.drug_name, d.drug_code, d.category, l.location_name, l.zone, l.condition_temp
                FROM tblBatches b
                JOIN tblDrugs d ON b.drug_id = d.drug_id
                LEFT JOIN tblLocations l ON b.location_id = l.location_id
                WHERE $where ORDER BY b.expiry_date ASC LIMIT 100";
        $stmt = $db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $exp = new DateTime($row['expiry_date']);
            $now = new DateTime();
            $diff = (int)$now->diff($exp)->days * ($exp >= $now ? 1 : -1);
            $row['days_left'] = $diff;
            $row['status'] = $diff < 0 ? 'expired' : ($diff <= ($row['near_date_days'] ?? 90) ? 'near' : 'safe');
            $rows[] = $row;
        }
        respond(['data' => $rows, 'total' => count($rows)]);
        break;
}
