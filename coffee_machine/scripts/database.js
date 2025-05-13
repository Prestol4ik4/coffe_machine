let db;

async function initDatabase() {
    try {
        // Инициализация базы данных с использованием sql.js
        const SQL = await initSqlJs({ locateFile: () => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.wasm' });
        db = new SQL.Database();

        // Проверка существования таблицы Resources
        const checkTable = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='Resources'");
        if (checkTable.length === 0) {
            // Создаем таблицы, если они не существуют
            db.run(`
                CREATE TABLE Resources (
                    name TEXT PRIMARY KEY,
                    amount INTEGER,
                    unit TEXT
                );
                CREATE TABLE Recipes (
                    coffee_id INTEGER PRIMARY KEY,
                    name TEXT,
                    price INTEGER,
                    ingredients TEXT
                );
                CREATE TABLE Transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    amount INTEGER,
                    type TEXT,
                    timestamp TEXT
                );
                CREATE TABLE Orders (
                    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coffee_id INTEGER,
                    sugar INTEGER DEFAULT 0,
                    milk INTEGER DEFAULT 0,
                    total_price INTEGER,
                    timestamp TEXT
                );
            `);

            // Заполнение начальными данными
            db.run("INSERT INTO Resources (name, amount, unit) VALUES (?, ?, ?)", ['cups', 100, 'шт']);
            db.run("INSERT INTO Resources (name, amount, unit) VALUES (?, ?, ?)", ['coffee', 1000, 'г']);
            db.run("INSERT INTO Resources (name, amount, unit) VALUES (?, ?, ?)", ['water', 5000, 'мл']);
            db.run("INSERT INTO Resources (name, amount, unit) VALUES (?, ?, ?)", ['sugar', 1000, 'г']);
            db.run("INSERT INTO Resources (name, amount, unit) VALUES (?, ?, ?)", ['milk', 2000, 'мл']);
            db.run("INSERT INTO Recipes (coffee_id, name, price, ingredients) VALUES (?, ?, ?, ?)", [1, 'Каппучино', 20, '{"coffee":1,"water":1,"milk":1}']);
            db.run("INSERT INTO Recipes (coffee_id, name, price, ingredients) VALUES (?, ?, ?, ?)", [2, 'Эспрессо', 30, '{"coffee":1,"water":1}']);
            db.run("INSERT INTO Recipes (coffee_id, name, price, ingredients) VALUES (?, ?, ?, ?)", [3, 'Латте', 25, '{"coffee":1,"water":1,"milk":2}']);
            db.run("INSERT INTO Recipes (coffee_id, name, price, ingredients) VALUES (?, ?, ?, ?)", [4, 'Американо', 15, '{"coffee":1,"water":2}']);
            return true; // Успешная инициализация
        }
        return true; // База данных уже существует
    } catch (err) {
        throw new Error(`Ошибка инициализации базы данных: ${err.message}`);
    }
}

function query(sql, params = []) {
    if (!db) throw new Error('База данных не инициализирована');
    const stmt = db.prepare(sql);
    if (params.length > 0) {
        stmt.bind(params);
    }
    const result = [];
    while (stmt.step()) {
        result.push(stmt.get());
    }
    stmt.free();
    return result;
}

function run(sql, params = []) {
    if (!db) throw new Error('База данных не инициализирована');
    db.run(sql, params);
}

// Делаем функции глобальными
window.initDatabase = initDatabase;
window.query = query;
window.run = run;