package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

var db *sql.DB

func initDB(dbPath string) error {
	var err error
	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	_, err = db.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return err
	}

	tables := []string{
		`CREATE TABLE IF NOT EXISTS products (
			sku INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(255) NOT NULL,
			price DECIMAL(10, 2) NOT NULL,
			available_stock INTEGER NOT NULL DEFAULT 0
		);`,
		`CREATE TABLE IF NOT EXISTS customers (
			customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_type VARCHAR(50),
			name VARCHAR(255) NOT NULL,
			address VARCHAR(255),
			contact_info VARCHAR(255)
		);`,
		`CREATE TABLE IF NOT EXISTS employees (
			employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
			full_name VARCHAR(255) NOT NULL,
			position VARCHAR(100)
		);`,
		`CREATE TABLE IF NOT EXISTS orders (
			order_id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_id INTEGER,
			employee_id INTEGER,
			order_date DATE,
			delivery_date DATE,
			status VARCHAR(50),
			ttn_number VARCHAR(100),
			shipment_date DATE,
			receipt_date DATE,
			claim_type VARCHAR(100),
			claim_description TEXT,
			resolution_date DATE,
			claim_status VARCHAR(50),
			FOREIGN KEY(customer_id) REFERENCES customers(customer_id),
			FOREIGN KEY(employee_id) REFERENCES employees(employee_id)
		);`,
		`CREATE TABLE IF NOT EXISTS order_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			order_id INTEGER,
			sku INTEGER,
			sale_price DECIMAL(10, 2),
			ordered_quantity INTEGER,
			received_quantity INTEGER,
			FOREIGN KEY(order_id) REFERENCES orders(order_id),
			FOREIGN KEY(sku) REFERENCES products(sku)
		);`,
	}

	for _, query := range tables {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	return nil
}

func generateSKU(db *sql.DB) int {
	rand.Seed(time.Now().UnixNano())
	for {
		sku := rand.Intn(900000) + 100000 // 100000 - 999999
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM products WHERE sku = ?)", sku).Scan(&exists)
		if err == nil && !exists {
			return sku
		}
	}
}

func sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func parseJSON(r *http.Request, dest interface{}) error {
	return json.NewDecoder(r.Body).Decode(dest)
}

// --- GET Handlers ---

func getProductsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT sku, name, price, available_stock FROM products")
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var id, stock int
		var name string
		var price float64
		rows.Scan(&id, &name, &price, &stock)
		status := "Нет в наличии"
		if stock > 0 { if stock < 10 { status = "Мало" } else { status = "В наличии" } }
		
		res = append(res, map[string]interface{}{
			"id": id, 
			"article": fmt.Sprintf("%06d", id), 
			"name": name, 
			"price": price, 
			"stock": stock, 
			"status": status,
		})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getCustomersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT customer_id, customer_type, name, address, contact_info FROM customers")
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var id int
		var t, n, a, c sql.NullString
		rows.Scan(&id, &t, &n, &a, &c)
		res = append(res, map[string]interface{}{"id": id, "type": t.String, "name": n.String, "address": a.String, "contacts": c.String})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT employee_id, full_name, position FROM employees")
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var id int
		var n, p sql.NullString
		rows.Scan(&id, &n, &p)
		res = append(res, map[string]interface{}{"id": id, "name": n.String, "position": p.String, "status": "Активен"})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT order_id, customer_id, employee_id, order_date, delivery_date, status, claim_description, claim_status
		FROM orders`)
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var id, cid, eid int
		var d1, d2, st, notes, claimSt sql.NullString
		rows.Scan(&id, &cid, &eid, &d1, &d2, &st, &notes, &claimSt)
		
		itemRows, _ := db.Query("SELECT sku, ordered_quantity FROM order_items WHERE order_id = ?", id)
		var items []map[string]interface{}
		for itemRows.Next() {
			var pid, qty int
			itemRows.Scan(&pid, &qty)
			items = append(items, map[string]interface{}{"productId": pid, "quantity": qty})
		}
		itemRows.Close()

		orderNumber := fmt.Sprintf("ЗК-2026-%03d", id)
		
		res = append(res, map[string]interface{}{
			"id": id, "orderNumber": orderNumber, "customerId": cid, "employeeId": eid,
			"deliveryDate": d2.String, "status": st.String, "createdAt": d1.String, "notes": notes.String,
			"claimStatus": claimSt.String,
			"items": items,
		})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getShipmentsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT order_id, ttn_number, shipment_date FROM orders WHERE ttn_number IS NOT NULL AND ttn_number != ''")
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var oid int
		var ttn, d sql.NullString
		rows.Scan(&oid, &ttn, &d)
		res = append(res, map[string]interface{}{
			"id": oid, "orderId": oid, "ttnNumber": ttn.String, "date": d.String, "status": "Отгружена", "quantity": 1,
		})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getReceiptsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT z.order_id, z.receipt_date, z.claim_type, sz.received_quantity
	                       FROM orders z JOIN order_items sz ON z.order_id = sz.order_id WHERE z.receipt_date IS NOT NULL AND z.receipt_date != ''`)
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var oid int
		var d, claimType sql.NullString
		var qty sql.NullInt64
		rows.Scan(&oid, &d, &claimType, &qty)
		discrepancy := ""
		if claimType.String != "" {
			discrepancy = claimType.String
		}
		res = append(res, map[string]interface{}{
			"id": oid, "orderId": oid, "shipmentId": oid, "date": d.String, "acceptedQuantity": qty.Int64, "discrepancyReason": discrepancy,
		})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getClaimsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT order_id, customer_id, employee_id, claim_type, claim_description, resolution_date, claim_status, order_date FROM orders WHERE claim_type IS NOT NULL AND claim_type != ''")
	if err != nil { http.Error(w, err.Error(), http.StatusInternalServerError); return }
	defer rows.Close()

	var res []map[string]interface{}
	for rows.Next() {
		var oid, cid, eid int
		var tp, dsc, dead, st, cr sql.NullString
		rows.Scan(&oid, &cid, &eid, &tp, &dsc, &dead, &st, &cr)
		res = append(res, map[string]interface{}{
			"id": oid, "orderId": oid, "customerId": cid, "employeeId": eid, "type": tp.String,
			"description": dsc.String, "deadline": dead.String, "status": st.String, "createdAt": cr.String, "resolution": "",
		})
	}
	if res == nil { res = make([]map[string]interface{}, 0) }
	sendJSON(w, res)
}

func getStockReceiptsHandler(w http.ResponseWriter, r *http.Request) {
	sendJSON(w, []map[string]interface{}{})
}

// --- POST/PUT Handlers ---
func postProductsHandler(w http.ResponseWriter, r *http.Request) {
	var p map[string]interface{}
	parseJSON(r, &p)
	name := p["name"].(string)

	var existingSKU int
	err := db.QueryRow("SELECT sku FROM products WHERE name = ?", name).Scan(&existingSKU)
	if err == nil {
		sendJSON(w, map[string]int64{"id": int64(existingSKU)})
		return
	}

	sku := generateSKU(db)
	db.Exec("INSERT INTO products (sku, name, price, available_stock) VALUES (?, ?, ?, ?)", sku, name, p["price"], p["stock"])
	
	sendJSON(w, map[string]int64{"id": int64(sku)})
}
func putProductsHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	var p map[string]interface{}
	parseJSON(r, &p)
	if stock, ok := p["stock"]; ok {
		db.Exec("UPDATE products SET available_stock = ? WHERE sku = ?", stock, id)
	}
	if status, ok := p["status"]; ok {
		_ = status // status is frontend-only for now
	}
	if price, ok := p["price"]; ok {
		db.Exec("UPDATE products SET price = ? WHERE sku = ?", price, id)
	}
	sendJSON(w, map[string]bool{"ok": true})
}

func putOrdersHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	var o map[string]interface{}
	parseJSON(r, &o)
	if status, ok := o["status"]; ok {
		db.Exec("UPDATE orders SET status = ? WHERE order_id = ?", status, id)
	}
	if cs, ok := o["claim_status"]; ok {
		db.Exec("UPDATE orders SET claim_status = ? WHERE order_id = ?", cs, id)
	}
	sendJSON(w, map[string]bool{"ok": true})
}

func putClaimsHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	var c map[string]interface{}
	parseJSON(r, &c)
	if status, ok := c["status"]; ok {
		db.Exec("UPDATE orders SET claim_status = ? WHERE order_id = ?", status, id)
		// When claim is closed, update order status to Выполнен
		if status == "Закрыта" {
			db.Exec("UPDATE orders SET status = 'Выполнен' WHERE order_id = ?", id)
		}
	}
	if res, ok := c["resolution"]; ok {
		db.Exec("UPDATE orders SET claim_description = claim_description || ' | Решение: ' || ? WHERE order_id = ?", res, id)
	}
	sendJSON(w, map[string]bool{"ok": true})
}

func genericPost(w http.ResponseWriter) { w.WriteHeader(http.StatusCreated); sendJSON(w, map[string]int{"id": 1}) }

func deleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	db.Exec("DELETE FROM order_items WHERE order_id = ?", id)
	db.Exec("DELETE FROM orders WHERE order_id = ?", id)
	sendJSON(w, map[string]bool{"ok": true})
}

func deleteProductHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	db.Exec("DELETE FROM products WHERE sku = ?", id)
	sendJSON(w, map[string]bool{"ok": true})
}

func deleteShipmentHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	id := parts[len(parts)-1]
	db.Exec("UPDATE orders SET ttn_number = NULL, shipment_date = NULL, status = 'Новый' WHERE order_id = ?", id)
	sendJSON(w, map[string]bool{"ok": true})
}

func postCustomersHandler(w http.ResponseWriter, r *http.Request) {
	var c map[string]interface{}
	parseJSON(r, &c)
	res, _ := db.Exec("INSERT INTO customers (customer_type, name, address, contact_info) VALUES (?, ?, ?, ?)", c["type"], c["name"], c["address"], c["contacts"])
	id, _ := res.LastInsertId()
	sendJSON(w, map[string]int64{"id": id})
}

func postOrdersHandler(w http.ResponseWriter, r *http.Request) {
	var o map[string]interface{}
	parseJSON(r, &o)
	res, _ := db.Exec("INSERT INTO orders (customer_id, employee_id, order_date, delivery_date, status, claim_description) VALUES (?, ?, ?, ?, ?, ?)",
		o["customerId"], o["employeeId"], o["createdAt"], o["deliveryDate"], o["status"], o["notes"])
	id, _ := res.LastInsertId()
	
	if itemsIf, ok := o["items"]; ok && itemsIf != nil {
		items := itemsIf.([]interface{})
		for _, itemIf := range items {
			item := itemIf.(map[string]interface{})
			db.Exec("INSERT INTO order_items (order_id, sku, ordered_quantity, sale_price) VALUES (?, ?, ?, (SELECT price FROM products WHERE sku=?))", 
				id, item["productId"], item["quantity"], item["productId"])
		}
	} else {
		db.Exec("INSERT INTO order_items (order_id, sku, ordered_quantity, sale_price) VALUES (?, ?, ?, (SELECT price FROM products WHERE sku=?))", id, o["productId"], o["quantity"], o["productId"])
	}
	
	sendJSON(w, map[string]int64{"id": id})
}

func postShipmentsHandler(w http.ResponseWriter, r *http.Request) {
	var s map[string]interface{}
	parseJSON(r, &s)
	db.Exec("UPDATE orders SET ttn_number = ?, shipment_date = ?, status = 'Отгружен' WHERE order_id = ?", s["ttnNumber"], s["date"], s["orderId"])
	genericPost(w)
}

func postReceiptsHandler(w http.ResponseWriter, r *http.Request) {
	var rec map[string]interface{}
	parseJSON(r, &rec)
	db.Exec("UPDATE orders SET receipt_date = ? WHERE order_id = ?", rec["date"], rec["orderId"])
	db.Exec("UPDATE order_items SET received_quantity = ? WHERE order_id = ?", rec["acceptedQuantity"], rec["orderId"])
	genericPost(w)
}

func postClaimsHandler(w http.ResponseWriter, r *http.Request) {
	var c map[string]interface{}
	parseJSON(r, &c)
	db.Exec("UPDATE orders SET claim_type = ?, claim_description = ?, resolution_date = ?, claim_status = ? WHERE order_id = ?",
		c["type"], c["description"], c["deadline"], c["status"], c["orderId"])
	genericPost(w)
}

func postStockReceiptsHandler(w http.ResponseWriter, r *http.Request) {
	genericPost(w)
}

// Router map
func routerWithDelete(get, post, put, del http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			if get != nil { get(w, r) } else { sendJSON(w, []struct{}{}) }
		case http.MethodPost:
			if post != nil { post(w, r) } else { genericPost(w) }
		case http.MethodPut:
			if put != nil { put(w, r) } else { sendJSON(w, map[string]bool{"ok": true}) }
		case http.MethodDelete:
			if del != nil { del(w, r) } else { sendJSON(w, map[string]bool{"ok": true}) }
		default:
			sendJSON(w, map[string]bool{"ok": true})
		}
	}
}

func router(get, post http.HandlerFunc, put ...http.HandlerFunc) http.HandlerFunc {
	var putHandler http.HandlerFunc
	if len(put) > 0 { putHandler = put[0] }
	return routerWithDelete(get, post, putHandler, nil)
}

func main() {
	err := initDB(filepath.Join(".", "database.sqlite"))
	if err != nil { log.Fatalf("Failed to init db: %v", err) }
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/products", router(getProductsHandler, postProductsHandler))
	mux.HandleFunc("/api/products/", routerWithDelete(getProductsHandler, nil, putProductsHandler, deleteProductHandler))
	mux.HandleFunc("/api/customers", router(getCustomersHandler, postCustomersHandler))
	mux.HandleFunc("/api/employees", router(getEmployeesHandler, nil))
	mux.HandleFunc("/api/orders", router(getOrdersHandler, postOrdersHandler))
	mux.HandleFunc("/api/orders/", routerWithDelete(getOrdersHandler, nil, putOrdersHandler, deleteOrderHandler))
	mux.HandleFunc("/api/shipments", router(getShipmentsHandler, postShipmentsHandler))
	mux.HandleFunc("/api/shipments/", routerWithDelete(nil, nil, nil, deleteShipmentHandler))
	mux.HandleFunc("/api/receipts", router(getReceiptsHandler, postReceiptsHandler))
	mux.HandleFunc("/api/claims", router(getClaimsHandler, postClaimsHandler))
	mux.HandleFunc("/api/claims/", router(getClaimsHandler, nil, putClaimsHandler))
	mux.HandleFunc("/api/stockReceipts", router(getStockReceiptsHandler, postStockReceiptsHandler))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: false,
	})
	srv := &http.Server{ Addr: ":3000", Handler: c.Handler(mux) }
	log.Println("API Server running on http://localhost:3000 (Snake Case DB Mode)")
	srv.ListenAndServe()
}
