export type Product = {
  id: number;
  name: string;
  description: string;
};

export type RequestItem = {
  productId: number;
  productName: string;
  quantity: number;
  exportedQuantity?: number;
};

export type StockRequestStatus =
  | "pending" // mới gửi
  | "approved" // đã duyệt
  | "rejected" // bị từ chối
  | "processing" // đang xuất kho (FEFO / picking)
  | "completed" // đã hoàn tất (đã giao + nhận xong)
  | "shortage" // thiếu thuốc
  | "expired" // quá 3 ngày auto reject
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "SHORTAGE"
  | "EXPIRED";

export type StockRequest = {
  id: number;
  type: "take" | "return";
  items: RequestItem[];

  status: StockRequestStatus;

  createdAt: string;
  confirmedAt?: string;

  // 👇 thêm để xử lý nghiệp vụ thật
  processedAt?: string; // lúc admin duyệt / reject
  completedAt?: string; // lúc hoàn tất

  note?: string; // lý do reject / ghi chú
};

export const products: Product[] = [
  {
    id: 1,
    name: "Paracetamol",
    description: "Thuốc giảm đau, hạ sốt",
  },
  {
    id: 2,
    name: "Vitamin C",
    description: "Tăng đề kháng, bổ sung vitamin",
  },
  {
    id: 3,
    name: "Amoxicillin",
    description: "Kháng sinh điều trị nhiễm khuẩn",
  },
];

export const stockRequests: StockRequest[] = [
  {
    id: 1,
    type: "take",
    status: "pending",
    createdAt: "2026-04-10",
    items: [
      { productId: 1, productName: "Paracetamol", quantity: 10 },
      { productId: 2, productName: "Vitamin C", quantity: 5 },
    ],
  },
  {
    id: 2,
    type: "return",
    status: "approved",
    createdAt: "2026-04-09",
    processedAt: "2026-04-10",
    items: [{ productId: 1, productName: "Paracetamol", quantity: 3 }],
  },
  {
    id: 3,
    type: "take",
    status: "rejected",
    createdAt: "2026-04-05",
    processedAt: "2026-04-06",
    note: "Không đủ tồn kho",
    items: [{ productId: 2, productName: "Vitamin C", quantity: 8 }],
  },
];

export const batches = [
  {
    id: 1,
    productId: 1,
    batchCode: "A001",
    quantity: 5,
    expiryDate: "2026-04-20",
  },
  {
    id: 2,
    productId: 1,
    batchCode: "A002",
    quantity: 20,
    expiryDate: "2026-05-01",
  },
  {
    id: 3,
    productId: 2,
    batchCode: "B001",
    quantity: 15,
    expiryDate: "2026-04-18",
  },
];
