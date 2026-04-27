# Pharmacy WMS

Hệ thống quản lý kho dược phẩm (Warehouse Management System).

## Cài đặt & Chạy

### 1. Tạo Database

Import file `server/schema.sql` vào MySQL:

```bash
mysql -u root -p < server/schema.sql
```

Hoặc mở file `server/schema.sql` trong **phpMyAdmin** / **MySQL Workbench** và chạy.

> File này sẽ tự động tạo database `pharmacy_db`, toàn bộ bảng và tài khoản mặc định.

**Tài khoản mặc định** (mật khẩu: `123456`):

| Username      | Role         |
|---------------|--------------|
| `manager`     | Quản lý      |
| `storekeeper` | Thủ kho      |
| `staff`       | Nhân viên    |

---

### 2. Cấu hình môi trường

Chỉnh sửa file `server/.env` nếu cần:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pharmacy_db
JWT_SECRET=supersecret123
```

---

### 3. Cài dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

---

### 4. Chạy ứng dụng

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Truy cập: **http://localhost:5173**