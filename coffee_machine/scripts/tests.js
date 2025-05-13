async function runTests(print) {
    print('Запуск тестов...');

    // Полный сброс состояния
    async function resetState() {
        run('DELETE FROM Transactions');
        run('DELETE FROM Orders');
        run('UPDATE Resources SET amount = ? WHERE name = ?', [100, 'cups']);
        run('UPDATE Resources SET amount = ? WHERE name = ?', [1000, 'coffee']);
        run('UPDATE Resources SET amount = ? WHERE name = ?', [5000, 'water']);
        run('UPDATE Resources SET amount = ? WHERE name = ?', [1000, 'sugar']);
        run('UPDATE Resources SET amount = ? WHERE name = ?', [2000, 'milk']);
        balance = 0;
        currentOrder = null;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const tests = [
        {
            name: 'Проверка списка кофе',
            command: 'coffeelist',
            expected: /\d - Каппучино: 20 рублей\n\d - Эспрессо: 30 рублей\n\d - Латте: 25 рублей\n\d - Американо: 15 рублей/,
            description: 'Должен отобразить список из 4 напитков',
            resetBefore: true
        },
        {
            name: 'Добавление денег',
            command: 'addmoney 50',
            expected: /Добавлено: 50 рублей. Баланс: 50 рублей/,
            description: 'Баланс должен увеличиться на 50 рублей',
            resetBefore: true
        },
        {
            name: 'Выбор кофе (Каппучино)',
            command: 'choosecoffee 1',
            expected: /Выбран: Каппучино/,
            description: 'Должен выбрать Каппучино',
            resetBefore: false // Не сбрасываем, чтобы сохранить баланс
        },
        {
            name: 'Добавление ингредиентов',
            commands: ['addincoffee sugar 1', 'addincoffee milk 1'],
            expected: /Добавлено: 1 сахар. Итоговая цена: 21 рублей\nДобавлено: 1 молоко. Итоговая цена: 23 рублей/,
            description: 'Должны добавиться сахар и молоко с корректной ценой',
            resetBefore: false
        },
        {
            name: 'Оплата заказа',
            command: 'executeorder',
            expected: /Выдан: Каппучино плюс 1 сахар плюс 1 молоко\nСдача: 27 рублей/,
            description: 'Должен выдать заказ и вернуть сдачу',
            resetBefore: false
        },
        {
            name: 'Проверка истории заказов',
            command: 'orderhistory',
            expected: /Заказ #\d+: Каппучино плюс 1 сахар плюс 1 молоко, 23 рублей/,
            description: 'История должна содержать один заказ',
            resetBefore: false
        },
        {
            name: 'Проверка запасов',
            command: 'resourcestatus',
            expected: /cups: 99 шт\ncoffee: 999 г\nwater: 4999 мл\nsugar: 999 г\nmilk: 1999 мл/,
            description: 'Запасы должны уменьшиться на 1 стакан, кофе, воду, сахар и молоко',
            resetBefore: false
        },
        {
            name: 'Ошибка при выборе несуществующего кофе',
            command: 'choosecoffee 5',
            expected: /Напиток не найден для ID: 5/,
            description: 'Должен обработать ошибку для несуществующего ID',
            resetBefore: true
        },
        {
            name: 'Ошибка при недостатке денег',
            commands: ['addmoney 10', 'choosecoffee 2', 'executeorder'],
            expected: /Не хватает на счету: -20 рублей/,
            description: 'Должен сообщить об недостатке средств',
            resetBefore: true
        }
    ];

    let output = '';
    const originalPrint = print;

    print = function(message) {
        output += message + '\n';
        originalPrint(message);
    };

    // Последовательное выполнение тестов
    for (let index = 0; index < tests.length; index++) {
        const test = tests[index];
        print(`\nТест ${index + 1}: ${test.name}`);

        if (test.resetBefore) {
            await resetState();
        }

        output = '';

        if (test.command) {
            processCommand(test.command, print);
        } else if (test.commands) {
            test.commands.forEach(cmd => processCommand(cmd, print));
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        const passed = test.expected.test(output);
        print(`Результат: ${passed ? 'Пройден' : 'Не пройден'} (${test.description})`);
        if (!passed) {
            print(`Ожидалось: ${test.expected}`);
            print(`Получено: ${output}`);
        }
    }

    print('Тесты завершены!');
}

window.runTests = runTests;