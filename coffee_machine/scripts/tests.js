function runTests(print) {
    print('Запуск тестов...');

    const tests = [
        {
            name: 'Проверка списка кофе',
            command: 'coffeelist',
            expected: /1 - Каппучино: 20 рублей\n2 - Эспрессо: 30 рублей\n3 - Латте: 25 рублей\n4 - Американо: 15 рублей/,
            description: 'Должен отобразить список из 4 напитков'
        },
        {
            name: 'Добавление денег',
            command: 'addmoney 50',
            expected: /Добавлено: 50 рублей. Баланс: 50 рублей/,
            description: 'Баланс должен увеличиться на 50 рублей'
        },
        {
            name: 'Выбор кофе (Каппучино)',
            command: 'choosecoffee 1',
            expected: /Выбран: Каппучино/,
            description: 'Должен выбрать Каппучино'
        },
        {
            name: 'Добавление ингредиентов',
            commands: ['addincoffee sugar 1', 'addincoffee milk 1'],
            expected: /Добавлено: 1 сахар. Итоговая цена: 21 рублей\nДобавлено: 1 молоко. Итоговая цена: 23 рублей/,
            description: 'Должны добавиться сахар и молоко с корректной ценой'
        },
        {
            name: 'Оплата заказа',
            command: 'executeorder',
            expected: /Выдан: Каппучино плюс 1 сахар плюс 1 молоко\nСдача: 27 рублей/,
            description: 'Должен выдать заказ и вернуть сдачу'
        },
        {
            name: 'Проверка истории заказов',
            command: 'orderhistory',
            expected: /Заказ #\d+: Каппучино плюс 1 сахар плюс 1 молоко, 23 рублей/,
            description: 'История должна содержать один заказ'
        },
        {
            name: 'Проверка запасов',
            command: 'resourcestatus',
            expected: /cups: 99 шт\ncoffee: 999 г\nwater: 4999 мл\nsugar: 999 г\nmilk: 1999 мл/,
            description: 'Запасы должны уменьшиться на 1 стакан, кофе, воду, сахар и молоко'
        },
        {
            name: 'Ошибка при выборе несуществующего кофе',
            command: 'choosecoffee 5',
            expected: /Напиток не найден для ID: 5/,
            description: 'Должен обработать ошибку для несуществующего ID'
        },
        {
            name: 'Ошибка при недостатке денег',
            command: 'addmoney 10',
            commands: ['choosecoffee 2', 'executeorder'],
            expected: /Не хватает на счету: -20 рублей/,
            description: 'Должен сообщить об недостатке средств'
        }
    ];

    let output = '';
    const originalPrint = print;

    // Перехватываем вывод для проверки
    print = function(message) {
        output += message + '\n';
        originalPrint(message);
    };

    // Выполняем тесты
    tests.forEach((test, index) => {
        print(`\nТест ${index + 1}: ${test.name}`);
        output = ''; // Сбрасываем вывод перед каждым тестом
        if (test.command) {
            processCommand(test.command, print);
        } else if (test.commands) {
            test.commands.forEach(cmd => processCommand(cmd, print));
        }
        const passed = test.expected.test(output);
        print(`Результат: ${passed ? 'Пройден' : 'Не пройден'} (${test.description})`);
        if (!passed) {
            print(`Ожидалось: ${test.expected}`);
            print(`Получено: ${output}`);
        }
    });

    print('Тесты завершены!');
}

// Делаем функцию доступной глобально
window.runTests = runTests;