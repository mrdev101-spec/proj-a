# Health Station Dashboard

Dashboard สำหรับแสดงข้อมูลศูนย์บริการสุขภาพ (Hospital Directory) โดยดึงข้อมูลจาก Google Sheets CSV

## คุณสมบัติ (Features)
- แสดงรายการศูนย์บริการสุขภาพ
- ค้นหาข้อมูล (ชื่อ, HCode, อำเภอ)
- กรองข้อมูลตามอำเภอ
- แบ่งหน้าข้อมูล (Pagination)
- คัดลอก AnyDesk ID (รองรับทั้ง HTTPS และ HTTP/LAN)
- ลิงก์ไปยังแผนที่

## วิธีการรัน (How to Run)

### แบบง่าย (ผ่าน npx)
หากเครื่องมี Node.js ติดตั้งอยู่ สามารถรันคำสั่งนี้ใน Terminal ได้เลย:

```bash
npx http-server
```

เมื่อรันแล้ว จะปรากฏลิงก์สำหรับเข้าใช้งาน เช่น:
- `http://127.0.0.1:8080` (สำหรับเครื่องตัวเอง)
- `http://192.168.x.x:8080` (สำหรับเปิดจากเครื่องอื่นในวง LAN)

### แบบเปิดไฟล์โดยตรง
เนื่องจากโปรเจกต์นี้ใช้ `fetch` API ในการดึงข้อมูล CSV การเปิดไฟล์ `index.html` โดยตรง (double click) อาจจะติดปัญหา CORS ในบาง Browser
แนะนำให้รันผ่าน Local Server (เช่น VS Code Live Server หรือ http-server) จะดีที่สุด

## การแก้ไขข้อมูล
ข้อมูลถูกดึงมาจาก Google Sheets CSV หากต้องการเปลี่ยนแหล่งข้อมูล ให้แก้ไขตัวแปร `SHEET_CSV_URL` ในไฟล์ `script.js`
