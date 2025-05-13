// Допустимые номиналы для оплаты
const validCoins = [1, 2, 5, 10];
const validBills = [10, 20, 25, 50, 100, 200];
let balance = 0;
let currentOrder = null;

function loadBalance() {
    // Суммируем все добавленные деньги
    const added = query('SELECT SUM(amount) FROM Transactions WHERE type = "addmoney"')[0][0] || 0;
    // Суммируем все выданные сдачи
    const spent = query('SELECT SUM(amount) FROM Transactions WHERE type = "change"')[0][0] || 0;
    balance = added - spent;
    return balance;
}

function saveBalance() {
    // Сохраняем текущий баланс как отдельную транзакцию
    run('DELETE FROM Transactions WHERE type = "balance"');
    run('INSERT INTO Transactions (amount, type, timestamp) VALUES (?, "balance", ?)', [balance, new Date().toISOString()]);
}

function processCommand(command, print) {
    const [action, ...args] = command.split(' ');

    switch (action) {
        case 'coffeelist':
            print('Список кофе:');
            const coffees = query('SELECT coffee_id, name, price FROM Recipes');
            if (coffees.length === 0) {
                print('Список пуст. База данных не инициализирована?');
            }
            coffees.forEach(([id, name, price]) => print(`${id} - ${name}: ${price} рублей`));
            break;

        case 'addmoney':
            const amount = parseFloat(args[0]);
            if (isNaN(amount) || (!validCoins.includes(amount) && !validBills.includes(amount))) {
                print('Недопустимый номинал. Принимаются: 1, 2, 5, 10, 20, 25, 50, 100, 200 рублей.');
                return;
            }
            balance = loadBalance() + amount;
            run('INSERT INTO Transactions (amount, type, timestamp) VALUES (?, ?, ?)',
                [amount, 'addmoney', new Date().toISOString()]);
            saveBalance();
            print(`Добавлено: ${amount} рублей. Баланс: ${balance} рублей`);
            break;

        case 'choosecoffee':
            const coffeeId = parseInt(args[0]);
            if (isNaN(coffeeId)) {
                print('Неверный выбор напитка');
                return;
            }
            const coffeeResult = query('SELECT name, price, ingredients FROM Recipes WHERE coffee_id = ?', [coffeeId]);
            if (coffeeResult.length === 0) {
                print(`Напиток не найден для ID: ${coffeeId}`);
                return;
            }
            const coffee = coffeeResult[0];
            currentOrder = { coffeeId, sugar: 0, milk: 0, price: coffee[1], name: coffee[0], ingredients: JSON.parse(coffee[2]) };
            print(`Выбран: ${coffee[0]}`);
            break;

        case 'addincoffee':
            if (!currentOrder) {
                print('Сначала выберите кофе');
                return;
            }
            const ingredient = args[0];
            const qty = parseFloat(args[1]);
            if (ingredient === 'sugar' || ingredient === 'milk') {
                const resource = query('SELECT amount FROM Resources WHERE name = ?', [ingredient])[0];
                if (!resource || resource[0] < qty) {
                    print(`${ingredient === 'sugar' ? 'Сахар' : 'Молоко'} закончился`);
                    return;
                }
                currentOrder[ingredient] += qty;
                currentOrder.price += qty * (ingredient === 'sugar' ? 1 : 2);
                print(`Добавлено: ${qty} ${ingredient === 'sugar' ? 'сахар' : 'молоко'}. Итоговая цена: ${currentOrder.price} рублей`);
            } else {
                print('Недопустимый ингредиент');
            }
            break;

        case 'executeorder':
            if (!currentOrder) {
                print('Нет активного заказа');
                return;
            }
            balance = loadBalance();
            if (balance < currentOrder.price) {
                print(`Не хватает на счету: ${balance - currentOrder.price} рублей`);
                return;
            }
            const resources = query('SELECT name, amount FROM Resources');
            const resourceMap = Object.fromEntries(resources);
            const ingredients = { ...currentOrder.ingredients, sugar: currentOrder.sugar, milk: currentOrder.milk, cups: 1 };
            for (const [ing, qty] of Object.entries(ingredients)) {
                if (resourceMap[ing] < qty) {
                    print(`Недостаточно ${ing}`);
                    return;
                }
            }
            for (const [ing, qty] of Object.entries(ingredients)) {
                run('UPDATE Resources SET amount = amount - ? WHERE name = ?', [qty, ing]);
            }
            run('INSERT INTO Orders (coffee_id, sugar, milk, total_price, timestamp) VALUES (?, ?, ?, ?, ?)',
                [currentOrder.coffeeId, currentOrder.sugar, currentOrder.milk, currentOrder.price, new Date().toISOString()]);
            balance -= currentOrder.price;
            saveBalance();
            print(`Выдан: ${currentOrder.name}${currentOrder.sugar ? ` плюс ${currentOrder.sugar} сахар` : ''}${currentOrder.milk ? ` плюс ${currentOrder.milk} молоко` : ''}`);
            if (balance > 0) {
                print(`Сдача: ${balance} рублей`);
                run('INSERT INTO Transactions (amount, type, timestamp) VALUES (?, ?, ?)',
                    [balance, 'change', new Date().toISOString()]);
                balance = 0;
                saveBalance();
            }
            currentOrder = null;
            break;

        case 'resourcestatus':
            const allResources = query('SELECT name, amount, unit FROM Resources');
            print('Запасы:');
            allResources.forEach(([name, amount, unit]) => print(`${name}: ${amount} ${unit}`));
            break;

        case 'fillresourceon':
            const fillName = args[0];
            const fillQty = parseFloat(args[1]);
            const exists = query('SELECT 1 FROM Resources WHERE name = ?', [fillName])[0];
            if (!exists) {
                print('Ресурс не найден');
                return;
            }
            run('UPDATE Resources SET amount = amount + ? WHERE name = ?', [fillQty, fillName]);
            const updated = query('SELECT amount, unit FROM Resources WHERE name = ?', [fillName])[0];
            print(`${fillName} пополнен: ${updated[0]} ${updated[1]}`);
            break;

        case 'orderhistory':
            const orders = query('SELECT order_id, coffee_id, sugar, milk, total_price, timestamp FROM Orders');
            print('История заказов:');
            if (orders.length === 0) {
                print('Заказов нет.');
            }
            orders.forEach(([id, coffeeId, sugar, milk, price, timestamp]) => {
                const coffee = query('SELECT name FROM Recipes WHERE coffee_id = ?', [coffeeId])[0][0];
                print(`Заказ #${id}: ${coffee}${sugar ? ` плюс ${sugar} сахар` : ''}${milk ? ` плюс ${milk} молоко` : ''}, ${price} рублей, ${timestamp}`);
            });
            break;

        default:
            print('Неизвестная команда');
    }
}